import type { AIModelConfig } from "@/types/ai";

interface ApiErrorResponse {
  error?: { message?: string };
  message?: string;
}

async function request<T>(url: URL, headers: HeadersInit): Promise<T> {
  const response = await fetch(url, { headers });
  const data = (await response.json()) as T & ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        data.message ??
        `拉取模型失败（HTTP ${response.status}）`,
    );
  }
  return data;
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
      const data = await request<{ data?: Array<{ id?: string }> }>(url, {
        Authorization: `Bearer ${apiKey}`,
      });
      models = data.data?.flatMap(({ id }) => (id ? [id] : [])) ?? [];
      break;
    }
    case "anthropic": {
      url.searchParams.set("limit", "1000");
      const data = await request<{ data?: Array<{ id?: string }> }>(url, {
        "anthropic-dangerous-direct-browser-access": "true",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      });
      models = data.data?.flatMap(({ id }) => (id ? [id] : [])) ?? [];
      break;
    }
    case "google": {
      url.searchParams.set("pageSize", "1000");
      const data = await request<{
        models?: Array<{
          name?: string;
          supportedGenerationMethods?: string[];
        }>;
      }>(url, { "x-goog-api-key": apiKey });
      models =
        data.models?.flatMap(({ name, supportedGenerationMethods }) => {
          if (
            !name ||
            (supportedGenerationMethods &&
              !supportedGenerationMethods.includes("generateContent"))
          ) {
            return [];
          }
          return [name.replace(/^models\//, "")];
        }) ?? [];
      break;
    }
  }

  return [...new Set(models)].sort((left, right) =>
    left.localeCompare(right),
  );
}
