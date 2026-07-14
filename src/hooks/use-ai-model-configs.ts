"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAIModelConfig,
  getActiveAIModelConfig,
  isAIModelConfigReady,
  loadAIModelConfigStore,
  resolveActiveConfigId,
  saveAIModelConfigStore,
  getProviderDefaultBaseUrl,
} from "@/lib/ai/model-config";
import type {
  AIModelConfig,
  AIModelConfigStore,
  AIProviderFormat,
} from "@/types/ai";
import {
  AI_MODEL_CONFIG_CHANGE_EVENT,
  AI_MODEL_CONFIG_STORAGE_KEY,
} from "@/types/ai";

function persist(store: AIModelConfigStore) {
  saveAIModelConfigStore(store);
  return loadAIModelConfigStore();
}

export function useAIModelConfigs() {
  const [store, setStore] = useState<AIModelConfigStore>(() =>
    loadAIModelConfigStore(),
  );

  const reload = useCallback(() => {
    setStore(loadAIModelConfigStore());
  }, []);

  useEffect(() => {
    const handleConfigChange = () => reload();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AI_MODEL_CONFIG_STORAGE_KEY) reload();
    };

    window.addEventListener(AI_MODEL_CONFIG_CHANGE_EVENT, handleConfigChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(
        AI_MODEL_CONFIG_CHANGE_EVENT,
        handleConfigChange,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [reload]);

  const addConfig = useCallback((provider: AIProviderFormat = "openai") => {
    const config = createAIModelConfig({ provider });
    setStore((prev) => {
      const next: AIModelConfigStore = {
        configs: [...prev.configs, config],
        activeConfigId: config.id,
      };
      return persist(next);
    });
    return config.id;
  }, []);

  const deleteConfig = useCallback((id: string) => {
    setStore((prev) => {
      const configs = prev.configs.filter((config) => config.id !== id);
      const preferredId =
        prev.activeConfigId === id ? null : prev.activeConfigId;
      const activeConfigId = resolveActiveConfigId(configs, preferredId);
      return persist({ configs, activeConfigId });
    });
  }, []);

  const updateConfig = useCallback(
    (id: string, patch: Partial<Omit<AIModelConfig, "id">>) => {
      setStore((prev) => {
        const configs = prev.configs.map((config) => {
          if (config.id !== id) {
            return config;
          }

          const nextProvider = patch.provider ?? config.provider;
          const providerChanged =
            patch.provider !== undefined && patch.provider !== config.provider;

          let nextBaseUrl = config.baseUrl;
          if (patch.baseUrl !== undefined) {
            nextBaseUrl = patch.baseUrl;
          } else if (providerChanged) {
            nextBaseUrl = getProviderDefaultBaseUrl(nextProvider);
          }

          return {
            ...config,
            ...patch,
            provider: nextProvider,
            baseUrl: nextBaseUrl,
          };
        });

        return persist({
          configs,
          activeConfigId: prev.activeConfigId,
        });
      });
    },
    [],
  );

  const setActiveConfigId = useCallback((id: string) => {
    setStore((prev) => {
      if (!prev.configs.some((config) => config.id === id)) {
        return prev;
      }
      return persist({
        configs: prev.configs,
        activeConfigId: id,
      });
    });
  }, []);

  const activeConfig = getActiveAIModelConfig(store);

  return {
    configs: store.configs,
    activeConfigId: store.activeConfigId,
    activeConfig,
    isActiveReady: isAIModelConfigReady(activeConfig),
    addConfig,
    deleteConfig,
    updateConfig,
    setActiveConfigId,
    reload,
  };
}
