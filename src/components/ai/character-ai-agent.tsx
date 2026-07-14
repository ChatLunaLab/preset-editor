"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import type { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  AI_REASONING_LABELS,
  type AIModelConfig,
  type AIReasoningLevel,
} from "@/types/ai";
import { useAIModelConfigs } from "@/hooks/use-ai-model-configs";
import { useModelReasoningLevels } from "@/hooks/use-model-reasoning-levels";
import { isAIModelConfigReady } from "@/lib/ai/model-config";
import {
  getAgentChatSessionId,
  getOrCreateAgentChatSession,
  type AgentChatSession,
} from "@/lib/ai/agent-chat-session-manager";
import {
  BookOpenTextIcon,
  BrainCircuitIcon,
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  SearchIcon,
  Settings2,
  SparklesIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeAIErrorMessage } from "@/lib/ai/error-sanitize";
import { PresetMessageParts } from "./preset-message-parts";

const STARTER_ACTIONS = [
  {
    title: "理解当前预设",
    prompt: "阅读当前预设，梳理它的定位、结构和可以改进的地方，先不要修改。",
    icon: SearchIcon,
    iconClassName: "text-sky-500",
  },
  {
    title: "优化核心内容",
    prompt: "分析当前预设的核心内容，优化角色设定、提示词和对话风格，并直接应用合适的修改。",
    icon: SparklesIcon,
    iconClassName: "text-violet-500",
  },
  {
    title: "补充背景与细节",
    prompt: "根据当前预设补充有用的背景、细节或世界书设定，并直接应用。",
    icon: BookOpenTextIcon,
    iconClassName: "text-emerald-500",
  },
  {
    title: "检查并修复问题",
    prompt: "检查当前预设的结构、模板和内容问题，并直接修复可以安全处理的问题。",
    icon: WrenchIcon,
    iconClassName: "text-orange-500",
  },
];

const THINKING_MESSAGES = [
  "正在观测世界线",
  "脑内会议进行中",
  "技能读条中",
  "大招咏唱中",
  "魔力充能中",
  "回收立下的 Flag",
  "激活主角光环",
  "写入新存档",
  "经费燃烧中",
  "同步率攀升中",
  "小宇宙爆发中",
  "脑回路对接中",
  "正在脑补剧场版",
  "检索中二台词",
] as const;

interface CharacterAIAgentProps {
  presetId: string;
  presetType: "main" | "character";
  name?: string;
  onNewChatActionChange?: (
    action: (() => void) | null,
    canStart: boolean,
  ) => void;
}

export function CharacterAIAgent({
  presetId,
  presetType,
  name = "Character Agent",
  onNewChatActionChange,
}: CharacterAIAgentProps) {
  const {
    configs,
    activeConfig,
    isActiveReady,
    updateConfig,
    setActiveConfigId,
  } = useAIModelConfigs();
  const reasoningLevels = useModelReasoningLevels(
    activeConfig ?? {
      id: "",
      name: "",
      provider: "openai",
      apiKey: "",
      baseUrl: "",
      model: "",
      reasoning: "medium",
    },
  );

  if (!isActiveReady || !activeConfig) {
    return (
      <Conversation className="min-h-[calc(100dvh-11rem)] flex-none overflow-visible">
        <ConversationContent className="min-h-full">
          <ConversationEmptyState
            icon={<Settings2 className="size-8" />}
            title="请先配置活动模型"
            description="打开侧边栏「设置」→「AI 模型」，填写 API Key、Base URL 和模型 ID 并设为当前使用。"
          />
        </ConversationContent>
      </Conversation>
    );
  }

  let reasoning = reasoningLevels[0];
  if (reasoningLevels.includes(activeConfig.reasoning)) {
    reasoning = activeConfig.reasoning;
  } else if (reasoningLevels.includes("medium")) {
    reasoning = "medium";
  }

  return (
    <CharacterAIAgentSession
      presetId={presetId}
      presetType={presetType}
      name={name}
      modelConfig={activeConfig}
      modelLabel={activeConfig.model}
      reasoning={reasoning}
      reasoningLevels={reasoningLevels}
      modelOptions={configs.filter(isAIModelConfigReady)}
      onModelChange={setActiveConfigId}
      onReasoningChange={(nextReasoning) =>
        updateConfig(activeConfig.id, { reasoning: nextReasoning })
      }
      onNewChatActionChange={onNewChatActionChange}
    />
  );
}

