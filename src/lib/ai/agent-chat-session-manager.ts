import { Chat } from "@ai-sdk/react";
import {
  DirectChatTransport,
  smoothStream,
  type ChatTransport,
  type ProviderMetadata,
  type StreamTextTransform,
  type ToolSet,
  type UIMessage,
} from "ai";
import { db } from "@/lib/database";
import type { AIModelConfig, AIReasoningLevel } from "@/types/ai";
import { createChatPresetAgent } from "./preset-agent";

const INCREMENTAL_SAVE_DEBOUNCE_MS = 400;

export function handleAgentChatPersistenceError(error: unknown) {
  console.error("[agent-chat] persistence failed", error);
}

export type AgentChatPresetType = "main" | "character";

export interface AgentChatRuntime {
  modelConfig: AIModelConfig;
  name: string;
  reasoning: AIReasoningLevel | undefined;
  webSearch: boolean;
}

export interface AgentChatInterjection {
  id: string;
  text: string;
  createdAt: number;
  state: "queued" | "injected";
  stepNumber?: number;
}

export interface AgentChatSession {
  id: string;
  chat: Chat<UIMessage>;
  updateRuntime: (runtime: Partial<AgentChatRuntime>) => void;
  scheduleSave: (messages: UIMessage[]) => void;
  flushSave: (messages: UIMessage[]) => Promise<void>;
  clear: () => Promise<void>;
  isBusy: () => boolean;
  enqueueInterjection: (text: string, createdAt: number) => void;
  getInterjections: () => AgentChatInterjection[];
  subscribeInterjections: (
    listener: (entries: AgentChatInterjection[]) => void,
  ) => () => void;
}

const sessions = new Map<string, AgentChatSession>();
const creating = new Map<string, Promise<AgentChatSession>>();

export function getAgentChatSessionId(
  presetType: AgentChatPresetType,
  presetId: string,
) {
  return `${presetType}:${presetId}`;
}

function cloneMessages(messages: UIMessage[]): UIMessage[] {
  return structuredClone(messages);
}

class AgentInterjectionQueue {
  private entries: AgentChatInterjection[] = [];
  private listeners = new Set<(entries: AgentChatInterjection[]) => void>();

  enqueue(text: string, createdAt: number) {
    this.entries = [
      ...this.entries,
      {
        id: crypto.randomUUID(),
        text,
        createdAt,
        state: "queued",
      },
    ];
    this.publish();
  }

  takeForStep(stepNumber: number) {
    const queued = this.entries.filter((entry) => entry.state === "queued");
    if (queued.length === 0) return [];
    const queuedIds = new Set(queued.map((entry) => entry.id));
    this.entries = this.entries.map((entry) =>
      queuedIds.has(entry.id)
        ? { ...entry, state: "injected" as const, stepNumber }
        : entry,
    );
    this.publish();
    return queued;
  }

  completeInjected() {
    const injected = this.entries.filter(
      (entry) => entry.state === "injected" && entry.stepNumber !== undefined,
    );
    if (injected.length === 0) return [];
    const injectedIds = new Set(injected.map((entry) => entry.id));
    this.entries = this.entries.filter((entry) => !injectedIds.has(entry.id));
    this.publish();
    return injected;
  }

  clear() {
    if (this.entries.length === 0) return;
    this.entries = [];
    this.publish();
  }

  get() {
    return this.entries.map((entry) => ({ ...entry }));
  }

