"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AIRoleDraftFields } from "@/lib/ai/character-details";
import {
  generateCharacterPreset,
  generateMainPreset,
} from "@/lib/ai/generate-preset";
import {
  getActiveAIModelConfig,
  isAIModelConfigReady,
} from "@/lib/ai/model-config";
import { sanitizeAIErrorMessage } from "@/lib/ai/error-sanitize";
import type { CharacterPresetTemplate } from "@/types/preset";
import type {
  AIGenerateLogEntry,
  CharacterPresetFormat,
  GeneratedCharacterPreset,
  GeneratedMainPreset,
  MainPresetFormat,
} from "@/types/ai";
import { AI_PROVIDER_LABELS } from "@/types/ai";

const MAIN_FORMAT_LABELS: Record<MainPresetFormat, string> = {
  markdown: "Markdown 格式",
  koishi: "Koishi 消息渲染格式",
};

const CHARACTER_FORMAT_LABELS: Record<CharacterPresetFormat, string> = {
  "tool-call": "工具调用格式",
  standard: "标准 XML 文本块格式",
};

export type AIGenerateKind = "main" | "character";

type MainGenerateWithAI = (
  presetId: string,
  draft: AIRoleDraftFields,
  format: MainPresetFormat,
) => Promise<GeneratedMainPreset | undefined>;

type CharacterGenerateWithAI = (
  presetId: string,
  draft: CharacterPresetTemplate,
  format: CharacterPresetFormat,
) => Promise<GeneratedCharacterPreset | undefined>;

interface UseAIGenerateBase {
  logs: AIGenerateLogEntry[];
  isGenerating: boolean;
  clearLogs: () => void;
  addLog: (text: string, type?: AIGenerateLogEntry["type"]) => void;
}

export interface UseMainAIGenerateResult extends UseAIGenerateBase {
  generateWithAI: MainGenerateWithAI;
}

export interface UseCharacterAIGenerateResult extends UseAIGenerateBase {
  generateWithAI: CharacterGenerateWithAI;
}

export function useAIGenerate(kind: "main"): UseMainAIGenerateResult;
export function useAIGenerate(kind: "character"): UseCharacterAIGenerateResult;
export function useAIGenerate(
  kind: AIGenerateKind,
): UseMainAIGenerateResult | UseCharacterAIGenerateResult {
  const [logs, setLogs] = useState<AIGenerateLogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addLog = useCallback(
    (text: string, type: AIGenerateLogEntry["type"] = "info") => {
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { time, text, type }]);
    },
    [],
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  const generateWithAI = useCallback(
    async (
      presetId: string,
      draft: AIRoleDraftFields | CharacterPresetTemplate,
      format: MainPresetFormat | CharacterPresetFormat,
    ): Promise<GeneratedMainPreset | GeneratedCharacterPreset | undefined> => {
      if (isGenerating) return;

      setIsGenerating(true);
      setLogs([]);

      if (kind === "main") {
        addLog(
          `开始生成主插件预设：${MAIN_FORMAT_LABELS[format as MainPresetFormat]}`,
          "info",
        );
      } else {
        addLog(
          `开始生成预设：${CHARACTER_FORMAT_LABELS[format as CharacterPresetFormat]}`,
          "info",
        );
      }

      const config = getActiveAIModelConfig();
      if (!isAIModelConfigReady(config) || !config) {
        addLog(
          "未检测到完整的活动模型配置，请在全局设置中新增并完善模型配置",
          "error",
        );
        toast.error("请先配置模型", {
          description:
            "请打开侧边栏「设置」→「AI 模型」，添加配置并设为当前使用",
        });
        setIsGenerating(false);
        return;
      }

      addLog(
        `活动配置：${config.name} | ${AI_PROVIDER_LABELS[config.provider]} | ${config.model}`,
        "success",
      );

      try {
        if (kind === "main") {
          const result = await generateMainPreset(
            presetId,
            draft as AIRoleDraftFields,
            config,
            format as MainPresetFormat,
            (message, type = "info") => addLog(message, type),
          );
          toast.success("主插件预设生成成功", {
            description: `已通过 AI 生成：${result.fileName}`,
          });
          return result;
        }

        const result = await generateCharacterPreset(
          presetId,
          draft as CharacterPresetTemplate,
          config,
          format as CharacterPresetFormat,
          (message, type = "info") => addLog(message, type),
        );
        toast.success("预设生成成功", {
          description: `已通过 AI 生成：${result.fileName}`,
        });
        return result;
      } catch (error) {
        const message = sanitizeAIErrorMessage(
          error instanceof Error ? error.message : String(error ?? "未知错误"),
          config.apiKey,
        );
        addLog(`生成失败：${message}`, "error");
        toast.error("AI 生成失败", { description: message });
      } finally {
        setIsGenerating(false);
      }
    },
    [addLog, isGenerating, kind],
  );

  return {
    logs,
    isGenerating,
    generateWithAI: generateWithAI as MainGenerateWithAI & CharacterGenerateWithAI,
    clearLogs,
    addLog,
  };
}
