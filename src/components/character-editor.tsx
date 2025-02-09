"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterBasicForm } from "./character-basic-form";
import { CharacterDescriptionForm } from "./character-description-form";
import { CharacterMessagesForm } from "./character-messages";
import { CharacterWorldForm } from "./character-world-form";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    getPreset,
    PresetModel,
    updatePreset as updatePresetToLocal,
} from "@/hooks/usePreset";
import { RawPreset } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { updateNestedObject } from "@/lib/utils";

interface CharacterEditorProps {
    presetId: string;
}

export function CharacterEditor({ presetId }: CharacterEditorProps) {
    const [activeTab, setActiveTab] = useState("basic");

    const preset = getPreset(presetId);

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
        console.log(key,value)
        preset.preset = updateNestedObject(preset.preset, key, value);
        await updatePresetToLocal(preset.id, preset.preset);
    };

    return (
        <div className="flex flex-col h-full px-6 scroll-auto">
            <div className="border-b bg-background sticky top-0 w-full">
                <div className="flex h-16 items-center w-full ">
                    <Tabs
                        defaultValue="basic"
                        className="w-full"
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="h-10 p-0">
                            {preset.type === "main"
                                ? mainPresetTabs()
                                : characterPresetTabs()}
                        </TabsList>
                    </Tabs>
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
                            {activeTab === "basic" && <CharacterBasicForm />}
                            {activeTab === "messages" && (
                                <CharacterMessagesForm
                                    updatePreset={(key, value) =>
                                        updatePreset<RawPreset>(key, value as any)
                                    }
                                    preset={preset.preset as RawPreset}
                                />
                            )}
                            {activeTab === "world_books" && (
                                <CharacterDescriptionForm />
                            )}
                            {activeTab === "author_note" && (
                                <CharacterWorldForm />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

const tabTriggerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
};

function mainPresetTabs() {
    return (
        <>
            <motion.div
                variants={tabTriggerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
            >
                <TabsTrigger
                    value="basic"
                    className="px-3 py-1.5 text-sm font-medium transition-all"
                >
                    基本配置
                </TabsTrigger>
            </motion.div>
            <motion.div
                variants={tabTriggerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
            >
                <TabsTrigger
                    value="messages"
                    className="px-3 py-1.5 text-sm font-medium transition-all"
                >
                    角色提示词
                </TabsTrigger>
            </motion.div>
            <motion.div
                variants={tabTriggerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
            >
                <TabsTrigger
                    value="world_books"
                    className="px-3 py-1.5 text-sm font-medium transition-all"
                >
                    世界书
                </TabsTrigger>
            </motion.div>
            <motion.div
                variants={tabTriggerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
            >
                <TabsTrigger
                    value="author_note"
                    className="px-3 py-1.5 text-sm font-medium transition-all"
                >
                    作者注释
                </TabsTrigger>
            </motion.div>
        </>
    );
}

function characterPresetTabs() {
    return (
        <>
            <motion.div
                variants={tabTriggerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
            >
                <TabsTrigger
                    value="basic_character"
                    className="px-3 py-1.5 text-sm font-medium transition-all"
                >
                    基本配置
                </TabsTrigger>
            </motion.div>
            <motion.div
                variants={tabTriggerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
            >
                <TabsTrigger
                    value="system_character"
                    className="px-3 py-1.5 text-sm font-medium transition-all"
                >
                    系统消息
                </TabsTrigger>
            </motion.div>
            <motion.div
                variants={tabTriggerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
            >
                <TabsTrigger
                    value="input_character"
                    className="px-3 py-1.5 text-sm font-medium transition-all"
                >
                    输入消息
                </TabsTrigger>
            </motion.div>
        </>
    );
}
