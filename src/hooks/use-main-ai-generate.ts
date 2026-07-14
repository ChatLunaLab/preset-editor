"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { generateMainPreset } from "@/lib/ai/main-generate";
import type { AIRoleDraftFields } from "@/lib/ai/character-details";
import {
  getActiveAIModelConfig,
  isAIModelConfigReady,
} from "@/lib/ai/model-config";
import { sanitizeAIErrorMessage } from "@/lib/ai/error-sanitize";
import type { AIGenerateLogEntry, MainPresetFormat } from "@/types/ai";
import { AI_PROVIDER_LABELS } from "@/types/ai";

const FORMAT_LABELS: Record<MainPresetFormat, string> = {
  markdown: "Markdown 格式",
  koishi: "Koishi 消息渲染格式",
};

export function useMainAIGenerate() {
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
      draft: AIRoleDraftFields,
      format: MainPresetFormat,
    ) => {
      if (isGenerating) return;

      setIsGenerating(true);
      setLogs([]);
      addLog(`开始生成主插件预设：${FORMAT_LABELS[format]}`, "info");

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
        const result = await generateMainPreset(
          presetId,
          draft,
          config,
          format,
          (message, type = "info") => addLog(message, type),
        );
        toast.success("主插件预设生成成功", {
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
    [addLog, isGenerating],
  );

  return { logs, isGenerating, generateWithAI, clearLogs, addLog };
}