function CharacterAIAgentSession({
  presetId,
  presetType,
  name,
  modelConfig,
  modelLabel,
  reasoning,
  reasoningLevels,
  modelOptions,
  onModelChange,
  onReasoningChange,
  onNewChatActionChange,
}: {
  presetId: string;
  presetType: "main" | "character";
  name: string;
  modelConfig: AIModelConfig;
  modelLabel: string;
  reasoning: AIReasoningLevel | undefined;
  reasoningLevels: AIReasoningLevel[];
  modelOptions: AIModelConfig[];
  onModelChange: (modelId: string) => void;
  onReasoningChange: (reasoning: AIReasoningLevel) => void;
  onNewChatActionChange?: CharacterAIAgentProps["onNewChatActionChange"];
}) {
  const [session, setSession] = useState<AgentChatSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getOrCreateAgentChatSession(presetType, presetId, {
      modelConfig,
      name,
      reasoning,
      webSearch: false,
    }).then((nextSession) => {
      if (!cancelled) {
        setSession(nextSession);
      }
    });

    return () => {
      cancelled = true;
    };
    // Session identity is preset-scoped; runtime is synced separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preset identity only
  }, [presetId, presetType]);

  useEffect(() => {
    if (session?.id !== getAgentChatSessionId(presetType, presetId)) return;
    session.updateRuntime({ modelConfig, name, reasoning });
  }, [session, presetId, presetType, modelConfig, name, reasoning]);

  const sessionMatches =
    session !== null &&
    session.id === getAgentChatSessionId(presetType, presetId);

  if (!sessionMatches || !session) {
    return <div className="h-full" />;
  }

  return (
    <CharacterAIAgentChat
      session={session}
      modelLabel={modelLabel}
      reasoning={reasoning}
      reasoningLevels={reasoningLevels}
      activeModelId={modelConfig.id}
      modelOptions={modelOptions}
      onModelChange={onModelChange}
      onReasoningChange={onReasoningChange}
      onNewChatActionChange={onNewChatActionChange}
    />
  );
}

