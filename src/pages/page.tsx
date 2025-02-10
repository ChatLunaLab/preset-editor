"use client";

import { MainLayout } from "@/components/main-layout";
import { CharacterList } from "@/components/character-list";
import { Button } from "@/components/ui/button";
import { importPreset, usePresets } from "@/hooks/use-preset";
import { NewPresetDialog } from "@/components/new-preset-dialog";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Page() {
    const presets = usePresets();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

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
            <div className="container flex flex-col py-6 px-6">
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
                                onClick={() => fileInputRef.current?.click()}
                            >
                                导入预设
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
        </MainLayout>
    );
}
