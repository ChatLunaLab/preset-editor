"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAIModelConfigs } from "@/hooks/use-ai-model-configs";
import { fetchAIModelIds } from "@/lib/ai/model-list";
import { AI_PROVIDER_LABELS, type AIProviderFormat } from "@/types/ai";
import {
  Check,
  ChevronsUpDown,
  CircleHelp,
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useState } from "react";
import { toast } from "sonner";

const PROVIDERS: AIProviderFormat[] = ["openai", "anthropic", "google"];

export function AIModelSettings() {
  const {
    configs,
    activeConfigId,
    activeConfig,
    addConfig,
    deleteConfig,
    updateConfig,
    setActiveConfigId,
  } = useAIModelConfigs();
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingConfigId, setLoadingConfigId] = useState<string | null>(null);
  const [modelPickerConfigId, setModelPickerConfigId] = useState<string | null>(
    null,
  );

  const selected = activeConfig ?? configs[0] ?? null;
  const models = selected?.availableModels ?? [];

  const clearModelOptions = (configId: string) => {
    if (modelPickerConfigId === configId) {
      setModelPickerConfigId(null);
    }
  };

  const handleFetchModels = async () => {
    if (!selected) {
      return;
    }

    setLoadingConfigId(selected.id);
    try {
      const nextModels = await fetchAIModelIds(selected);
      updateConfig(selected.id, { availableModels: nextModels });
      if (nextModels.length === 0) {
        toast.warning("接口未返回可用模型");
      } else {
        toast.success("模型列表已更新");
        setModelPickerConfigId(selected.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "拉取模型失败");
    } finally {
      setLoadingConfigId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">AI 模型配置</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0 gap-1"
          onClick={() => addConfig("openai")}
        >
          <Plus className="h-4 w-4" />
          新增
        </Button>
      </div>

      {configs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          尚未添加模型配置。点击「新增」创建第一条。
        </div>
      ) : (
        selected && (
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>配置</Label>
              <div className="flex gap-2">
                <Select
                  value={activeConfigId ?? selected.id}
                  onValueChange={setActiveConfigId}
                >
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name || "未命名配置"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive"
                  aria-label="删除配置"
                  title="删除配置"
                  onClick={() => deleteConfig(selected.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ai-config-name">名称</Label>
              <Input
                id="ai-config-name"
                value={selected.name}
                onChange={(event) =>
                  updateConfig(selected.id, { name: event.target.value })
                }
                placeholder="例如：工作站 OpenAI"
              />
            </div>

            <div className="grid gap-2">
              <Label>提供商</Label>
              <Select
                value={selected.provider}
                onValueChange={(value) => {
                  clearModelOptions(selected.id);
                  updateConfig(selected.id, {
                    provider: value as AIProviderFormat,
                    model: "",
                    availableModels: [],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {AI_PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ai-config-key">API Key</Label>
              <InputGroup>
                <InputGroupInput
                  id="ai-config-key"
                  type={showApiKey ? "text" : "password"}
                  value={selected.apiKey}
                  onChange={(event) => {
                    clearModelOptions(selected.id);
                    updateConfig(selected.id, {
                      apiKey: event.target.value,
                      availableModels: [],
                    });
                  }}
                  placeholder="请输入 API Key"
                  autoComplete="new-password"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                    title={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                    onClick={() => setShowApiKey((visible) => !visible)}
                  >
                    {showApiKey ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="ai-config-base">Base URL</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Base URL 说明"
                      >
                        <CircleHelp className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-80 border bg-popover text-popover-foreground shadow-md"
                      sideOffset={6}
                    >
                      API 服务的基础地址。静态网页直连官方 API
                      可能受浏览器跨域策略限制；遇到 CORS
                      错误时，请使用支持跨域的代理地址。
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="ai-config-base"
                value={selected.baseUrl}
                onChange={(event) => {
                    clearModelOptions(selected.id);
                    updateConfig(selected.id, {
                      baseUrl: event.target.value,
                      availableModels: [],
                    });
                }}
                placeholder="API Base URL"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ai-config-model">模型 ID</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={loadingConfigId === selected.id}
                  onClick={handleFetchModels}
                >
                  {loadingConfigId === selected.id ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  拉取模型
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="ai-config-model"
                  className="min-w-0 flex-1"
                  value={selected.model}
                  onChange={(event) =>
                    updateConfig(selected.id, { model: event.target.value })
                  }
                  placeholder="输入模型 ID"
                />
                {models.length > 0 && (
                  <PopoverPrimitive.Root
                    open={modelPickerConfigId === selected.id}
                    onOpenChange={(open) =>
                      setModelPickerConfigId(open ? selected.id : null)
                    }
                  >
                    <PopoverPrimitive.Trigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 gap-1.5"
                      >
                        选择模型
                        <ChevronsUpDown className="size-3.5 opacity-60" />
                      </Button>
                    </PopoverPrimitive.Trigger>
                    <PopoverPrimitive.Portal>
                      <PopoverPrimitive.Content
                        align="end"
                        sideOffset={4}
                        className="z-50 flex max-h-[min(24rem,70vh)] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
                      >
                        <Command className="max-h-full">
                          <CommandInput placeholder="搜索模型 ID" />
                          <CommandList className="max-h-[min(18rem,50vh)] overflow-y-auto overscroll-contain">
                            <CommandEmpty>没有匹配的模型</CommandEmpty>
                            <CommandGroup>
                              {models.map((model) => (
                                <CommandItem
                                  key={model}
                                  value={model}
                                  onSelect={() => {
                                    updateConfig(selected.id, { model });
                                    setModelPickerConfigId(null);
                                  }}
                                >
                                  <Check
                                    className={
                                      selected.model === model
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }
                                  />
                                  <span className="truncate">{model}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                  </PopoverPrimitive.Root>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
