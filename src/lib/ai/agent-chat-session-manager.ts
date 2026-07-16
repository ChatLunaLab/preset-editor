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

function hasMessageParts(message: UIMessage): boolean {
  const parts = (message as { parts?: unknown }).parts;
  return Array.isArray(parts) && parts.length > 0;
}

/** Sole persistence gate: keep only UIMessages with non-empty parts. */
function snapshotPersistableMessages(messages: UIMessage[]): UIMessage[] {
  return structuredClone(messages.filter(hasMessageParts));
}

type InsertedInterjection = AgentChatInterjection & {
  state: "injected";
  stepNumber: number;
};

type DeferredInterjection = AgentChatInterjection & {
  state: "queued";
  stepNumber?: undefined;
};

function isInsertedInterjection(
  entry: AgentChatInterjection,
): entry is InsertedInterjection {
  return entry.state === "injected" && entry.stepNumber !== undefined;
}

function isDeferredInterjection(
  entry: AgentChatInterjection,
): entry is DeferredInterjection {
  return entry.state === "queued";
}

/**
 * Manages human-in-the-loop interjections for a single agent run.
 * Queued items are either consumed by prepareStep (injected) or returned as
 * deferred on finishRun when no further step occurs.
 */
class HumanLoopController {
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

  /** Atomically promote all currently queued items to injected for this step. */
  consumeForStep(stepNumber: number): AgentChatInterjection[] {
    const queued = this.entries.filter((entry) => entry.state === "queued");
    if (queued.length === 0) return [];
    const queuedIds = new Set(queued.map((entry) => entry.id));
    this.entries = this.entries.map((entry) =>
      queuedIds.has(entry.id)
        ? { ...entry, state: "injected" as const, stepNumber }
        : entry,
    );
    this.publish();
    return queued.map((entry) => ({
      ...entry,
      state: "injected" as const,
      stepNumber,
    }));
  }

  /**
   * End the current run: return inserted (model-consumed) and deferred
   * (still queued, no next prepareStep), then clear controller state.
   */
  finishRun(): {
    inserted: InsertedInterjection[];
    deferred: DeferredInterjection[];
  } {
    const inserted = this.entries.filter(isInsertedInterjection);
    const deferred = this.entries.filter(isDeferredInterjection);
    if (this.entries.length > 0) {
      this.entries = [];
      this.publish();
    }
    return {
      inserted: inserted.map((entry) => ({ ...entry })),
      deferred: deferred.map((entry) => ({ ...entry })),
    };
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

function interjectionToUserMessage(entry: AgentChatInterjection): UIMessage {
  return {
    id: entry.id,
    role: "user",
    metadata: { createdAt: entry.createdAt, interjected: true },
    parts: [{ type: "text", text: entry.text }],
  };
}

/**
 * Pure finalizer for one agent run's UI history.
 * Replaces/appends completedMessage, then splices inserted user messages at
 * the real step-start boundaries of the assistant message.
 */
function finalizeHumanLoopRun(
  messages: UIMessage[],
  completedMessage: UIMessage,
  inserted: InsertedInterjection[],
): UIMessage[] {
  const messageIndex = messages.findIndex(
    (item) => item.id === completedMessage.id,
  );
  const finalizedTurn =
    inserted.length > 0
      ? insertInterjectionsIntoAssistant(completedMessage, inserted)
      : hasMessageParts(completedMessage)
        ? [completedMessage]
        : [];

  if (messageIndex < 0) {
    return [...messages, ...finalizedTurn];
  }

  return [
    ...messages.slice(0, messageIndex),
    ...finalizedTurn,
    ...messages.slice(messageIndex + 1),
  ];
}

function insertInterjectionsIntoAssistant(
  message: UIMessage,
  interjections: InsertedInterjection[],
): UIMessage[] {
  if (message.role !== "assistant") {
    return [message, ...interjections.map(interjectionToUserMessage)];
  }

  const parts = Array.isArray(message.parts) ? message.parts : [];
  const stepStartIndices = parts.reduce<number[]>((indices, part, index) => {
    if (part.type === "step-start") indices.push(index);
    return indices;
  }, []);

  const groups = new Map<number, InsertedInterjection[]>();
  for (const entry of interjections) {
    const group = groups.get(entry.stepNumber) ?? [];
    group.push(entry);
    groups.set(entry.stepNumber, group);
  }

  const output: UIMessage[] = [];
  const fallback: InsertedInterjection[] = [];
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
      // Local fallback: no matching step-start; place after existing assistant parts.
      fallback.push(...entries);
      continue;
    }

    const segmentParts = parts.slice(cursor, boundary);
    if (segmentParts.length > 0) {
      output.push({
        ...message,
        id: `${message.id}-before-${segmentIndex}`,
        parts: segmentParts,
        metadata: intermediateMetadata,
      });
      segmentIndex += 1;
    }
    output.push(...entries.map(interjectionToUserMessage));
    cursor = boundary;
  }

