import type { AIRoleDraftFields } from "@/lib/ai/character-details";
import { readPresetOrThrow } from "@/lib/preset-mutation-queue";
import type {
  AIModelConfig,
  GeneratedMainPreset,
  GenerateProgressCallback,
  MainPresetFormat,
} from "@/types/ai";
import type { RawPreset } from "@/types/preset";
import { downloadGeneratedYaml } from "./generated-yaml";
import {
  isTimeoutOrAbortError,
  sanitizeAIErrorMessage,
} from "./error-sanitize";
import {
  buildMainGenerateUserPrompt,
  createGenerateMainAgent,
  requireSingleSuccessfulGenerateResult,
} from "./preset-agent";

const GENERATE_TIMEOUT = { totalMs: 300_000, stepMs: 180_000 } as const;

export async function generateMainPreset(
  presetId: string,
  draft: AIRoleDraftFields,
  modelConfig: AIModelConfig,
  format: MainPresetFormat,
  onProgress?: GenerateProgressCallback,
): Promise<GeneratedMainPreset> {
  const latest = await readPresetOrThrow(presetId);
  if (latest.type !== "main") {
    throw new Error("当前不是主插件预设");
  }

  const current = latest.preset as RawPreset;
  onProgress?.(`正在准备 ${format} 生成任务...`, "info");
  onProgress?.(
    `正在调用 ${modelConfig.name} / ${modelConfig.model} 通过 Agent 工具生成主插件预设...`,
    "info",
  );

  const agent = createGenerateMainAgent({
    presetId,
    model: modelConfig,
    format,
  });

  const prompt = buildMainGenerateUserPrompt(draft, current.keywords, format);

  let result;
  try {
    result = await agent.generate({
      prompt,
      timeout: GENERATE_TIMEOUT,
    });
  } catch (error) {
    if (isTimeoutOrAbortError(error)) {
      throw new Error("模型生成超时，请稍后重试", { cause: error });
    }
    throw new Error(
      sanitizeAIErrorMessage(
        error instanceof Error ? error.message : String(error ?? "未知错误"),
        modelConfig.apiKey,
      ),
      { cause: error },
    );
  }

  const toolResult = requireSingleSuccessfulGenerateResult(
    result.steps,
    "replaceGeneratedMainPreset",
  );

  for (const warning of toolResult.warnings ?? []) {
    onProgress?.(`生成结果未明确覆盖非核心格式说明：${warning}`, "warning");
  }

  const artifact = toolResult.generateArtifact;
  if (!artifact?.content || !artifact.fileName) {
    throw new Error("生成成功但缺少导出快照，请重试");
  }

  onProgress?.("生成结果已通过工具写入并完成校验", "success");

  try {
    downloadGeneratedYaml(artifact.content, artifact.fileName);
    onProgress?.(`生成完成并下载：${artifact.fileName}`, "success");
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : String(error ?? "未知错误");
    onProgress?.(
      `已保存但自动下载失败：${detail}。可使用顶部「导出 YAML」手动导出。`,
      "warning",
    );
  }

  return {
    content: artifact.content,
    fileName: artifact.fileName,
    format,
  };
}
