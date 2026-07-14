"use client";

import { useEffect, useState } from "react";
import type { AIModelConfig, AIReasoningLevel } from "@/types/ai";

const MODELS_DEV_API_URL = "https://models.dev/api.json";

export const DEFAULT_REASONING_LEVELS: AIReasoningLevel[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
];

interface ModelsDevReasoningOption {
  type?: string;
  values?: string[];
}

interface ModelsDevModel {
  id?: string;
  reasoning?: boolean;
  reasoning_options?: ModelsDevReasoningOption[] | null;
}

interface ModelsDevProvider {
  models?: Record<string, ModelsDevModel>;
}

type ModelsDevCatalog = Record<string, ModelsDevProvider>;

let catalogPromise: Promise<ModelsDevCatalog> | null = null;

function loadCatalog() {
  catalogPromise ??= fetch(MODELS_DEV_API_URL).then((response) => {
    if (!response.ok) {
      throw new Error(`models.dev returned ${response.status}`);
    }
    return response.json() as Promise<ModelsDevCatalog>;
  });
  return catalogPromise;
}

function normalizeModelId(value: string) {
  return value.trim().toLowerCase().replace(/^models\//, "");
}

function getProviderModels(
  catalog: ModelsDevCatalog,
  provider: string,
) {
  return Object.entries(catalog[provider]?.models ?? {});
}

function findModel(
  catalog: ModelsDevCatalog,
  provider: AIModelConfig["provider"],
  modelId: string,
) {
  const configuredId = normalizeModelId(modelId);
  const providerPrefix = `${provider}/`;
  const bareId = configuredId.startsWith(providerPrefix)
    ? configuredId.slice(providerPrefix.length)
    : configuredId;
  const candidates = new Set([configuredId, bareId]);

  const providerModels = getProviderModels(catalog, provider);
  const providerMatch = providerModels.find(([key, model]) =>
    candidates.has(normalizeModelId(model.id ?? key)),
  );
  if (providerMatch) return providerMatch[1];

  const exactMatches = Object.values(catalog).flatMap((provider) =>
    Object.entries(provider.models ?? {})
      .filter(([key, model]) =>
        candidates.has(normalizeModelId(model.id ?? key)),
      )
      .map(([, model]) => model),
  );
  if (exactMatches.length === 1) return exactMatches[0];

  const suffixMatches = Object.values(catalog).flatMap((provider) =>
    Object.entries(provider.models ?? {})
      .filter(([key, model]) => {
        const id = normalizeModelId(model.id ?? key);
        return id === bareId || id.endsWith(`/${bareId}`);
      })
      .map(([, model]) => model),
  );
  return suffixMatches.length === 1 ? suffixMatches[0] : undefined;
}

function getReasoningLevels(model: ModelsDevModel) {
  if (!model.reasoning) return [];

  const effort = model.reasoning_options?.find(
    (option) => option.type === "effort",
  );
  if (!effort?.values) return [];

  const values = new Set(effort.values);
  if (values.has("default")) values.add("medium");
  return DEFAULT_REASONING_LEVELS.filter((level) => values.has(level));
}

export function useModelReasoningLevels(config: AIModelConfig) {
  const model = config.model;
  const provider = config.provider;
  const [levels, setLevels] = useState<AIReasoningLevel[]>(
    DEFAULT_REASONING_LEVELS,
  );

  useEffect(() => {
    let active = true;

    void loadCatalog()
      .then((catalog) => {
        if (!active) return;
        const matchedModel = findModel(catalog, provider, model);
        setLevels(
          matchedModel
            ? getReasoningLevels(matchedModel)
            : DEFAULT_REASONING_LEVELS,
        );
      })
      .catch(() => {
        if (active) setLevels(DEFAULT_REASONING_LEVELS);
      });

    return () => {
      active = false;
    };
  }, [model, provider]);

  return levels;
}