  subscribe(listener: (entries: AgentChatInterjection[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private publish() {
    const snapshot = this.get();
    for (const listener of this.listeners) listener(snapshot);
  }
}

function withReasoningTiming<T extends { providerMetadata?: ProviderMetadata }>(
  part: T,
  timing: {
    reasoningStartedAt: number;
    reasoningFinishedAt?: number;
    reasoningDurationMs?: number;
  },
): T {
  return {
    ...part,
    providerMetadata: {
      ...part.providerMetadata,
      chatluna: {
        ...part.providerMetadata?.chatluna,
        ...timing,
      },
    },
  };
}

function captureReasoningTiming<TOOLS extends ToolSet>(): StreamTextTransform<TOOLS> {
  return () => {
    const starts = new Map<string, number>();

    return new TransformStream({
      transform(part, controller) {
        if (part.type === "reasoning-start") {
          const reasoningStartedAt = Date.now();
          starts.set(part.id, reasoningStartedAt);
          controller.enqueue(
            withReasoningTiming(part, { reasoningStartedAt }),
          );
          return;
        }

        if (part.type === "reasoning-delta") {
          const reasoningStartedAt = starts.get(part.id);
          controller.enqueue(
            reasoningStartedAt === undefined
              ? part
              : withReasoningTiming(part, { reasoningStartedAt }),
          );
          return;
        }

        if (part.type === "reasoning-end") {
          const reasoningFinishedAt = Date.now();
          const reasoningStartedAt =
            starts.get(part.id) ?? reasoningFinishedAt;
          starts.delete(part.id);
          controller.enqueue(
            withReasoningTiming(part, {
              reasoningStartedAt,
              reasoningFinishedAt,
              reasoningDurationMs: reasoningFinishedAt - reasoningStartedAt,
            }),
          );
          return;
        }

        controller.enqueue(part);
      },
    });
  };
}

class PresetAgentChatTransport implements ChatTransport<UIMessage> {
  private runtime: {
    presetId: string;
    presetType: AgentChatPresetType;
  } & AgentChatRuntime;
  private readonly interjections: AgentInterjectionQueue;

  constructor(options: {
    presetId: string;
    presetType: AgentChatPresetType;
    interjections: AgentInterjectionQueue;
  } & AgentChatRuntime) {
    this.runtime = {
      presetId: options.presetId,
      presetType: options.presetType,
      modelConfig: options.modelConfig,
      name: options.name,
      reasoning: options.reasoning,
      webSearch: options.webSearch,
    };
    this.interjections = options.interjections;
  }

  updateRuntime(runtime: Partial<AgentChatRuntime>) {
    if ("modelConfig" in runtime && runtime.modelConfig !== undefined) {
      this.runtime.modelConfig = runtime.modelConfig;
    }
    if ("name" in runtime && runtime.name !== undefined) {
      this.runtime.name = runtime.name;
    }
    if ("reasoning" in runtime) {
      this.runtime.reasoning = runtime.reasoning;
    }
    if ("webSearch" in runtime && runtime.webSearch !== undefined) {
      this.runtime.webSearch = runtime.webSearch;
    }
  }

  sendMessages(
    options: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0],
  ) {
    const responseStartedAt = Date.now();
    const {
      presetId,
      presetType,
      modelConfig,
      name,
      reasoning,
      webSearch,
    } = this.runtime;
    const agent = createChatPresetAgent({
      presetId,
      presetType,
      model: { ...modelConfig },
      name,
      reasoning,
      webSearch,
      takeInterjections: (stepNumber) =>
        this.interjections
          .takeForStep(stepNumber)
          .map(({ text }) => ({ text })),
    });
    const smoothAgent = {
      version: "agent-v1" as const,
      id: agent.id,
      tools: agent.tools,
      generate: (callOptions: Parameters<typeof agent.generate>[0]) =>
        agent.generate(callOptions),
      stream: (callOptions: Parameters<typeof agent.stream>[0]) =>
        agent.stream({
          ...callOptions,
          experimental_transform: [
            captureReasoningTiming(),
            smoothStream({
              delayInMs: 12,
              chunking: new Intl.Segmenter("zh-CN", {
                granularity: "word",
              }),
            }),
          ],
        }),
    };
    const transport = new DirectChatTransport({
      agent: smoothAgent,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return { createdAt: responseStartedAt, responseStartedAt };
        }
        if (part.type === "finish") {
          const responseFinishedAt = Date.now();
          return {
            responseFinishedAt,
            responseDurationMs: responseFinishedAt - responseStartedAt,
          };
        }
        return undefined;
      },
      sendReasoning: true,
      sendSources: true,
    });
    return (transport as unknown as ChatTransport<UIMessage>).sendMessages(
      options,
    );
  }

  reconnectToStream() {
    return Promise.resolve(null);
  }
}

class SessionPersistence {
  private writeChain: Promise<void> = Promise.resolve();
  private revision = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingMessages: UIMessage[] | null = null;
  private pendingRevision = 0;

  constructor(private readonly sessionId: string) {}

