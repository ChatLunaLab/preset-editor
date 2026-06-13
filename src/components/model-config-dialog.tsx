import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Settings, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ModelConfigDialog() {
    const { toast } = useToast();
    const [apiUrl, setApiUrl] = useState("");
    const [token, setToken] = useState("");
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("chatluna_model_config");
            if (saved) {
                const config = JSON.parse(saved);
                setApiUrl(config.apiUrl || "");
                setToken(config.token || "");
                setSelectedModel(config.selectedModel || "");
                if (config.selectedModel) {
                    setModels([config.selectedModel]); // Show currently selected model in the list
                }
            }
        } catch (e) {
            console.error("Failed to load local model config", e);
        }
    }, []);

    const fetchModels = async () => {
        if (!apiUrl.trim()) {
            toast({
                title: "获取失败",
                description: "请输入 API 地址",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            // Standardize URL
            let formattedUrl = apiUrl.trim();
            if (formattedUrl.endsWith("/")) {
                formattedUrl = formattedUrl.slice(0, -1);
            }
            
            let url = `${formattedUrl}/models`;
            const headers: Record<string, string> = {
                "Accept": "application/json"
            };

            const trimmedToken = token.trim();
            if (trimmedToken) {
                // OpenAI compatible format (standard)
                headers["Authorization"] = `Bearer ${trimmedToken}`;
                
                // Anthropic compatible format
                headers["x-api-key"] = trimmedToken;
                headers["anthropic-version"] = "2023-06-01";
                
                // Gemini compatible header format
                headers["x-goog-api-key"] = trimmedToken;

                // Gemini compatible query parameter format (if google/googleapis in URL)
                if (formattedUrl.includes("googleapis.com") || formattedUrl.includes("google")) {
                    const separator = url.includes("?") ? "&" : "?";
                    url = `${url}${separator}key=${encodeURIComponent(trimmedToken)}`;
                }
            }

            const res = await fetch(url, { headers });
            if (!res.ok) {
                throw new Error(`HTTP 错误: ${res.status}`);
            }

            const data = await res.json();
            // Parse models
            const list = (data.data || [])
                .map((m: any) => typeof m === "string" ? m : m.id)
                .filter(Boolean);

            if (list.length === 0) {
                toast({
                    title: "获取成功但列表为空",
                    description: "未在返回的数据中找到可用模型",
                });
            } else {
                setModels(list);
                toast({
                    title: "获取成功",
                    description: `已获取到 ${list.length} 个可用模型`,
                });
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "获取模型列表失败",
                description: err.message || "网络请求错误，请检查接口地址及 Token",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectModel = (model: string) => {
        setSelectedModel(model);
        const config = {
            apiUrl: apiUrl.trim(),
            token: token.trim(),
            selectedModel: model
        };
        localStorage.setItem("chatluna_model_config", JSON.stringify(config));
        toast({
            title: "保存成功",
            description: `模型已成功切换并保存为: ${model}`,
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 md:flex-none gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>模型配置</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[90vw] md:max-w-[500px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>模型配置</DialogTitle>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="apiUrl" className="font-semibold text-sm">API 地址</Label>
                        <div className="flex gap-2">
                            <Input
                                id="apiUrl"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                placeholder="例如: https://api.openai.com/v1"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                disabled={isLoading}
                                onClick={fetchModels}
                                className="px-4"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "获取"
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="token" className="font-semibold text-sm">API Token (秘钥)</Label>
                        <Input
                            id="token"
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="请输入 API Key / Bearer Token (可选)"
                        />
                    </div>

                    {models.length > 0 && (
                        <div className="grid gap-2">
                            <Label className="font-semibold text-sm">选择模型 (点击自动保存)</Label>
                            <div className="max-h-[200px] overflow-y-auto border rounded-xl p-2 bg-muted/20 space-y-1">
                                {models.map((model) => {
                                    const isSelected = selectedModel === model;
                                    return (
                                        <button
                                            key={model}
                                            type="button"
                                            onClick={() => handleSelectModel(model)}
                                            className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg text-left transition-all duration-150 ${
                                                isSelected
                                                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                                    : "hover:bg-muted text-foreground"
                                            }`}
                                        >
                                            <span className="truncate">{model}</span>
                                            {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <DialogClose asChild>
                    <Button variant="secondary" className="w-full">关闭</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
