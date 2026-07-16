export type AIProviderFormat = "openai" | "anthropic" | "google";
export type AIReasoningLevel = "minimal" | "low" | "medium" | "high" | "xhigh";

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProviderFormat;
  apiKey: string;
  baseUrl: string;
  model: string;
  availableModels: string[];
  reasoning: AIReasoningLevel;
}

export interface AIModelConfigStore {
  configs: AIModelConfig[];
  activeConfigId: string | null;
}

export type EditorMode = "edit" | "ai";

export type CharacterPresetFormat = "tool-call" | "standard";

export type MainPresetFormat = "markdown" | "koishi";

export type AIPresetFormat = CharacterPresetFormat | MainPresetFormat;

export interface GeneratedCharacterPreset {
  content: string;
  fileName: string;
  format: CharacterPresetFormat;
}

export interface GeneratedMainPreset {
  content: string;
  fileName: string;
  format: MainPresetFormat;
}

export type AIGenerateLogType = "info" | "error" | "success" | "warning";

export interface AIGenerateLogEntry {
  time: string;
  text: string;
  type: AIGenerateLogType;
}

export type GenerateProgressCallback = (
  message: string,
  type?: AIGenerateLogType,
) => void;

export const AI_MODEL_CONFIG_STORAGE_KEY = "chatluna_ai_model_configs";
export const AI_MODEL_CONFIG_CHANGE_EVENT =
  "chatluna_ai_model_configs_changed";

export const AI_PROVIDER_LABELS: Record<AIProviderFormat, string> = {
  openai: "OpenAI",
  anthropic: "Claude",
  google: "Gemini",
};

export const AI_REASONING_LABELS: Record<AIReasoningLevel, string> = {
  minimal: "minimal",
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: "extra high",
};

export const AI_PROVIDER_DEFAULT_BASE_URLS: Record<AIProviderFormat, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
};
