"use client";

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
import { useMemo, useState } from "react";

interface UploadPresetDialogProps {
    preset: PresetModel;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadPresetDialog({
    preset,
    open,
    onOpenChange,
}: UploadPresetDialogProps) {
    const presetName = useMemo(() => getPresetDisplayName(preset), [preset]);
    const defaultFileName = useMemo(
        () => getPresetDefaultFileName(presetName),
        [presetName],
    );

    const [fileNameOverride, setFileNameOverride] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [successUrl, setSuccessUrl] = useState("");
    const [successOpen, setSuccessOpen] = useState(false);

    const fileName = fileNameOverride ?? (open ? defaultFileName : "");

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setFileNameOverride(null);
        }
        onOpenChange(nextOpen);
    };

    const handleUpload = async () => {
        setIsUploading(true);
        try {
            const result = await uploadPreset(preset, {
                token: getPresetUploadToken(),
                fileName,
            });

            toast.success("分享成功", {
                description: `已创建 PR：${result.path}`,
            });
            setSuccessUrl(result.pull_request_url);
            setSuccessOpen(true);
            handleOpenChange(false);
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
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>分享预设</DialogTitle>
                        <DialogDescription>
                            分享后将自动创建 Pull Request 到预设仓库。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>预设名称</Label>
                            <Input value={presetName} readOnly />
                        </div>
                        <div className="grid gap-2">
                            <Label>预设类型</Label>
                            <Input
                                value={
                                    preset.type === "main"
                                        ? "主插件预设"
                                        : "伪装预设"
                                }
                                readOnly
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>文件名</Label>
                            <Input
                                value={fileName}
                                onChange={(event) =>
                                    setFileNameOverride(event.target.value)
                                }
                                placeholder="preset-name.yml"
                            />
                            <p className="text-xs text-muted-foreground">
                                仅支持字母、数字、下划线、点、短横线和 yml/yaml 后缀。
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleOpenChange(false)}
                            disabled={isUploading}
                        >
                            取消
                        </Button>
                        <Button type="button" onClick={handleUpload} disabled={isUploading}>
                            {isUploading ? "分享中..." : "分享预设"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
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
