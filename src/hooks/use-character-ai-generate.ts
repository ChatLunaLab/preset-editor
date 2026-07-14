"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { generateCharacterPreset } from "@/lib/ai/character-generate";
import {
  getActiveAIModelConfig,
  isAIModelConfigReady,
} from "@/lib/ai/model-config";
import { sanitizeAIErrorMessage } from "@/lib/ai/error-sanitize";
import type { CharacterPresetTemplate } from "@/types/preset";
import type {
  AIGenerateLogEntry,
  CharacterPresetFormat,
} from "@/types/ai";
import { AI_PROVIDER_LABELS } from "@/types/ai";

const FORMAT_LABELS: Record<CharacterPresetFormat, string> = {
  "tool-call": "工具调用格式",
  standard: "标准 XML 文本块格式",
};

export function useCharacterAIGenerate() {
  const [logs, setLogs] = useState<AIGenerateLogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addLog = useCallback(
    (text: string, type: AIGenerateLogEntry["type"] = "info") => {
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { time, text, type }]);
    },
    [],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const generateWithAI = useCallback(
    async (
      presetId: string,
      preset: CharacterPresetTemplate,
      format: CharacterPresetFormat,
    ) => {
      if (isGenerating) {
        return;
      }

      setIsGenerating(true);
      setLogs([]);
      addLog(`开始生成预设：${FORMAT_LABELS[format]}`, "info");

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
        const result = await generateCharacterPreset(
          presetId,
          preset,
          config,
          format,
          (message, type = "info") => addLog(message, type),
        );
        toast.success("预设生成成功", {
          description: `已通过 AI 生成：${result.fileName}`,
        });
        return result;
      } catch (err) {
        const message = sanitizeAIErrorMessage(
          err instanceof Error ? err.message : String(err ?? "未知错误"),
          config.apiKey,
        );
        addLog(`生成失败：${message}`, "error");
        toast.error("AI 生成失败", {
          description: message,
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [addLog, isGenerating],
  );

  return {
    logs,
    isGenerating,
    generateWithAI,
    clearLogs,
    addLog,
  };
}