  scheduleSave(messages: UIMessage[]) {
    this.pendingMessages = cloneMessages(messages);
    this.pendingRevision = this.revision;

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      const snapshot = this.pendingMessages;
      const revision = this.pendingRevision;
      this.pendingMessages = null;
      if (snapshot) {
        void this.enqueuePersist(snapshot, revision).catch(
          handleAgentChatPersistenceError,
        );
      }
    }, INCREMENTAL_SAVE_DEBOUNCE_MS);
  }

  flush(messages: UIMessage[]) {
    this.cancelDebounce();
    return this.enqueuePersist(cloneMessages(messages), this.revision);
  }

  clear() {
    this.cancelDebounce();
    this.revision += 1;
    const revision = this.revision;
    return this.enqueue(async () => {
      if (revision !== this.revision) return;
      await db.agentChats.delete(this.sessionId);
    });
  }

  private cancelDebounce() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingMessages = null;
  }

  private enqueuePersist(messages: UIMessage[], revision: number) {
    return this.enqueue(async () => {
      if (revision !== this.revision) return;

      if (messages.length === 0) {
        await db.agentChats.delete(this.sessionId);
        return;
      }

      await db.agentChats.put({
        id: this.sessionId,
        messages,
        updatedAt: Date.now(),
      });
    });
  }

  private enqueue(task: () => Promise<void>) {
    const next = this.writeChain.then(task, task);
    this.writeChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

function splitAssistantWithInterjections(
  message: UIMessage,
  interjections: AgentChatInterjection[],
): UIMessage[] {
  if (message.role !== "assistant" || interjections.length === 0) {
    return [message];
  }
  const stepStartIndices = message.parts.reduce<number[]>((indices, part, index) => {
    if (part.type === "step-start") indices.push(index);
    return indices;
  }, []);
  const groups = new Map<number, AgentChatInterjection[]>();
  for (const entry of interjections) {
    if (entry.stepNumber === undefined) continue;
    const group = groups.get(entry.stepNumber) ?? [];
    group.push(entry);
    groups.set(entry.stepNumber, group);
  }

  const output: UIMessage[] = [];
  const unmatched: AgentChatInterjection[] = [];
  let cursor = 0;
  let segmentIndex = 0;
  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? (message.metadata as Record<string, unknown>)
      : {};
  const intermediateMetadata =
    typeof metadata.createdAt === "number"
      ? { createdAt: metadata.createdAt }
      : undefined;

  for (const [stepNumber, entries] of Array.from(groups.entries()).sort(
    ([left], [right]) => left - right,
  )) {
    const boundary = stepStartIndices[stepNumber];
    if (boundary === undefined || boundary < cursor) {
      unmatched.push(...entries);
      continue;
    }
    const parts = message.parts.slice(cursor, boundary);
    if (parts.length > 0) {
      output.push({
        ...message,
        id: `${message.id}-before-${segmentIndex}`,
        parts,
        metadata: intermediateMetadata,
      });
      segmentIndex += 1;
    }
    output.push(
      ...entries.map(
        (entry): UIMessage => ({
          id: entry.id,
          role: "user",
          metadata: { createdAt: entry.createdAt, interjected: true },
          parts: [{ type: "text", text: entry.text }],
        }),
      ),
    );
    cursor = boundary;
  }

  const finalParts = message.parts.slice(cursor);
  if (finalParts.length > 0 || output.length === 0) {
    output.push({ ...message, parts: finalParts });
  }
  output.push(
    ...unmatched.map(
      (entry): UIMessage => ({
        id: entry.id,
        role: "user",
        metadata: { createdAt: entry.createdAt, interjected: true },
        parts: [{ type: "text", text: entry.text }],
      }),
    ),
  );
  return output;
}

function mergeInjectedMessages(
  messages: UIMessage[],
  assistantMessageId: string,
  interjections: AgentChatInterjection[],
) {
  if (interjections.length === 0) return messages;
  return messages.flatMap((message) =>
    message.id === assistantMessageId
      ? splitAssistantWithInterjections(message, interjections)
      : [message],
  );
}

async function createAgentChatSession(
  sessionId: string,
  presetType: AgentChatPresetType,
  presetId: string,
  runtime: AgentChatRuntime,
): Promise<AgentChatSession> {
  const record = await db.agentChats.get(sessionId);
  const initialMessages = record?.messages ?? [];
  const interjections = new AgentInterjectionQueue();
  const transport = new PresetAgentChatTransport({
    presetId,
    presetType,
    modelConfig: runtime.modelConfig,
    name: runtime.name,
    reasoning: runtime.reasoning,
    webSearch: runtime.webSearch,
    interjections,
  });
  const persistence = new SessionPersistence(sessionId);

  const chatRef: { current: Chat<UIMessage> | null } = { current: null };
  const chat = new Chat({
    id: sessionId,
    messages: initialMessages,
    transport,
    onFinish: ({ message, messages, isAbort }) => {
      const responseFinishedAt = Date.now();
      const metadata =
        message.metadata && typeof message.metadata === "object"
          ? (message.metadata as Record<string, unknown>)
          : {};
      let lastInput: UIMessage | undefined;
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        if (messages[index].role === "user") {
          lastInput = messages[index];
          break;
        }
      }
      const lastInputMetadata =
        lastInput?.metadata && typeof lastInput.metadata === "object"
          ? (lastInput.metadata as Record<string, unknown>)
          : {};
      const responseStartedAt =
        typeof metadata.responseStartedAt === "number"
          ? metadata.responseStartedAt
          : typeof lastInputMetadata.createdAt === "number"
            ? lastInputMetadata.createdAt
            : responseFinishedAt;
      const completedMessage: UIMessage = {
        ...message,
        metadata: {
          ...metadata,
          createdAt:
            typeof metadata.createdAt === "number"
              ? metadata.createdAt
              : responseStartedAt,
          responseStartedAt,
          responseFinishedAt,
          responseDurationMs: Math.max(
            0,
            responseFinishedAt - responseStartedAt,
          ),
          ...(isAbort ? { stopped: true } : {}),
        },
      };
      const messageIndex = messages.findIndex(
        (item) => item.id === completedMessage.id,
      );
      const completedMessages =
        messageIndex >= 0
          ? messages.map((item, index) =>
              index === messageIndex ? completedMessage : item,
            )
          : [...messages, completedMessage];
      const finalizedMessages = mergeInjectedMessages(
        completedMessages,
        completedMessage.id,
        interjections.completeInjected(),
      );

      if (chatRef.current) {
        chatRef.current.messages = finalizedMessages;
      }
      void persistence
        .flush(finalizedMessages)
        .catch(handleAgentChatPersistenceError);
    },
    onError: () => {
      const injected = interjections.completeInjected();
      const current = chatRef.current;
      if (current) {
        const latestAssistant = [...current.messages]
          .reverse()
          .find((message) => message.role === "assistant");
        const finalizedMessages = latestAssistant
          ? mergeInjectedMessages(
              current.messages,
              latestAssistant.id,
              injected,
            )
          : current.messages;
        current.messages = finalizedMessages;
        void persistence
          .flush(finalizedMessages)
          .catch(handleAgentChatPersistenceError);
      }
    },
  });
  chatRef.current = chat;

  const session: AgentChatSession = {
    id: sessionId,
    chat,
    updateRuntime: (partial) => {
      transport.updateRuntime(partial);
    },
    scheduleSave: (messages) => {
      persistence.scheduleSave(messages);
    },
    flushSave: (messages) => persistence.flush(messages),
    clear: async () => {
      if (session.isBusy()) return;
      interjections.clear();
      await persistence.clear();
      chat.messages = [];
    },
    isBusy: () => {
      const status = chat.status;
      return status === "submitted" || status === "streaming";
    },
    enqueueInterjection: (text, createdAt) => {
      interjections.enqueue(text, createdAt);
    },
    getInterjections: () => interjections.get(),
    subscribeInterjections: (listener) => interjections.subscribe(listener),
  };

  sessions.set(sessionId, session);
  return session;
}

export async function getOrCreateAgentChatSession(
  presetType: AgentChatPresetType,
  presetId: string,
  runtime: AgentChatRuntime,
): Promise<AgentChatSession> {
  const sessionId = getAgentChatSessionId(presetType, presetId);
  const existing = sessions.get(sessionId);
  if (existing) {
    existing.updateRuntime(runtime);
    return existing;
  }

  let pending = creating.get(sessionId);
  if (!pending) {
    pending = createAgentChatSession(
      sessionId,
      presetType,
      presetId,
      runtime,
    ).finally(() => {
      creating.delete(sessionId);
    });
    creating.set(sessionId, pending);
  }

  const session = await pending;
  session.updateRuntime(runtime);
  return session;
}
