"use client";

import { CharacterList } from "@/components/character-list";
import { importPreset, usePresets } from "@/hooks/use-preset";
import { NewPresetDialog } from "@/components/new-preset-dialog";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Import, Share2 } from "lucide-react";
import { UploadGithubPresetDialog } from "@/components/upload-github-preset-dialog";
import { toast } from "sonner";

export default function Page() {
    const presets = usePresets();
    const [searchQuery, setSearchQuery] = useState("");
    const [uploadOpen, setUploadOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result as string;
                    await importPreset(data);
                } catch (error) {
                    toast.error("导入失败", {
                        description: "导入的文件格式不正确",
                    });
                    console.error(error);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <>
            <div className="container flex flex-col px-4 py-6 sm:px-6 lg:px-8">
                <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-col justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6 md:flex-row md:items-center lg:-mx-8 lg:px-8">
                    <div className="text-2xl md:text-3xl font-bold"></div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <Input
                            placeholder="搜索预设..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64"
                            autoComplete="off"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setUploadOpen(true)}
                            >
                                <Share2 className="h-4 w-4" />
                                <span className="hidden md:inline">分享预设</span>
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Import className="h-4 w-4 md:mr-0" />
                                <span className="hidden md:inline">
                                    导入预设
                                </span>
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".yaml, .yml"
                                className="hidden"
                                onChange={handleImportData}
                            />
                            <NewPresetDialog />
                        </div>
                    </div>
                </div>
                <CharacterList presets={presets} searchQuery={searchQuery} />
            </div>
            <UploadGithubPresetDialog open={uploadOpen} onOpenChange={setUploadOpen} />
        </>
    );
}
