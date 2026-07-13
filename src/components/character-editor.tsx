"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterMainBasic } from "./character-main-basic";
import { CharacterWorldLore } from "./character-world-lore";
import { CharacterMessagesForm } from "./character-messages";
import { CharacterAuthorNote } from "./character-author-note";
import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";
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
import { Download, Upload } from "lucide-react";
import { CharacterBasic } from "./character-basic";
import { CharacterSystem } from "./character-system";
import { CharacterInput } from "./character-input";
import { UploadPresetDialog } from "./upload-preset-dialog";

interface CharacterEditorProps {
    presetId: string;
}

export function CharacterEditor({ presetId }: CharacterEditorProps) {
    const preset = usePreset(presetId);

    const [activeTab, setActiveTab] = useState("basic");
    const [uploadOpen, setUploadOpen] = useState(false);

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
        const nextPresetData = updateNestedObject(preset.preset, key, value);
        const nextName =
            preset.type === "main"
                ? (nextPresetData as RawPreset).keywords[0]
                : (nextPresetData as CharacterPresetTemplate).name;
        const nextModel: PresetModel = {
            ...preset,
            preset: nextPresetData as PresetModel["preset"],
            name: nextName,
        };
        await updatePresetToLocal(preset.id, nextModel);
    };

    return (
        <div className="flex h-full flex-col scroll-auto px-4 sm:px-6 lg:px-8">
            <div className="border-b bg-background sticky top-0 w-full">
                <div className="flex h-16 items-center w-full justify-between bg-background ">
                    <Tabs
                        value={activeTab}
                        className="w-full bg-background"
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="h-10">
                            {preset.type === "main"
                                ? <MainPresetTabs activeTab={activeTab} />
                                : <CharacterPresetTabs activeTab={activeTab} />}
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setUploadOpen(true)}
                            className="h-8 w-8 p-0"
                        >
                            <Upload
                                className={cn(
                                    "h-4 w-4 transition-transform duration-200"
                                )}
                            />
                        </Button>
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
                            {(activeTab === "messages" && preset.type === 'main') && (
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
                            {(activeTab === "world_books" && preset.type === 'main') && (
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
                            {(activeTab === "author_note" && preset.type === 'main') && (
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

                            {(activeTab === "system" && preset.type === 'character') && (
                                <CharacterSystem
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

                            {(activeTab === "input" && preset.type === 'character') && (
                                <CharacterInput
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
            <UploadPresetDialog
                preset={preset}
                open={uploadOpen}
                onOpenChange={setUploadOpen}
            />
        </div>
    );
}

const tabTriggerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
};

const tabTriggerClassName =
    "px-3 py-1.5 text-sm font-medium transition-colors group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none focus-visible:border-transparent focus-visible:bg-background/60 focus-visible:ring-0 focus-visible:outline-none data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent";

interface EditorTabTriggerProps {
    value: string;
    activeTab: string;
    children: ReactNode;
}

function EditorTabTrigger({ value, activeTab, children }: EditorTabTriggerProps) {
    return (
        <motion.div
            className="h-full"
            variants={tabTriggerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
        >
            <TabsTrigger value={value} className={tabTriggerClassName}>
                {activeTab === value && (
                    <motion.span
                        layoutId="character-editor-active-tab"
                        initial={false}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-md bg-background"
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 38,
                            mass: 0.7,
                        }}
                    />
                )}
                <span className="relative z-10">{children}</span>
            </TabsTrigger>
        </motion.div>
    );
}

function MainPresetTabs({ activeTab }: { activeTab: string }) {
    return (
        <>
            <EditorTabTrigger value="basic" activeTab={activeTab}>
                基本配置
            </EditorTabTrigger>
            <EditorTabTrigger value="messages" activeTab={activeTab}>
                角色提示词
            </EditorTabTrigger>
            <EditorTabTrigger value="world_books" activeTab={activeTab}>
                世界书
            </EditorTabTrigger>
            <EditorTabTrigger value="author_note" activeTab={activeTab}>
                作者注释
            </EditorTabTrigger>
        </>
    );
}

function CharacterPresetTabs({ activeTab }: { activeTab: string }) {
    return (
        <>
            <EditorTabTrigger value="basic" activeTab={activeTab}>
                基本配置
            </EditorTabTrigger>
            <EditorTabTrigger value="system" activeTab={activeTab}>
                系统提示词
            </EditorTabTrigger>
            <EditorTabTrigger value="input" activeTab={activeTab}>
                格式化输入提示词
            </EditorTabTrigger>
        </>
    );
}
