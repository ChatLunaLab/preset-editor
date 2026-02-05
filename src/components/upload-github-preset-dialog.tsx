"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    getPresetDefaultFileName,
    getPresetDisplayName,
    getPresetUploadToken,
    PresetModel,
    uploadPreset,
} from "@/hooks/use-preset";
import { cn } from "@/lib/utils";
import { isCharacterPresetTemplate, isRawPreset, RawPreset, CharacterPresetTemplate } from "@/types/preset";
import { load } from "js-yaml";

interface UploadGithubPresetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ALLOWED_EXTENSIONS = [".yml", ".yaml"];

function isAllowedFile(file: File) {
    const lowerName = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function buildPresetModel(preset: RawPreset | CharacterPresetTemplate): PresetModel {
    if (isRawPreset(preset)) {
        const name = preset.keywords?.[0] ?? "preset";
        return {
            id: crypto.randomUUID(),
            name,
            type: "main",
            lastModified: Date.now(),
            preset,
        };
    }

    if (isCharacterPresetTemplate(preset)) {
        const name = preset.name ?? "preset";
        return {
            id: crypto.randomUUID(),
            name,
            type: "character",
            lastModified: Date.now(),
            preset,
        };
    }

    throw new Error("Invalid preset");
}

export function UploadGithubPresetDialog({
    open,
    onOpenChange,
}: UploadGithubPresetDialogProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [preset, setPreset] = useState<PresetModel | null>(null);
    const [fileName, setFileName] = useState("");
    const [successUrl, setSuccessUrl] = useState("");
    const [successOpen, setSuccessOpen] = useState(false);

    const presetName = useMemo(() => (preset ? getPresetDisplayName(preset) : ""), [preset]);

    useEffect(() => {
        if (!open) {
            return;
        }
        setPreset(null);
        setFileName("");
        setSuccessOpen(false);
        setSuccessUrl("");
        setIsDragging(false);
    }, [open]);

    useEffect(() => {
        if (preset) {
            setFileName(getPresetDefaultFileName(presetName));
        }
    }, [preset, presetName]);

    const parsePresetContent = (content: string) => {
        const raw = load(content) as RawPreset | CharacterPresetTemplate;
        if (!isRawPreset(raw) && !isCharacterPresetTemplate(raw)) {
            throw new Error("Invalid preset");
        }
        return raw;
    };

    const handleFile = async (file: File) => {
        if (!isAllowedFile(file)) {
            toast({
                title: "上传失败",
                description: "仅支持 .yml 或 .yaml 文件",
                variant: "destructive",
            });
            return;
        }

        try {
            const content = await file.text();
            const rawPreset = parsePresetContent(content);
            const model = buildPresetModel(rawPreset);
            setPreset(model);
        } catch (error) {
            toast({
                title: "上传失败",
                description: "文件格式不正确，无法解析预设",
                variant: "destructive",
            });
            console.error(error);
        }
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        if (files.length > 1) {
            toast({
                title: "上传失败",
                description: "一次只能上传一个文件",
                variant: "destructive",
            });
            return;
        }

        await handleFile(files[0]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async () => {
        if (!preset) {
            return;
        }
        setIsUploading(true);
        try {
            const result = await uploadPreset(preset, {
                token: getPresetUploadToken(),
                fileName,
            });

            toast({
                title: "上传成功",
                description: `已创建 PR：${result.path}`,
            });
            setSuccessUrl(result.pull_request_url);
            setSuccessOpen(true);
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "上传失败",
                description:
                    error instanceof Error ? error.message : "上传失败",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[90vw] sm:max-w-[520px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>上传预设</DialogTitle>
                        <DialogDescription>
                            选择本地预设文件后将自动创建 Pull Request 到 GitHub 仓库。
                        </DialogDescription>
                    </DialogHeader>

                    {!preset && (
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                            )}
                            onDragEnter={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={(event) => {
                                event.preventDefault();
                                setIsDragging(false);
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                setIsDragging(false);
                                void handleFiles(event.dataTransfer?.files ?? null);
                            }}
                        >
                            <p className="text-sm text-muted-foreground">
                                将 .yml/.yaml 文件拖到这里
                            </p>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                选择文件
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".yaml,.yml"
                                className="hidden"
                                onChange={(event) => void handleFiles(event.target.files)}
                            />
                        </div>
                    )}

                    {preset && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>预设名称</Label>
                                <Input value={presetName} readOnly />
                            </div>
                            <div className="grid gap-2">
                                <Label>预设类型</Label>
                                <Input
                                    value={preset.type === "main" ? "主插件预设" : "伪装预设"}
                                    readOnly
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>文件名</Label>
                                <Input
                                    value={fileName}
                                    onChange={(event) => setFileName(event.target.value)}
                                    placeholder="preset-name.yml"
                                />
                                <p className="text-xs text-muted-foreground">
                                    仅支持字母、数字、下划线、点、短横线和 yml/yaml 后缀。
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setPreset(null)}
                                disabled={isUploading}
                            >
                                重新选择文件
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={isUploading}
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUpload}
                            disabled={!preset || isUploading}
                        >
                            {isUploading ? "上传中..." : "开始上传"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>上传成功</DialogTitle>
                        <DialogDescription>
                            已创建 Pull Request，请前往查看。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label>Pull Request 地址</Label>
                        <Input value={successUrl} readOnly />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                if (successUrl) {
                                    navigator.clipboard?.writeText(successUrl);
                                }
                            }}
                        >
                            复制链接
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (successUrl) {
                                    window.open(successUrl, "_blank", "noopener");
                                }
                            }}
                        >
                            打开
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
