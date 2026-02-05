"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    getPresetDisplayName,
    getPresetDefaultFileName,
    getPresetUploadToken,
    PresetModel,
    uploadPreset,
} from "@/hooks/use-preset";
import { useEffect, useMemo, useState } from "react";

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
    const toaster = useToast();
    const presetName = useMemo(() => getPresetDisplayName(preset), [preset]);

    const [fileName, setFileName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [successUrl, setSuccessUrl] = useState("");
    const [successOpen, setSuccessOpen] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }
        setFileName(getPresetDefaultFileName(presetName));
    }, [open, presetName]);

    const handleUpload = async () => {
        setIsUploading(true);
        try {
            const result = await uploadPreset(preset, {
                token: getPresetUploadToken(),
                fileName,
            });

            toaster.toast({
                title: "上传成功",
                description: `已创建 PR：${result.path}`,
            });
            setSuccessUrl(result.pull_request_url);
            setSuccessOpen(true);
            onOpenChange(false);
        } catch (error) {
            toaster.toast({
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>上传预设</DialogTitle>
                        <DialogDescription>
                            上传后将自动创建 Pull Request 到预设仓库。
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
                                    setFileName(event.target.value)
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
                            onClick={() => onOpenChange(false)}
                            disabled={isUploading}
                        >
                            取消
                        </Button>
                        <Button type="button" onClick={handleUpload} disabled={isUploading}>
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
