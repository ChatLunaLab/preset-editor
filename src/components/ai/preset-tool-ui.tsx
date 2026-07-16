"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  ChevronDownIcon,
  FileSearchIcon,
  GlobeIcon,
  ListTreeIcon,
  PencilLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import {
  asRecord,
  getToolError,
  getToolOutput,
  isToolPending,
  presentTool,
  summarizeToolGroup,
  type PresetToolKind,
  type PresetToolPart,
  type PresetToolPresentation,
} from "./preset-tool-presentation";

export function PresetToolFeed({
  parts,
}: {
  parts: PresetToolPart[];
}) {
  if (parts.length === 1) {
    const part = parts[0];
    return <PresetToolActivity key={part.toolCallId} part={part} />;
  }

  return <GroupedPresetToolFeed parts={parts} />;
}

function GroupedPresetToolFeed({
  parts,
}: {
  parts: PresetToolPart[];
}) {
  const pending = parts.some(isToolPending);
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      className="group/tool-feed w-full max-w-full"
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger className="inline-flex h-7 max-w-full items-center gap-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ListTreeIcon
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground/80",
            pending &&
              "animate-pulse text-foreground [filter:drop-shadow(0_0_5px_color-mix(in_oklch,var(--foreground),transparent_55%))]",
          )}
        />
        {pending ? (
          <Shimmer as="span" className="min-w-0 truncate" duration={1.4}>
            {summarizeToolGroup(parts)}
          </Shimmer>
        ) : (
          <span className="min-w-0 truncate">
            {summarizeToolGroup(parts)}
          </span>
        )}
        <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]/tool-feed:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-[collapsible-up_160ms_ease-in] data-[state=open]:animate-[collapsible-down_200ms_ease-out]">
        <div className="mt-0.5 flex w-full flex-col items-start gap-1">
          {parts.map((part) => (
            <PresetToolActivity key={part.toolCallId} part={part} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ActivityIcon({
  kind,
  failed,
  pending,
}: {
  kind: PresetToolKind;
  failed?: boolean;
  pending?: boolean;
}) {
  const className = cn(
    "size-3.5 shrink-0",
    failed
      ? "text-destructive"
      : pending
        ? "animate-pulse text-foreground [filter:drop-shadow(0_0_5px_color-mix(in_oklch,var(--foreground),transparent_55%))]"
        : "text-muted-foreground/80",
  );

  if (kind === "inspect") return <FileSearchIcon className={className} />;
  if (kind === "preset-search") return <FileSearchIcon className={className} />;
  if (kind === "update") return <PencilLineIcon className={className} />;
  if (kind === "validate") return <ShieldCheckIcon className={className} />;
  if (kind === "generate") return <SparklesIcon className={className} />;
  if (kind === "search") return <GlobeIcon className={className} />;
  return <WrenchIcon className={className} />;
}

function PresetToolActivity({
  part,
}: {
  part: PresetToolPart;
}) {
  const presentation = presentTool(part);
  const activity = presentation.activity;
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      className="group/activity w-full max-w-full"
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger className="inline-flex h-7 max-w-full items-center gap-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ActivityIcon
          kind={presentation.kind}
          failed={presentation.failed}
          pending={presentation.pending}
        />
        {presentation.pending ? (
          <Shimmer as="span" className="min-w-0 truncate" duration={1.4}>
            {activity}
          </Shimmer>
        ) : (
          <span className="min-w-0 truncate">{activity}</span>
        )}
        <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]/activity:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-[collapsible-up_160ms_ease-in] data-[state=open]:animate-[collapsible-down_200ms_ease-out]">
        <PresetToolDetails part={part} presentation={presentation} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function formatDetailValue(value: unknown): string | null {
  if (value === undefined) return null;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function DetailContent({ content }: { content: string }) {
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <pre className="overflow-x-auto px-3 py-2 font-mono leading-relaxed whitespace-pre">
        {content}
      </pre>
    </div>
  );
}

function PresetToolDetails({
  part,
  presentation,
}: {
  part: PresetToolPart;
  presentation: PresetToolPresentation;
}) {
  const output = getToolOutput(part);
  const outputRecord = asRecord(output);
  const error = getToolError(part);
  const warnings = Array.isArray(outputRecord?.warnings)
    ? outputRecord.warnings.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const validationError =
    outputRecord?.ok === false && outputRecord.error !== undefined
      ? formatDetailValue(outputRecord.error)
      : undefined;
  const denialMessage =
    part.state === "output-denied" ? "操作未获准执行" : undefined;
  const statusMessage = error ?? validationError ?? denialMessage;
  const generateArtifact = asRecord(outputRecord?.generateArtifact);
  const artifactContent =
    typeof generateArtifact?.content === "string"
      ? generateArtifact.content
      : undefined;
  const artifactFileName =
    typeof generateArtifact?.fileName === "string"
      ? generateArtifact.fileName
      : undefined;
  const genericOutput = outputRecord
    ? Object.fromEntries(
        Object.entries(outputRecord).filter(
          ([key]) =>
            key !== "error" &&
            key !== "warnings" &&
            key !== "generateArtifact" &&
            key !== "ok",
        ),
      )
    : output;
  const hasGenericOutput =
    genericOutput !== undefined &&
    (genericOutput === null ||
      typeof genericOutput !== "object" ||
      Object.keys(genericOutput as Record<string, unknown>).length > 0);
  const outputContent = hasGenericOutput
      ? formatDetailValue(genericOutput)
      : null;
  const hasDetails =
    statusMessage ||
    warnings.length > 0 ||
    outputContent !== null ||
    artifactContent;

  return (
    <div className="mt-1 w-full max-w-full overflow-hidden rounded-lg border border-border/60 bg-muted/15 text-xs">
      <div className="max-h-72 overflow-auto overscroll-contain">
        {statusMessage && (
          <div
            className={cn(
              "border-b border-border/50 px-3 py-2 break-words text-muted-foreground last:border-b-0",
              presentation.failed && "text-destructive",
            )}
          >
            {statusMessage}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-0.5 border-b border-border/50 px-3 py-2 text-amber-600 last:border-b-0 dark:text-amber-400">
            {warnings.map((warning) => (
              <div key={warning} className="break-words">
                <span aria-hidden="true">• </span>
                {warning}
              </div>
            ))}
          </div>
        )}

        {outputContent !== null && (
          <DetailContent content={outputContent} />
        )}

        {artifactContent && (
          <div className="max-w-full overflow-hidden bg-muted/35 text-[11px] text-foreground">
            {artifactFileName && (
              <div className="truncate border-b border-border/50 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                {artifactFileName}
              </div>
            )}
            <pre className="overflow-x-auto px-2.5 py-2 font-mono leading-relaxed whitespace-pre">
              {artifactContent}
            </pre>
          </div>
        )}

        {!hasDetails && (
          <div className="px-3 py-2 text-muted-foreground">暂无结果</div>
        )}
      </div>
    </div>
  );
}
