"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterBasicForm } from "./character-basic-form";
import { CharacterDescriptionForm } from "./character-description-form";
import { CharacterPersonalityForm } from "./character-personality-form";
import { CharacterWorldForm } from "./character-world-form";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { getPreset } from "@/hooks/usePreset";

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

    return (
        <div className="flex flex-col h-full px-6">
            <div className="border-b">
                <div className="flex h-16 items-center w-full">
                    <Tabs
                        defaultValue="basic"
                        className="w-full"
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="h-10  p-0">
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
                            {activeTab === "description" && (
                                <CharacterDescriptionForm />
                            )}
                            {activeTab === "personality" && (
                                <CharacterPersonalityForm />
                            )}
                            {activeTab === "world" && <CharacterWorldForm />}
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
                    value="description"
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
                    value="personality"
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
                    value="world"
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
