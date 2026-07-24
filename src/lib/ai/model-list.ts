import type { AIModelConfig } from "@/types/ai";

interface ApiErrorResponse {
  error?: { message?: string };
  message?: string;
}

interface ModelListPayload {
  data?: Array<{ id?: string }>;
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
}

class ModelListRequestError extends Error {
  status: number;
  retriableWithOpenAI: boolean;

  constructor(
    message: string,
    options: { status: number; retriableWithOpenAI: boolean },
  ) {
    super(message);
    this.name = "ModelListRequestError";
    this.status = options.status;
    this.retriableWithOpenAI = options.retriableWithOpenAI;
  }
}

function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const payload = data as ApiErrorResponse;
    if (payload.error?.message) return payload.error.message;
    if (payload.message) return payload.message;
  }
  return `拉取模型失败（HTTP ${status}）`;
}

function parseModelIds(
  data: ModelListPayload,
  provider: AIModelConfig["provider"],
): string[] {
  if (provider === "google") {
    return (
      data.models?.flatMap(({ name, supportedGenerationMethods }) => {
        if (
          !name ||
          (supportedGenerationMethods &&
            !supportedGenerationMethods.includes("generateContent"))
        ) {
          return [];
        }
        return [name.replace(/^models\//, "")];
      }) ?? []
    );
  }

  return data.data?.flatMap(({ id }) => (id ? [id] : [])) ?? [];
}

async function requestModelList(
  url: URL,
  headers: HeadersInit,
): Promise<ModelListPayload> {
  const response = await fetch(url, { headers });
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    throw new ModelListRequestError(
      `拉取模型失败：空响应（HTTP ${response.status}）`,
      {
        status: response.status,
        retriableWithOpenAI:
          response.status === 0 ||
          response.status === 404 ||
          response.status === 405 ||
          response.status >= 500,
      },
    );
  }

  let data: ModelListPayload & ApiErrorResponse;
  try {
    data = JSON.parse(trimmed) as ModelListPayload & ApiErrorResponse;
  } catch {
    throw new ModelListRequestError(
      `拉取模型失败：非 JSON 响应（HTTP ${response.status}）`,
      {
        status: response.status,
        retriableWithOpenAI:
          response.status === 404 ||
          response.status === 405 ||
          response.status >= 500 ||
          !response.ok,
      },
    );
  }

  if (!response.ok) {
    throw new ModelListRequestError(
      extractErrorMessage(data, response.status),
      {
        status: response.status,
        retriableWithOpenAI:
          response.status === 404 ||
          response.status === 405 ||
          response.status >= 500,
      },
    );
  }

  return data;
}

/**
 * Derive an OpenAI-compatible models base URL from an Anthropic-style base URL.
 *
 * Examples:
 * - https://api.deepseek.com/anthropic/v1 -> https://api.deepseek.com/v1
 * - https://token-plan-cn.xiaomimimo.com/anthropic/v1 -> https://token-plan-cn.xiaomimimo.com/v1
 * - http://host:8090/anthropic/v1 -> http://host:8090/v1
 * - https://api.anthropic.com/v1 -> https://api.anthropic.com/v1 (no safer sibling)
 */
export function deriveOpenAICompatibleBaseUrl(baseUrl: string): string | null {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  if (!normalized) return null;

  if (/\/anthropic\/v\d+$/i.test(normalized)) {
    return normalized.replace(/\/anthropic\/v\d+$/i, "/v1");
  }

  if (/\/anthropic$/i.test(normalized)) {
    return normalized.replace(/\/anthropic$/i, "/v1");
  }

  try {
    const url = new URL(normalized);
    const path = url.pathname.replace(/\/+$/, "");
    if (path === "" || path === "/") {
      return `${url.origin}/v1`;
    }
  } catch {
    return null;
  }

  return null;
}

async function fetchOpenAICompatibleModelIds(
  baseUrl: string,
  apiKey: string,
): Promise<string[]> {
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/models`);
  const data = await requestModelList(url, {
    Authorization: `Bearer ${apiKey}`,
  });
  return parseModelIds(data, "openai");
}

export async function fetchAIModelIds(
  config: AIModelConfig,
): Promise<string[]> {
  const baseUrl = config.baseUrl.trim().replace(/\/+$/, "");
  const apiKey = config.apiKey.trim();

  if (!baseUrl) throw new Error("请先填写 Base URL");
  if (!apiKey) throw new Error("请先填写 API Key");

  const url = new URL(`${baseUrl}/models`);
  let models: string[];

  switch (config.provider) {
    case "openai": {
      const data = await requestModelList(url, {
        Authorization: `Bearer ${apiKey}`,
      });
      models = parseModelIds(data, "openai");
      break;
    }
    case "anthropic": {
      try {
        url.searchParams.set("limit", "1000");
        const data = await requestModelList(url, {
          "anthropic-dangerous-direct-browser-access": "true",
          "anthropic-version": "2023-06-01",
          "x-api-key": apiKey,
        });
        models = parseModelIds(data, "anthropic");
      } catch (error) {
        const fallbackBase = deriveOpenAICompatibleBaseUrl(baseUrl);
        const canFallback =
          fallbackBase &&
          fallbackBase !== baseUrl &&
          (!(error instanceof ModelListRequestError) ||
            error.retriableWithOpenAI);

        if (!canFallback || !fallbackBase) {
          throw error;
        }

        models = await fetchOpenAICompatibleModelIds(fallbackBase, apiKey);
      }
      break;
    }
    case "google": {
      url.searchParams.set("pageSize", "1000");
      const data = await requestModelList(url, {
        "x-goog-api-key": apiKey,
      });
      models = parseModelIds(data, "google");
      break;
    }
  }

  return [...new Set(models)].sort((left, right) =>
    left.localeCompare(right),
  );
}