  const finalParts = parts.slice(cursor);
  if (finalParts.length > 0) {
    output.push({ ...message, parts: finalParts });
  }

  // Unmatched / missing-boundary items go after whatever assistant content exists.
  if (fallback.length > 0) {
    output.push(...fallback.map(interjectionToUserMessage));
  }

  // Empty completed assistant must not enter the result as parts: [].
  if (output.length === 0) {
    return interjections.map(interjectionToUserMessage);
  }

  return output;
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
  private readonly humanLoop: HumanLoopController;

  constructor(options: {
    presetId: string;
    presetType: AgentChatPresetType;
    humanLoop: HumanLoopController;
  } & AgentChatRuntime) {
    this.runtime = {
      presetId: options.presetId,
      presetType: options.presetType,
      modelConfig: options.modelConfig,
      name: options.name,
      reasoning: options.reasoning,
      webSearch: options.webSearch,
    };
    this.humanLoop = options.humanLoop;
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
        this.humanLoop
          .consumeForStep(stepNumber)
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
    // Intentionally no pre-send message filtering.
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
    this.pendingMessages = snapshotPersistableMessages(messages);
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
    return this.enqueuePersist(
      snapshotPersistableMessages(messages),
      this.revision,
    );
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

function buildCompletedAssistantMessage(
  message: UIMessage,
  messages: UIMessage[],
  isAbort: boolean,
): UIMessage {
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
  return {
    ...message,
    metadata: {
      ...metadata,
      createdAt:
        typeof metadata.createdAt === "number"
          ? metadata.createdAt
          : responseStartedAt,
      responseStartedAt,
      responseFinishedAt,
      responseDurationMs: Math.max(0, responseFinishedAt - responseStartedAt),
      ...(isAbort ? { stopped: true } : {}),
    },
  };
}

async function createAgentChatSession(
  sessionId: string,
  presetType: AgentChatPresetType,
  presetId: string,
  runtime: AgentChatRuntime,
): Promise<AgentChatSession> {
  const record = await db.agentChats.get(sessionId);
  const storedMessages = record?.messages ?? [];
  const initialMessages = snapshotPersistableMessages(storedMessages);
  const humanLoop = new HumanLoopController();
  const transport = new PresetAgentChatTransport({
    presetId,
    presetType,
    modelConfig: runtime.modelConfig,
    name: runtime.name,
    reasoning: runtime.reasoning,
    webSearch: runtime.webSearch,
    humanLoop,
  });
  const persistence = new SessionPersistence(sessionId);
  if (record && initialMessages.length !== storedMessages.length) {
    void persistence.flush(initialMessages).catch(handleAgentChatPersistenceError);
  }

  const chatRef: { current: Chat<UIMessage> | null } = { current: null };
  const chat = new Chat({
    id: sessionId,
    messages: initialMessages,
    transport,
    // Single settlement path for success / abort / error (AI SDK always calls onFinish).
    onFinish: ({ message, messages, isAbort, isError }) => {
      const completedMessage = buildCompletedAssistantMessage(
        message,
        messages,
        isAbort,
      );
      const { inserted, deferred } = humanLoop.finishRun();
      const finalizedMessages = finalizeHumanLoopRun(
        messages,
        completedMessage,
        inserted,
      );

      if (chatRef.current) {
        chatRef.current.messages = finalizedMessages;
      }
      void persistence
        .flush(finalizedMessages)
        .catch(handleAgentChatPersistenceError);

      if (deferred.length === 0) return;

      const deferredUserMessages = deferred.map(interjectionToUserMessage);

      if (isAbort || isError) {
        // Persist deferred as plain user messages; do not auto-restart.
        const withDeferred = [...finalizedMessages, ...deferredUserMessages];
        if (chatRef.current) {
          chatRef.current.messages = withDeferred;
        }
        void persistence
          .flush(withDeferred)
          .catch(handleAgentChatPersistenceError);
        return;
      }

      // Wait for AI SDK to clear activeResponse before starting the next request.
      queueMicrotask(() => {
        const activeChat = chatRef.current;
        if (!activeChat) return;
        activeChat.messages = [
          ...activeChat.messages,
          ...deferredUserMessages,
        ];
        void persistence
          .flush(activeChat.messages)
          .catch(handleAgentChatPersistenceError);
        void activeChat.sendMessage().catch(handleAgentChatPersistenceError);
      });
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
      humanLoop.clear();
      await persistence.clear();
      chat.messages = [];
    },
    isBusy: () => {
      const status = chat.status;
      return status === "submitted" || status === "streaming";
    },
    enqueueInterjection: (text, createdAt) => {
      humanLoop.enqueue(text, createdAt);
    },
    getInterjections: () => humanLoop.get(),
    subscribeInterjections: (listener) => humanLoop.subscribe(listener),
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
