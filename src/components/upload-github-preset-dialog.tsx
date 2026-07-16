"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { PresetModel } from "@/lib/database";
import { getPresetDisplayName } from "@/lib/preset-store";
import {
    getPresetDefaultFileName,
    getPresetUploadToken,
    uploadPreset,
} from "@/lib/preset-io";
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

function UploadGithubPresetDialogContent({
    onOpenChange,
    onUploadSuccess,
}: {
    onOpenChange: (open: boolean) => void;
    onUploadSuccess: (url: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [preset, setPreset] = useState<PresetModel | null>(null);
    const [fileNameOverride, setFileNameOverride] = useState<string | null>(null);

    const presetName = useMemo(() => (preset ? getPresetDisplayName(preset) : ""), [preset]);
    const defaultFileName = useMemo(
        () => (preset ? getPresetDefaultFileName(presetName) : ""),
        [preset, presetName],
    );
    const fileName = fileNameOverride ?? defaultFileName;

    const parsePresetContent = (content: string) => {
        const raw = load(content) as RawPreset | CharacterPresetTemplate;
        if (!isRawPreset(raw) && !isCharacterPresetTemplate(raw)) {
            throw new Error("Invalid preset");
        }
        return raw;
    };

    const handleFile = async (file: File) => {
        if (!isAllowedFile(file)) {
            toast.error("文件无效", {
                description: "仅支持 .yml 或 .yaml 文件",
            });
            return;
        }

        try {
            const content = await file.text();
            const rawPreset = parsePresetContent(content);
            const model = buildPresetModel(rawPreset);
            setFileNameOverride(null);
            setPreset(model);
        } catch (error) {
            toast.error("文件无效", {
                description: "文件格式不正确，无法解析预设",
            });
            console.error(error);
        }
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        if (files.length > 1) {
            toast.error("无法选择文件", {
                description: "一次只能上传一个文件",
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

            toast.success("分享成功", {
                description: `已创建 PR：${result.path}`,
            });
            onUploadSuccess(result.pull_request_url);
            onOpenChange(false);
        } catch (error) {
            toast.error("分享失败", {
                description:
                    error instanceof Error ? error.message : "分享失败",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <DialogContent className="max-w-[90vw] sm:max-w-[520px] rounded-2xl">
            <DialogHeader>
                <DialogTitle>分享预设</DialogTitle>
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
                            onChange={(event) => setFileNameOverride(event.target.value)}
                            placeholder="preset-name.yml"
                        />
                        <p className="text-xs text-muted-foreground">
                            仅支持字母、数字、下划线、点、短横线和 yml/yaml 后缀。
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setPreset(null);
                            setFileNameOverride(null);
                        }}
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
                    {isUploading ? "分享中..." : "分享预设"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export function UploadGithubPresetDialog({
    open,
    onOpenChange,
}: UploadGithubPresetDialogProps) {
    const [successUrl, setSuccessUrl] = useState("");
    const [successOpen, setSuccessOpen] = useState(false);
    const [sessionKey, setSessionKey] = useState(0);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setSessionKey((key) => key + 1);
        }
        onOpenChange(nextOpen);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                {open && (
                    <UploadGithubPresetDialogContent
                        key={sessionKey}
                        onOpenChange={handleOpenChange}
                        onUploadSuccess={(url) => {
                            setSuccessUrl(url);
                            setSuccessOpen(true);
                        }}
                    />
                )}
            </Dialog>

            <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>分享成功</DialogTitle>
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
