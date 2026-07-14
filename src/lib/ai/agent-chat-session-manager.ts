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

export type AgentChatPresetType = "main" | "character";

export interface AgentChatRuntime {
  modelConfig: AIModelConfig;
  name: string;
  reasoning: AIReasoningLevel | undefined;
  webSearch: boolean;
}

export interface AgentChatSession {
  id: string;
  chat: Chat<UIMessage>;
  updateRuntime: (runtime: Partial<AgentChatRuntime>) => void;
  scheduleSave: (messages: UIMessage[]) => void;
  flushSave: (messages: UIMessage[]) => Promise<void>;
  clear: () => Promise<void>;
  isBusy: () => boolean;
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

  constructor(options: {
    presetId: string;
    presetType: AgentChatPresetType;
  } & AgentChatRuntime) {
    this.runtime = {
      presetId: options.presetId,
      presetType: options.presetType,
      modelConfig: options.modelConfig,
      name: options.name,
      reasoning: options.reasoning,
      webSearch: options.webSearch,
    };
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
        void this.enqueuePersist(snapshot, revision);
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

async function createAgentChatSession(
  sessionId: string,
  presetType: AgentChatPresetType,
  presetId: string,
  runtime: AgentChatRuntime,
): Promise<AgentChatSession> {
  const record = await db.agentChats.get(sessionId);
  const initialMessages = record?.messages ?? [];
  const transport = new PresetAgentChatTransport({
    presetId,
    presetType,
    modelConfig: runtime.modelConfig,
    name: runtime.name,
    reasoning: runtime.reasoning,
    webSearch: runtime.webSearch,
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

      if (chatRef.current) {
        chatRef.current.messages = completedMessages;
      }
      void persistence.flush(completedMessages);
    },
    onError: () => {
      const current = chatRef.current;
      if (current) {
        void persistence.flush(current.messages);
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
      await persistence.clear();
      chat.messages = [];
    },
    isBusy: () => {
      const status = chat.status;
      return status === "submitted" || status === "streaming";
    },
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
