"use client";

import { MainLayout } from "@/components/main-layout";
import { CharacterList } from "@/components/character-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePresets } from "@/hooks/usePreset";
import { NewPresetDialog } from "@/components/new-preset-dialog";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export default function Page() {
    const presets = usePresets();
    const [searchQuery, setSearchQuery] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // TODO: Implement the logic to create a new preset from the imported data
                    console.log("Imported data:", e.target?.result);
                } catch (error) {
                    console.error("Error parsing imported data:", error);
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
