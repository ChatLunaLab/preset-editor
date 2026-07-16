"use client";

import type {
  AIGenerateLogEntry,
  AIPresetFormat,
} from "@/types/ai";
import type { AIEditTab } from "@/lib/editor-route";
import type { CharacterPresetTemplate, RawPreset } from "@/types/preset";
import type {
  AIRoleDraftFields,
  CharacterAIDraftKey,
} from "@/lib/ai/character-details";
import {
  CharacterAIEditor,
  type PresetFormatOption,
} from "./character-ai-editor";
import { CharacterAIAgent } from "./character-ai-agent";
import { CharacterAIGenerateStatus } from "./character-ai-generate-status";
import { TemplateEditor } from "@/components/template-editor";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp, TriangleAlert } from "lucide-react";
import { dump } from "js-yaml";
import type { TemplateEditorContext } from "@/lib/prompt-template";

interface CharacterAIContentProps<T extends AIPresetFormat> {
  activeTab: string;
  presetId: string;
  presetType: "main" | "character";
  draft: AIRoleDraftFields;
  setField: (key: CharacterAIDraftKey, value: string) => void;
  logs: AIGenerateLogEntry[];
  isGenerating: boolean;
  onGenerate: () => void | Promise<void>;
  format: T;
  formatOptions: readonly PresetFormatOption<T>[];
  preset: CharacterPresetTemplate | RawPreset;
  previewContext: TemplateEditorContext;
  agentName?: string;
  hasPendingRoleChanges: boolean;
  onFormatChange: (format: T) => void;
  onClearLogs?: () => void;
  onNewChatActionChange?: (
    action: (() => void) | null,
    canStart: boolean,
  ) => void;
}

export function CharacterAIContent<T extends AIPresetFormat>({
  activeTab,
  presetId,
  presetType,
  draft,
  setField,
  logs,
  isGenerating,
  onGenerate,
  format,
  formatOptions,
  preset,
  previewContext,
  agentName,
  hasPendingRoleChanges,
  onFormatChange,
  onClearLogs,
  onNewChatActionChange,
}: CharacterAIContentProps<T>) {
  const tab = activeTab as AIEditTab;

  return (
    <div className={tab === "agent" ? "flex h-full min-h-0 flex-col" : undefined}>
      <CharacterAIGenerateStatus
        logs={logs}
        isGenerating={isGenerating}
        onClear={onClearLogs}
      />
      {tab === "edit" && (
        <CharacterAIEditor
          draft={draft}
          setField={setField}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          format={format}
          formatOptions={formatOptions}
          onFormatChange={onFormatChange}
        />
      )}
      {tab === "agent" && (
        <div className="min-h-0 flex-1">
          <CharacterAIAgent
            presetId={presetId}
            presetType={presetType}
            name={agentName}
            onNewChatActionChange={onNewChatActionChange}
          />
        </div>
      )}
      {tab === "preview" && (
        <CharacterAIPreview
          preset={preset}
          previewContext={previewContext}
          hasPendingRoleChanges={hasPendingRoleChanges}
        />
      )}
    </div>
  );
}

function CharacterAIPreview({
  preset,
  previewContext,
  hasPendingRoleChanges,
}: {
  preset: CharacterPresetTemplate | RawPreset;
  previewContext: TemplateEditorContext;
  hasPendingRoleChanges: boolean;
}) {
  return (
    <Card className="gap-0 rounded-xl py-0">
      <CardHeader className="border-b px-4 py-3 [.border-b]:pb-3">
        <CardTitle className="text-lg font-semibold">预设预览</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <TooltipProvider>
            {hasPendingRoleChanges && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    aria-label="角色设定有未生成的修改"
                    className="inline-flex size-7 items-center justify-center rounded-md text-amber-600 outline-none hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-400 dark:hover:bg-amber-950/40"
                  >
                    <TriangleAlert className="size-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-64">
                  角色设定有未生成的修改。成功生成后，这些修改才会应用到当前预设。
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  aria-label="预设预览说明"
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CircleHelp className="size-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64">
                这里显示当前实际预设的只读原文；Agent 修改后会直接同步。
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent className="p-4">
        <TemplateEditor
          value={dump(preset, { lineWidth: -1 })}
          context={previewContext}
          minRows={24}
          readOnly
          ariaLabel="当前预设原文预览"
        />
      </CardContent>
    </Card>
  );
}
