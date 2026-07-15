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
  PencilLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import { PresetToolDetails } from "./preset-tool-details";
import {
  presentTool,
  type PresetToolKind,
  type PresetToolPart,
} from "./preset-tool-presentation";

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

export function PresetToolActivity({
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
