"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDownIcon,
  ListTreeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { PresetToolActivity } from "./preset-tool-activity";
import {
  isToolPending,
  presentTool,
  summarizeToolGroup,
  type PresetToolPart,
} from "./preset-tool-presentation";

export function PresetToolFeed({
  parts,
}: {
  parts: PresetToolPart[];
}) {
  if (parts.length === 1) {
    const part = parts[0];
    const presentation = presentTool(part);
    return (
      <PresetToolActivity
        key={`${part.toolCallId}-${presentation.failed}`}
        part={part}
      />
    );
  }

  const hasFailure = parts.some((part) => presentTool(part).failed);
  return (
    <GroupedPresetToolFeed
      key={`tool-group-${hasFailure}`}
      parts={parts}
      hasFailure={hasFailure}
    />
  );
}

function GroupedPresetToolFeed({
  parts,
  hasFailure,
}: {
  parts: PresetToolPart[];
  hasFailure: boolean;
}) {
  const pending = parts.some(isToolPending);

  return (
    <Collapsible className="group/tool-feed max-w-full" defaultOpen={hasFailure}>
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
        {!pending && (
          <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]/tool-feed:rotate-180" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-[collapsible-up_160ms_ease-in] data-[state=open]:animate-[collapsible-down_200ms_ease-out]">
        <div className="mt-0.5 flex flex-col items-start gap-1">
          {parts.map((part) => {
            const presentation = presentTool(part);
            return (
              <PresetToolActivity
                key={`${part.toolCallId}-${presentation.failed}`}
                part={part}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
