"use client";

import { useState } from "react";
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
