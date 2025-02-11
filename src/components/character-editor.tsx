"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterMainBasic } from "./character-main-basic";
import { CharacterWorldLore } from "./character-world-lore";
import { CharacterMessagesForm } from "./character-messages";
import { CharacterAuthorNote } from "./character-author-note";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    exportPreset,
    usePreset,
    PresetModel,
    updatePreset as updatePresetToLocal,
} from "@/hooks/use-preset";
import { CharacterPresetTemplate, RawPreset } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { cn, updateNestedObject } from "@/lib/utils";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { CharacterBasic } from "./character-basic";

interface CharacterEditorProps {
    presetId: string;
}

export function CharacterEditor({ presetId }: CharacterEditorProps) {
    const preset = usePreset(presetId);

    const [activeTab, setActiveTab] = useState("basic");

    if (!preset) {
        // TODO: 404
        return <div>Preset not found</div>;
    }


    const tabVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
    };

    const updatePreset = async <K extends PresetModel["preset"]>(
        key: NestedKeyOf<K>,
        value: GetNestedType<PresetModel["preset"], NestedKeyOf<K>>
    ) => {
        preset.preset = updateNestedObject(preset.preset, key, value);
        await updatePresetToLocal(preset.id, preset.preset);
    };

    return (
        <div className="flex flex-col h-full px-6 scroll-auto">
            <div className="border-b bg-background sticky top-0 w-full">
                <div className="flex h-16 items-center w-full justify-between bg-background ">
                    <Tabs
                        defaultValue="basic"
                        className="w-full bg-background"
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="h-10">
                            {preset.type === "main"
                                ? <MainPresetTabs />
                                : <CharacterPresetTabs />}
                        </TabsList>
                    </Tabs>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            exportPreset(preset);
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <Download
                            className={cn(
                                "h-4 w-4 transition-transform duration-200"
                            )}
                        />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <div className="container py-6 max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={tabVariants}
                            transition={{ duration: 0.2 }}
                        >
                            {(activeTab === "basic" && preset.type === 'main') && (
                                <CharacterMainBasic
                                    updatePreset={(key, value) =>
                                        updatePreset<RawPreset>(
                                            key,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            value as any
                                        )
                                    }
                                    preset={preset.preset as RawPreset}
                                />
                            )}
                            {activeTab === "messages" && (
                                <CharacterMessagesForm
                                    updatePreset={(key, value) =>
                                        updatePreset<RawPreset>(
                                            key,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            value as any
                                        )
                                    }
                                    preset={preset.preset as RawPreset}
                                />
                            )}
                            {activeTab === "world_books" && (
                                <CharacterWorldLore
                                    updatePreset={(key, value) =>
                                        updatePreset<RawPreset>(
                                            key,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            value as any
                                        )
                                    }
                                    preset={preset.preset as RawPreset}
                                />
                            )}
                            {activeTab === "author_note" && (
                                <CharacterAuthorNote
                                    updatePreset={(key, value) =>
                                        updatePreset<RawPreset>(
                                            key,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            value as any
                                        )
                                    }
                                    preset={preset.preset as RawPreset}
                                />
                            )}

                            {(activeTab === "basic" && preset.type === 'character') && (
                                <CharacterBasic
                                    updatePreset={(key, value) =>
                                        updatePreset<CharacterPresetTemplate>(
                                            key,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            value as any
                                        )
                                    }
                                    preset={preset.preset as CharacterPresetTemplate}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}



function MainPresetTabs() {
    return (
        <>

            <TabsTrigger
                value="basic"
                className="px-3 py-1.5 text-sm font-medium transition-all"
            >
                基本配置
            </TabsTrigger>

            <TabsTrigger
                value="messages"
                className="px-3 py-1.5 text-sm font-medium transition-all"
            >
                角色提示词
            </TabsTrigger>

            <TabsTrigger
                value="world_books"
                className="px-3 py-1.5 text-sm font-medium transition-all"
            >
                世界书
            </TabsTrigger>

            <TabsTrigger
                value="author_note"
                className="px-3 py-1.5 text-sm font-medium transition-all"
            >
                作者注释
            </TabsTrigger>

        </>
    );
}

function CharacterPresetTabs() {
    return (
        <>

            <TabsTrigger
                value="basic"
                className="px-3 py-1.5 text-sm font-medium transition-all"
            >
                基本配置
            </TabsTrigger>

            <TabsTrigger
                value="system"
                className="px-3 py-1.5 text-sm font-medium transition-all"
            >
                系统提示词
            </TabsTrigger>

            <TabsTrigger
                value="input"
                className="px-3 py-1.5 text-sm font-medium transition-all"
            >
                输入提示词
            </TabsTrigger>

        </>
    );
}
