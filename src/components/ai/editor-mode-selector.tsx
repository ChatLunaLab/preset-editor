"use client";

import { cn } from "@/lib/utils";
import type { EditorMode } from "@/types/ai";
import { EditorSegmentedTabs } from "@/components/editor-segmented-tabs";

const MODE_TABS = [
  { value: "edit", label: "编辑" },
  { value: "ai", label: "AI" },
] as const;

interface EditorModeSelectorProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  className?: string;
}

export function EditorModeSelector({
  mode,
  onModeChange,
  className,
}: EditorModeSelectorProps) {
  return (
    <EditorSegmentedTabs
      value={mode}
      items={MODE_TABS}
      onValueChange={(value) => onModeChange(value as EditorMode)}
      ariaLabel="编辑模式"
      className={cn("w-fit", className)}
    />
  );
}
