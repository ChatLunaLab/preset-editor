import { isToolUIPart, type UIMessage } from "ai";
import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  ChevronRightIcon,
  ExternalLinkIcon,
  FileTextIcon,
} from "lucide-react";
import { PresetToolFeed } from "./preset-tool-ui";
import {
  isToolPending,
  type PresetToolPart,
} from "./preset-tool-presentation";

type MessagePart = UIMessage["parts"][number];
type SourcePart = Extract<
  MessagePart,
  { type: "source-url" } | { type: "source-document" }
>;

type FlowSegment =
  | { type: "text"; part: Extract<MessagePart, { type: "text" }>; index: number }
  | {
      type: "reasoning";
      parts: Extract<MessagePart, { type: "reasoning" }>[];
      lastIndex: number;
    }
  | { type: "tools"; parts: PresetToolPart[]; lastIndex: number }
  | { type: "sources"; parts: SourcePart[]; lastIndex: number };

function createFlowSegments(parts: UIMessage["parts"]): FlowSegment[] {
  const segments: FlowSegment[] = [];
  let reasoningParts: Extract<MessagePart, { type: "reasoning" }>[] = [];
  let toolParts: PresetToolPart[] = [];
  let sourceParts: SourcePart[] = [];
  let bufferedIndex = -1;

  const flushReasoning = () => {
    if (reasoningParts.length === 0) return;
    segments.push({
      type: "reasoning",
      parts: reasoningParts,
      lastIndex: bufferedIndex,
    });
    reasoningParts = [];
  };

  const flushTools = () => {
    if (toolParts.length === 0) return;
    segments.push({ type: "tools", parts: toolParts, lastIndex: bufferedIndex });
    toolParts = [];
  };

  const flushSources = () => {
    if (sourceParts.length === 0) return;
    segments.push({
      type: "sources",
      parts: sourceParts,
      lastIndex: bufferedIndex,
    });
    sourceParts = [];
  };

  parts.forEach((part, index) => {
    // A step boundary is transport metadata, not a visible interruption. Keep
    // adjacent tool calls grouped until actual text or reasoning appears.
    if (part.type === "step-start") return;

    if (part.type === "reasoning") {
      flushTools();
      flushSources();
      reasoningParts.push(part);
      bufferedIndex = index;
      return;
    }

    if (isToolUIPart(part)) {
      flushReasoning();
      flushSources();
      toolParts.push(part);
      bufferedIndex = index;
      return;
    }

    if (part.type === "source-url" || part.type === "source-document") {
      flushReasoning();
      flushTools();
      sourceParts.push(part);
      bufferedIndex = index;
      return;
    }

    flushReasoning();
    flushTools();
    flushSources();

    if (part.type === "text") {
      segments.push({ type: "text", part, index });
    }
    // Other part types (file, data, etc.) are ignored safely so unknown
    // provider content does not crash rendering.
  });

  flushReasoning();
  flushTools();
  flushSources();
  return segments;
}

