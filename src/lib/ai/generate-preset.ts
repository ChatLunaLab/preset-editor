import type { StepResult, ToolSet } from "ai";
import type { AIRoleDraftFields } from "@/lib/ai/character-details";
import {
  readPresetOrThrow,
  type PresetGenerateArtifact,
} from "@/lib/preset-mutation-queue";
import type {
  AIModelConfig,
  CharacterPresetFormat,
  GenerateProgressCallback,
  GeneratedCharacterPreset,
  GeneratedMainPreset,
  MainPresetFormat,
} from "@/types/ai";
import type { CharacterPresetTemplate, RawPreset } from "@/types/preset";
import { downloadGeneratedYaml } from "./generated-yaml";
import {
  isTimeoutOrAbortError,
  sanitizeAIErrorMessage,
} from "./error-sanitize";
import {
  buildCharacterGenerateUserPrompt,
  buildMainGenerateUserPrompt,
  createGenerateCharacterAgent,
  createGenerateMainAgent,
  requireSingleSuccessfulGenerateResult,
} from "./preset-agent";

const GENERATE_TIMEOUT = { totalMs: 300_000, stepMs: 180_000 } as const;

type GenerateAgentResult = {
  steps: Array<StepResult<ToolSet>>;
};

type GenerateAgent = {
  generate: (options: {
    prompt: string;
    timeout: typeof GENERATE_TIMEOUT;
  }) => Promise<GenerateAgentResult>;
};

async function runGenerateAgent(
  agent: GenerateAgent,
  prompt: string,
  modelConfig: AIModelConfig,
): Promise<GenerateAgentResult> {
  try {
    return await agent.generate({
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
}

function finalizeArtifact(
  artifact: PresetGenerateArtifact | undefined,
  onProgress?: GenerateProgressCallback,
): PresetGenerateArtifact {
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

  return { content: artifact.content, fileName: artifact.fileName };
}

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
  const result = await runGenerateAgent(agent, prompt, modelConfig);

  const toolResult = requireSingleSuccessfulGenerateResult(
    result.steps,
    "replaceGeneratedMainPreset",
  );

  for (const warning of toolResult.warnings ?? []) {
    onProgress?.(`生成结果未明确覆盖非核心格式说明：${warning}`, "warning");
  }

  const artifact = finalizeArtifact(toolResult.generateArtifact, onProgress);

  return {
    content: artifact.content,
    fileName: artifact.fileName,
    format,
  };
}

export async function generateCharacterPreset(
  presetId: string,
  draft: CharacterPresetTemplate,
  modelConfig: AIModelConfig,
  format: CharacterPresetFormat,
  onProgress?: GenerateProgressCallback,
): Promise<GeneratedCharacterPreset> {
  const latest = await readPresetOrThrow(presetId);
  if (latest.type !== "character") {
    throw new Error("当前不是伪装预设");
  }

  onProgress?.(`正在准备 ${format} 生成任务...`, "info");
  onProgress?.(
    `正在调用 ${modelConfig.name} / ${modelConfig.model} 通过 Agent 工具生成伪装预设...`,
    "info",
  );

  const agent = createGenerateCharacterAgent({
    presetId,
    model: modelConfig,
    format,
  });

  const prompt = buildCharacterGenerateUserPrompt(draft, format);
  const result = await runGenerateAgent(agent, prompt, modelConfig);

  const toolResult = requireSingleSuccessfulGenerateResult(
    result.steps,
    "replaceGeneratedCharacterPreset",
  );

  const artifact = finalizeArtifact(toolResult.generateArtifact, onProgress);

  return {
    content: artifact.content,
    fileName: artifact.fileName,
    format,
  };
}
