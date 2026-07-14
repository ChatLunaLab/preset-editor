"use client";

import { Button } from "@/components/ui/button";
import type { AIGenerateLogEntry } from "@/types/ai";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface CharacterAIGenerateStatusProps {
  logs: AIGenerateLogEntry[];
  isGenerating: boolean;
  onClear?: () => void;
}

function logColor(type: AIGenerateLogEntry["type"]) {
  switch (type) {
    case "error":
      return "text-destructive";
    case "success":
      return "text-emerald-600 dark:text-emerald-400";
    case "warning":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-muted-foreground";
  }
}

export function CharacterAIGenerateStatus({
  logs,
  isGenerating,
  onClear,
}: CharacterAIGenerateStatusProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [logs.length]);

  if (logs.length === 0 && !isGenerating) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border bg-muted/20">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span>AI 生成状态</span>
          {isGenerating && (
            <span className="text-xs text-muted-foreground">进行中…</span>
          )}
        </div>
        {logs.length > 0 && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onClear}
            disabled={isGenerating}
          >
            清空
          </Button>
        )}
      </div>
      <div
        ref={scrollRef}
        className="max-h-48 space-y-1 overflow-y-auto px-4 py-3 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <p className="text-muted-foreground">正在准备生成…</p>
        ) : (
          logs.map((log, index) => (
            <div key={`${log.time}-${index}`} className="flex gap-2">
              <span className="shrink-0 text-muted-foreground/70">
                [{log.time}]
              </span>
              <span className={cn(logColor(log.type))}>{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