function MessageSources({ parts }: { parts: SourcePart[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {parts.map((part) => {
        if (part.type === "source-url") {
          return (
            <a
              key={part.sourceId}
              href={part.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLinkIcon className="size-3 shrink-0" />
              <span className="min-w-0 truncate">{part.title || part.url}</span>
            </a>
          );
        }

        return (
          <span
            key={part.sourceId}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
          >
            <FileTextIcon className="size-3 shrink-0" />
            <span className="min-w-0 truncate">
              {part.title || part.filename || "来源文档"}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function FlowSegmentContent({
  message,
  segment,
  segmentIndex,
  isStreaming,
  lastPartIndex,
}: {
  message: UIMessage;
  segment: FlowSegment;
  segmentIndex: number;
  isStreaming: boolean;
  lastPartIndex: number;
}) {
  if (segment.type === "text") {
    return (
      <MessageResponse
        isAnimating={isStreaming && segment.index === lastPartIndex}
      >
        {segment.part.text}
      </MessageResponse>
    );
  }

  if (segment.type === "reasoning") {
    const reasoningText = segment.parts.map((part) => part.text).join("\n\n");
    const reasoningStreaming =
      isStreaming && segment.parts.some((part) => part.state === "streaming");
    const reasoningTiming = getReasoningTiming(segment.parts);

    return (
      <Reasoning
        className="max-w-full"
        isStreaming={reasoningStreaming}
        duration={
          reasoningStreaming ? undefined : reasoningTiming.durationSeconds
        }
        startedAt={reasoningTiming.activeStartedAt}
      >
        <ReasoningTrigger
          getThinkingMessage={(streaming, duration) => {
            if (streaming) {
              return (
                <Shimmer as="span" duration={1.4}>
                  正在思考...
                </Shimmer>
              );
            }
            if (duration !== undefined) return `思考了 ${duration} 秒`;
            return "思考完成";
          }}
        />
        <ReasoningContent>{reasoningText}</ReasoningContent>
      </Reasoning>
    );
  }

  if (segment.type === "sources") {
    return <MessageSources parts={segment.parts} />;
  }

  return (
    <PresetToolFeed
      key={`${message.id}-tools-${segmentIndex}`}
      parts={segment.parts}
    />
  );
}

export function PresetMessageParts({
  message,
  isStreaming,
  thinkingMessage = "正在思考...",
}: {
  message: UIMessage;
  isStreaming: boolean;
  thinkingMessage?: string;
}) {
  const segments = createFlowSegments(message.parts);
  const lastPartIndex = message.parts.length - 1;
  const visibleParts = message.parts.filter(
    (part) => part.type !== "step-start",
  );
  const hasPendingTool = visibleParts.some(
    (part) => isToolUIPart(part) && isToolPending(part),
  );
  const lastVisiblePart = visibleParts[visibleParts.length - 1];
  const hasActiveOutput =
    lastVisiblePart?.type === "reasoning" ||
    (lastVisiblePart?.type === "text" &&
      lastVisiblePart.text.trim().length > 0);
  const showWaitShimmer =
    isStreaming && !hasPendingTool && !hasActiveOutput;
  const durationSeconds = getResponseDurationSeconds(message);
  const wasStopped = isStoppedResponse(message);
  const indexedSegments = segments.map((segment, index) => ({ segment, index }));
  const workSegments = indexedSegments.filter(
    ({ segment }) => segment.type !== "text",
  );
  const textSegments = indexedSegments.filter(
    ({ segment }) => segment.type === "text",
  );

  const renderSegment = ({
    segment,
    index,
  }: (typeof indexedSegments)[number]) => (
    <FlowSegmentContent
      key={`${message.id}-${segment.type}-${index}`}
      message={message}
      segment={segment}
      segmentIndex={index}
      isStreaming={isStreaming}
      lastPartIndex={lastPartIndex}
    />
  );

  return (
    <div className="space-y-3">
      {isStreaming ? (
        indexedSegments.map(renderSegment)
      ) : (
        <>
          {workSegments.length > 0 ? (
            <Collapsible className="group/work w-full border-b border-border/60 pb-1">
              <CollapsibleTrigger className="inline-flex h-7 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <span>
                  {wasStopped
                    ? durationSeconds
                      ? `已在 ${formatDuration(durationSeconds)}后停止`
                      : "已停止"
                    : durationSeconds
                      ? `工作了 ${formatDuration(durationSeconds)}`
                      : "工作完成"}
                </span>
                <ChevronRightIcon className="size-3.5 transition-transform duration-200 group-data-[state=open]/work:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-[collapsible-up_160ms_ease-in] data-[state=open]:animate-[collapsible-down_200ms_ease-out]">
                <div className="space-y-1 pb-2 pt-1">
                  {workSegments.map(renderSegment)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : wasStopped ? (
            <div className="flex h-7 w-full items-center border-b border-border/60 pb-1 text-sm text-muted-foreground">
              {durationSeconds
                ? `已在 ${formatDuration(durationSeconds)}后停止`
                : "已停止"}
            </div>
          ) : null}
          {textSegments.map(renderSegment)}
        </>
      )}
      {showWaitShimmer && (
        <div className="text-sm text-muted-foreground">
          <Shimmer duration={1.4}>
            {thinkingMessage}
          </Shimmer>
        </div>
      )}
    </div>
  );
}

function getReasoningTiming(
  parts: Extract<MessagePart, { type: "reasoning" }>[],
) {
  let activeStartedAt: number | undefined;
  let durationMs = 0;
  let hasDuration = false;

  for (const part of parts) {
    const metadata = part.providerMetadata?.chatluna;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      continue;
    }
    const reasoningStartedAt = metadata.reasoningStartedAt;
    const reasoningDurationMs = metadata.reasoningDurationMs;

    if (
      part.state === "streaming" &&
      typeof reasoningStartedAt === "number"
    ) {
      activeStartedAt = reasoningStartedAt;
    }
    if (
      typeof reasoningDurationMs === "number" &&
      Number.isFinite(reasoningDurationMs)
    ) {
      durationMs += reasoningDurationMs;
      hasDuration = true;
    }
  }

  return {
    activeStartedAt,
    durationSeconds: hasDuration
      ? Math.max(1, Math.ceil(durationMs / 1000))
      : undefined,
  };
}

function isStoppedResponse(message: UIMessage) {
  return Boolean(
    message.metadata &&
      typeof message.metadata === "object" &&
      (message.metadata as { stopped?: unknown }).stopped === true,
  );
}

function getResponseDurationSeconds(message: UIMessage) {
  if (!message.metadata || typeof message.metadata !== "object") {
    return undefined;
  }
  const metadata = message.metadata as {
    responseDurationMs?: unknown;
    responseStartedAt?: unknown;
    responseFinishedAt?: unknown;
  };
  if (
    typeof metadata.responseDurationMs === "number" &&
    Number.isFinite(metadata.responseDurationMs)
  ) {
    return Math.max(1, Math.ceil(metadata.responseDurationMs / 1000));
  }
  if (
    typeof metadata.responseStartedAt === "number" &&
    typeof metadata.responseFinishedAt === "number"
  ) {
    return Math.max(
      1,
      Math.ceil(
        (metadata.responseFinishedAt - metadata.responseStartedAt) / 1000,
      ),
    );
  }
  return undefined;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes} 分 ${remainingSeconds} 秒`
    : `${minutes} 分钟`;
}
