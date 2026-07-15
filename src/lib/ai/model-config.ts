import {
  AI_MODEL_CONFIG_STORAGE_KEY,
  AI_MODEL_CONFIG_CHANGE_EVENT,
  AI_PROVIDER_DEFAULT_BASE_URLS,
  AI_PROVIDER_LABELS,
  type AIModelConfig,
  type AIModelConfigStore,
  type AIProviderFormat,
  type AIReasoningLevel,
} from "@/types/ai";

const PROVIDERS: AIProviderFormat[] = ["openai", "anthropic", "google"];
const REASONING_LEVELS: AIReasoningLevel[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
];

function isProvider(value: unknown): value is AIProviderFormat {
  return typeof value === "string" && PROVIDERS.includes(value as AIProviderFormat);
}

function isReasoningLevel(value: unknown): value is AIReasoningLevel {
  return (
    typeof value === "string" &&
    REASONING_LEVELS.includes(value as AIReasoningLevel)
  );
}

function normalizeAvailableModels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((model): model is string => typeof model === "string" && model.trim().length > 0))]
    .map((model) => model.trim())
    .sort((left, right) => left.localeCompare(right));
}

function normalizeConfig(value: unknown): AIModelConfig | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<AIModelConfig>;
  if (typeof raw.id !== "string" || !raw.id.trim()) {
    return null;
  }
  if (!isProvider(raw.provider)) {
    return null;
  }

  return {
    id: raw.id,
    name: typeof raw.name === "string" ? raw.name : "未命名配置",
    provider: raw.provider,
    apiKey: typeof raw.apiKey === "string" ? raw.apiKey : "",
    baseUrl:
      typeof raw.baseUrl === "string" && raw.baseUrl.trim()
        ? raw.baseUrl
        : AI_PROVIDER_DEFAULT_BASE_URLS[raw.provider],
    model: typeof raw.model === "string" ? raw.model : "",
    availableModels: normalizeAvailableModels(raw.availableModels),
    reasoning: isReasoningLevel(raw.reasoning) ? raw.reasoning : "medium",
  };
}

export function createEmptyAIModelConfigStore(): AIModelConfigStore {
  return {
    configs: [],
    activeConfigId: null,
  };
}

export function resolveActiveConfigId(
  configs: ReadonlyArray<Pick<AIModelConfig, "id">>,
  preferredId: string | null | undefined,
): string | null {
  if (preferredId && configs.some((config) => config.id === preferredId)) {
    return preferredId;
  }
  return configs[0]?.id ?? null;
}

export function createAIModelConfig(
  partial?: Partial<Omit<AIModelConfig, "id">> & { id?: string },
): AIModelConfig {
  const provider = partial?.provider ?? "openai";
  return {
    id: partial?.id ?? crypto.randomUUID(),
    name: partial?.name?.trim() || `${AI_PROVIDER_LABELS[provider]} 配置`,
    provider,
    apiKey: partial?.apiKey ?? "",
    baseUrl:
      partial?.baseUrl?.trim() || AI_PROVIDER_DEFAULT_BASE_URLS[provider],
    model: partial?.model ?? "",
    availableModels: normalizeAvailableModels(partial?.availableModels),
    reasoning: partial?.reasoning ?? "medium",
  };
}

export function loadAIModelConfigStore(): AIModelConfigStore {
  try {
    const saved = localStorage.getItem(AI_MODEL_CONFIG_STORAGE_KEY);
    if (!saved) {
      return createEmptyAIModelConfigStore();
    }

    const parsed = JSON.parse(saved) as Partial<AIModelConfigStore>;
    if (!parsed || typeof parsed !== "object") {
      return createEmptyAIModelConfigStore();
    }

    const configs = Array.isArray(parsed.configs)
      ? parsed.configs
          .map((item) => normalizeConfig(item))
          .filter((item): item is AIModelConfig => item !== null)
      : [];

    const preferredId =
      typeof parsed.activeConfigId === "string" ? parsed.activeConfigId : null;
    const activeConfigId = resolveActiveConfigId(configs, preferredId);

    return { configs, activeConfigId };
  } catch {
    return createEmptyAIModelConfigStore();
  }
}

export function saveAIModelConfigStore(store: AIModelConfigStore): void {
  const configs = store.configs
    .map((item) => normalizeConfig(item))
    .filter((item): item is AIModelConfig => item !== null)
    .map((config) => ({
      ...config,
      name: config.name,
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl.trim(),
      model: config.model.trim(),
    }));

  const activeConfigId = resolveActiveConfigId(configs, store.activeConfigId);

  localStorage.setItem(
    AI_MODEL_CONFIG_STORAGE_KEY,
    JSON.stringify({ configs, activeConfigId }),
  );
  queueMicrotask(() => {
    window.dispatchEvent(new Event(AI_MODEL_CONFIG_CHANGE_EVENT));
  });
}

export function getActiveAIModelConfig(
  store?: AIModelConfigStore,
): AIModelConfig | null {
  const data = store ?? loadAIModelConfigStore();
  if (!data.activeConfigId) {
    return null;
  }
  return data.configs.find((config) => config.id === data.activeConfigId) ?? null;
}

export function isAIModelConfigReady(
  config: AIModelConfig | null | undefined,
): boolean {
  if (!config) {
    return false;
  }
  return Boolean(
    config.provider &&
      config.apiKey.trim() &&
      config.baseUrl.trim() &&
      config.model.trim(),
  );
}

export function getProviderDefaultBaseUrl(provider: AIProviderFormat): string {
  return AI_PROVIDER_DEFAULT_BASE_URLS[provider];
}