function CharacterAIAgentChat({
  session,
  modelLabel,
  reasoning,
  reasoningLevels,
  activeModelId,
  modelOptions,
  onModelChange,
  onReasoningChange,
  onNewChatActionChange,
}: {
  session: AgentChatSession;
  modelLabel: string;
  reasoning: AIReasoningLevel | undefined;
  reasoningLevels: AIReasoningLevel[];
  activeModelId: string;
  modelOptions: AIModelConfig[];
  onModelChange: (modelId: string) => void;
  onReasoningChange: (reasoning: AIReasoningLevel) => void;
  onNewChatActionChange?: CharacterAIAgentProps["onNewChatActionChange"];
}) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    clearError,
  } = useChat({
    chat: session.chat,
    throttle: 50,
  });
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);
  const [inputContainerRef, inputBounds] = useMeasure();
  const messagesRef = useRef(messages);
  const inputHeight = Math.max(inputBounds.height, 112);
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    session.updateRuntime({ webSearch });
  }, [session, webSearch]);

  useEffect(() => {
    session.scheduleSave(messages);
  }, [session, messages]);

  useEffect(() => {
    return () => {
      void session.flushSave(messagesRef.current);
    };
  }, [session]);

  useEffect(() => {
    if (!isBusy) return;
    const interval = window.setInterval(() => {
      setThinkingMessageIndex(
        (current) => (current + 1) % THINKING_MESSAGES.length,
      );
    }, 2400);
    return () => window.clearInterval(interval);
  }, [isBusy]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isBusy) return;
    const createdAt = Date.now();
    session.updateRuntime({ webSearch });
    clearError();
    setInput("");
    await sendMessage({ text, metadata: { createdAt } });
  };

  const handleSuggestion = async (suggestion: string, createdAt: number) => {
    if (isBusy) return;
    session.updateRuntime({ webSearch });
    clearError();
    await sendMessage({
      text: suggestion,
      metadata: { createdAt },
    });
  };

  const handleCopyMessage = async (message: UIMessage) => {
    const text = getMessageText(message);
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopiedMessageId(message.id);
    window.setTimeout(() => {
      setCopiedMessageId((current) =>
        current === message.id ? null : current,
      );
    }, 1200);
  };

  const handleClearChat = useCallback(() => {
    clearError();
    setWebSearch(false);
    void session.clear();
  }, [clearError, session]);

  useEffect(() => {
    onNewChatActionChange?.(
      handleClearChat,
      !isBusy && messages.length > 0,
    );
  }, [handleClearChat, isBusy, messages.length, onNewChatActionChange]);

  useEffect(
    () => () => onNewChatActionChange?.(null, false),
    [onNewChatActionChange],
  );

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <Conversation className="h-full min-h-0">
        <ConversationContent
          aria-busy={isBusy}
          className="mx-auto min-h-full w-full max-w-4xl gap-8 px-1 py-6 sm:px-4"
          style={{
            paddingTop: "calc(var(--agent-header-height) + 1.5rem)",
            paddingBottom: inputHeight + 48,
          }}
        >
          {messages.length === 0 ? (
            <div className="flex min-h-[30rem] flex-col items-center justify-center px-1 py-10 sm:px-0">
              <BrainCircuitIcon
                aria-hidden="true"
                className="size-14 stroke-[1.4] text-muted-foreground/55"
              />
              <h2 className="mt-6 text-center text-2xl font-medium tracking-tight sm:text-3xl">
                想怎么完善这个预设？
              </h2>
              <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {STARTER_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.title}
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        handleSuggestion(action.prompt, Date.now())
                      }
                      className="flex min-h-32 flex-col items-start justify-between rounded-2xl border bg-card/35 p-5 text-left transition-colors duration-150 hover:border-foreground/15 hover:bg-accent/55 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Icon
                        className={cn(
                          "size-4",
                          action.iconClassName,
                        )}
                      />
                      <span className="max-w-40 text-base font-medium leading-snug">
                        {action.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const messageText = getMessageText(message);
              const createdAt = getMessageCreatedAt(message);
              const isStreamingAssistant =
                status === "streaming" &&
                message.role === "assistant" &&
                message.id === lastMessage?.id;
              const showMessageActions =
                message.role === "user" ||
                (message.role === "assistant" &&
                  Boolean(messageText) &&
                  !isStreamingAssistant);

              return (
                <Message
                  key={message.id}
                  from={message.role}
                  className="relative"
                >
                  <MessageContent
                    className={cn(
                      message.role === "assistant" && "w-full max-w-full",
                    )}
                  >
                    <PresetMessageParts
                      message={message}
                      isStreaming={isStreamingAssistant}
                      thinkingMessage={
                        THINKING_MESSAGES[thinkingMessageIndex]
                      }
                    />
                  </MessageContent>
                  {showMessageActions && (
                    <MessageActions
                      className={cn(
                        "pointer-events-none absolute top-full z-10 mt-2 gap-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                        message.role === "user" ? "right-0" : "left-0",
                      )}
                    >
                      {messageText && (
                      <MessageAction
                        size="icon-xs"
                        className="text-muted-foreground active:!translate-y-0"
                        label="复制消息"
                        onClick={() => void handleCopyMessage(message)}
                      >
                        {copiedMessageId === message.id ? (
                          <CheckIcon className="size-3.5" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                      </MessageAction>
                      )}
                      {createdAt && (
                        <time className="px-3 text-xs text-muted-foreground/70">
                          {formatMessageTime(createdAt)}
                        </time>
                      )}
                    </MessageActions>
                  )}
                </Message>
              );
            })
          )}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="text-sm text-muted-foreground">
                <Shimmer duration={1.4}>
                  {THINKING_MESSAGES[thinkingMessageIndex]}
                </Shimmer>
              </MessageContent>
            </Message>
          )}

          {error && (
            <Message from="assistant">
              <MessageContent className="text-destructive">
                <MessageResponse>{sanitizeAIErrorMessage(error.message)}</MessageResponse>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton
          className="border-border/60 bg-muted/70 shadow-md shadow-black/10 backdrop-blur-xl hover:bg-muted/85 dark:bg-card/70 dark:shadow-black/30 dark:hover:bg-card/85"
          style={{ bottom: inputHeight + 36 }}
        />
      </Conversation>

      <div
        ref={inputContainerRef}
        className="absolute inset-x-0 bottom-3 z-10 mx-auto w-full max-w-4xl rounded-3xl bg-muted/75 shadow-lg shadow-black/10 backdrop-blur-xl dark:bg-card/75 dark:shadow-black/40"
      >
        <PromptInput
          className="[&_[data-slot=input-group]]:rounded-3xl [&_[data-slot=input-group]]:border-border/70 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:focus-within:bg-transparent [&_[data-slot=input-group]]:dark:bg-transparent [&_[data-slot=input-group]]:dark:focus-within:bg-transparent [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:border-border/70 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PromptInputTextarea
              className="min-h-16 bg-transparent px-4 py-3 focus:bg-transparent dark:bg-transparent"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入修改意图，Enter 发送，Shift+Enter 换行"
              aria-label="Agent 聊天输入"
            />
          </PromptInputBody>
          <PromptInputFooter className="px-3 pb-3 pt-1">
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger
                  className="rounded-none hover:bg-transparent aria-expanded:bg-transparent focus-visible:border-transparent focus-visible:ring-0 active:translate-y-0 dark:hover:bg-transparent"
                  size="icon-sm"
                  aria-label="打开工具菜单"
                  disabled={isBusy}
                />
                <PromptInputActionMenuContent
                  side="top"
                  align="start"
                  className="w-56"
                >
                  <DropdownMenuLabel>工具</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={webSearch}
                    onCheckedChange={(checked) =>
                      setWebSearch(checked === true)
                    }
                    onSelect={(event) => event.preventDefault()}
                    className="px-2 py-1.5"
                  >
                    <GlobeIcon className="size-4" />
                    <span className="flex-1">Web Search</span>
                    {webSearch && (
                      <CheckIcon className="size-4 text-foreground" />
                    )}
                  </DropdownMenuCheckboxItem>
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              {webSearch && (
                <PromptInputButton
                  className="group h-8 rounded-full px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:!translate-y-0 dark:hover:bg-muted"
                  size="sm"
                  aria-label="关闭 Web Search"
                  disabled={isBusy}
                  onClick={() => setWebSearch(false)}
                >
                  <span className="relative size-4 shrink-0">
                    <GlobeIcon className="absolute inset-0 size-4 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" />
                    <XIcon className="absolute inset-0 size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </span>
                  <span>Web Search</span>
                </PromptInputButton>
              )}
            </PromptInputTools>
            <div className="flex shrink-0 items-center gap-1">
              <ModelReasoningMenu
                activeModelId={activeModelId}
                modelLabel={modelLabel}
                modelOptions={modelOptions}
                reasoning={reasoning}
                reasoningLevels={reasoningLevels}
                disabled={isBusy}
                onModelChange={onModelChange}
                onReasoningChange={onReasoningChange}
              />
              <PromptInputSubmit
                className="rounded-full"
                status={status}
                onStop={stop}
                disabled={!input.trim() && !isBusy}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function getMessageCreatedAt(message: UIMessage) {
  if (!message.metadata || typeof message.metadata !== "object") return null;
  const createdAt = (message.metadata as { createdAt?: unknown }).createdAt;
  return typeof createdAt === "number" && Number.isFinite(createdAt)
    ? createdAt
    : null;
}

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ModelReasoningMenu({
  activeModelId,
  modelLabel,
  modelOptions,
  reasoning,
  reasoningLevels,
  disabled,
  onModelChange,
  onReasoningChange,
}: {
  activeModelId: string;
  modelLabel: string;
  modelOptions: AIModelConfig[];
  reasoning: AIReasoningLevel | undefined;
  reasoningLevels: AIReasoningLevel[];
  disabled: boolean;
  onModelChange: (modelId: string) => void;
  onReasoningChange: (reasoning: AIReasoningLevel) => void;
}) {
  const modelId = modelLabel.split("/").pop() || modelLabel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <PromptInputButton
          className="h-8 max-w-56 rounded-full px-3 text-xs text-muted-foreground"
          size="sm"
          aria-label={
            reasoning
              ? `当前模型 ${modelLabel}，${AI_REASONING_LABELS[reasoning]}`
              : `当前模型 ${modelLabel}`
          }
        >
          <span className="truncate">{modelId}</span>
          {reasoning && (
            <span className="shrink-0">{AI_REASONING_LABELS[reasoning]}</span>
          )}
        </PromptInputButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        {reasoningLevels.length > 0 && (
          <>
            <DropdownMenuLabel>Reasoning</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={reasoning}
              onValueChange={(value) =>
                onReasoningChange(value as AIReasoningLevel)
              }
            >
              {reasoningLevels.map((level) => (
                <DropdownMenuRadioItem
                  key={level}
                  value={level}
                  className="px-2 py-1.5"
                >
                  {AI_REASONING_LABELS[level]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="px-2 py-1.5">
            <span className="min-w-0 flex-1 truncate">{modelId}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <DropdownMenuLabel>模型</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={activeModelId}
              onValueChange={onModelChange}
            >
              {modelOptions.map((model) => {
                const optionModelId =
                  model.model.split("/").pop() || model.model;
                return (
                  <DropdownMenuRadioItem
                    key={model.id}
                    value={model.id}
                    className="items-start px-2 py-1.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">
                        {model.name || optionModelId}
                      </span>
                      {model.name && model.name !== optionModelId && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {model.model}
                        </span>
                      )}
                    </span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
