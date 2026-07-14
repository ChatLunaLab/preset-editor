import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel, ToolSet } from "ai";
import type { AIModelConfig } from "@/types/ai";

function normalizeBaseUrl(baseUrl: string): string {
  let url = baseUrl.trim();
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

export interface CreateLanguageModelOptions {
  /**
   * Prefer OpenAI Responses API (required for openai.tools.webSearch).
   * Other providers are unaffected.
   */
  preferResponsesApi?: boolean;
}

/**
 * Build an AI SDK language model from a saved multi-provider config.
 * OpenAI uses `.chat()` by default so OpenAI-compatible chat-completions endpoints work.
 * When `preferResponsesApi` is true, OpenAI uses `.responses()` for native web search.
 */
export function createLanguageModelFromConfig(
  config: AIModelConfig,
  options: CreateLanguageModelOptions = {},
): LanguageModel {
  const apiKey = config.apiKey.trim();
  const baseURL = normalizeBaseUrl(config.baseUrl);
  const modelId = config.model.trim();

  if (!apiKey) {
    throw new Error("当前模型配置缺少 API Key");
  }
  if (!baseURL) {
    throw new Error("当前模型配置缺少 Base URL");
  }
  if (!modelId) {
    throw new Error("当前模型配置缺少模型 ID");
  }

  switch (config.provider) {
    case "openai": {
      const openai = createOpenAI({
        apiKey,
        baseURL,
      });
      // web_search is a Responses-only provider-executed tool.
      return options.preferResponsesApi
        ? openai.responses(modelId)
        : openai.chat(modelId);
    }
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey,
        baseURL,
      });
      return anthropic(modelId);
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey,
        baseURL,
      });
      return google(modelId);
    }
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`不支持的模型提供商: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Official built-in web search tools for the active provider.
 * Tool keys match each provider's documented names:
 * - OpenAI: `web_search` via openai.tools.webSearch()
 * - Anthropic: `web_search` via anthropic.tools.webSearch_20250305()
 * - Google: `google_search` via google.tools.googleSearch()
 */
export function createProviderWebSearchTools(
  config: AIModelConfig,
): ToolSet {
  const apiKey = config.apiKey.trim();
  const baseURL = normalizeBaseUrl(config.baseUrl);

  if (!apiKey || !baseURL) {
    return {};
  }

  switch (config.provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey, baseURL });
      return {
        web_search: openai.tools.webSearch({}),
      };
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey, baseURL });
      return {
        web_search: anthropic.tools.webSearch_20250305({}),
      };
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey,
        baseURL,
      });
      return {
        google_search: google.tools.googleSearch({}),
      };
    }
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`不支持的模型提供商: ${String(_exhaustive)}`);
    }
  }
}
