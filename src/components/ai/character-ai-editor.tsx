"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CHARACTER_AI_ID_FIELDS,
  CHARACTER_AI_TEXT_FIELDS,
  type AIRoleDraftFields,
  type CharacterAIDetailFieldDef,
  type CharacterAIDraftKey,
} from "@/lib/ai/character-details";
import type { CharacterPresetFormat, MainPresetFormat } from "@/types/ai";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

export interface PresetFormatOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface CharacterAIEditorProps<T extends string> {
  draft: AIRoleDraftFields;
  setField: (key: CharacterAIDraftKey, value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void | Promise<void>;
  format: T;
  formatOptions: readonly PresetFormatOption<T>[];
  onFormatChange: (format: T) => void;
}

export const CHARACTER_PRESET_FORMATS: PresetFormatOption<CharacterPresetFormat>[] = [
  {
    value: "tool-call",
    label: "工具调用格式",
    description: "使用 character_reply 工具，推荐支持工具调用的模型。",
  },
  {
    value: "standard",
    label: "标准 XML 文本块格式",
    description: "使用 status、think、action、output 文本块。",
  },
];

export const MAIN_PRESET_FORMATS: PresetFormatOption<MainPresetFormat>[] = [
  {
    value: "markdown",
    label: "Markdown 格式",
    description: "使用 Markdown 渲染文本、图片、链接和代码等内容。",
  },
  {
    value: "koishi",
    label: "Koishi 消息渲染",
    description: "使用 message、img、at、file 等 Koishi 消息元素。",
  },
];

const textareaClass =
  "flex w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CharacterAIEditor<T extends string>({
  draft,
  setField,
  isGenerating,
  onGenerate,
  format,
  formatOptions,
  onFormatChange,
}: CharacterAIEditorProps<T>) {
  const [pendingExample, setPendingExample] =
    useState<CharacterAIDetailFieldDef | null>(null);

  const fillExample = (field: CharacterAIDetailFieldDef) => {
    if (field.template === undefined) {
      return;
    }
    if (draft[field.key].trim()) {
      setPendingExample(field);
      return;
    }
    setField(field.key, field.template);
  };

  return (
    <>
      <Card className="gap-0 rounded-xl py-0">
        <CardHeader className="border-b px-4 py-3 [.border-b]:pb-3">
          <CardTitle className="text-lg font-semibold">角色设定</CardTitle>
          <CardAction>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>生成预设格式</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={isGenerating}
                  aria-pressed={format === option.value}
                  onClick={() => onFormatChange(option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    format === option.value &&
                      "border-primary bg-primary/5 ring-1 ring-primary",
                  )}
                >
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {CHARACTER_AI_ID_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={draft[field.key]}
                  disabled={isGenerating}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setField(field.key, event.target.value)
                  }
                />
              </div>
            ))}
          </div>

          {CHARACTER_AI_TEXT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={field.key} className="text-base font-semibold">
                  {field.label}
                </Label>
                {field.template !== undefined && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={isGenerating}
                    onClick={() => fillExample(field)}
                  >
                    示例
                  </Button>
                )}
              </div>
              <TextareaAutosize
                id={field.key}
                minRows={6}
                disabled={isGenerating}
                placeholder={field.placeholder}
                className={
                  field.mono ? `${textareaClass} font-mono` : textareaClass
                }
                value={draft[field.key]}
                onChange={(event) => setField(field.key, event.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingExample !== null}
        onOpenChange={(open) => {
          if (!open) setPendingExample(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>替换现有内容？</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingExample?.label}”已有内容，使用示例将覆盖当前内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingExample?.template !== undefined) {
                  setField(pendingExample.key, pendingExample.template);
                }
                setPendingExample(null);
              }}
            >
              确认替换
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
