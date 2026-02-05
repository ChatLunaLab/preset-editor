"use client";

"use client";

import { MainLayout } from "@/components/main-layout";
import { CharacterList } from "@/components/character-list";
import { importPreset, usePresets } from "@/hooks/use-preset";
import { NewPresetDialog } from "@/components/new-preset-dialog";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Import, Upload } from "lucide-react";
import { UploadGithubPresetDialog } from "@/components/upload-github-preset-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Page() {
    const presets = usePresets();
    const { toast } = useToast();
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
                    toast({
                        title: "导入失败",
                        description: "导入的文件格式不正确",
                        variant: "destructive",
                    });
                    console.error(error);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <MainLayout>
            <div className="container flex flex-col py-6 px-6 md:px-12 lg:px-24">
                <div className="flex flex-col md:flex-row md:items-center  justify-between gap-4 mb-6">
                    <div className="text-2xl md:text-3xl font-bold"></div>
                    <div className="flex items-center gap-4">
                        <Input
                            placeholder="搜索预设..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64"
                            autoComplete="off"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setUploadOpen(true)}
                            >
                                <Upload className="h-4 w-4" />
                                <span className="hidden md:inline">上传预设</span>
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
        </MainLayout>
    );
}
