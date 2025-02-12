"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterMainBasic } from "./character-main-basic";
import { CharacterWorldLore } from "./character-world-lore";
import { CharacterMessagesForm } from "./character-messages";
import { CharacterAuthorNote } from "./character-author-note";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, createRef } from "react";
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
import { CharacterSystem } from "./character-system";
import { CharacterInput } from "./character-input";

interface CharacterEditorProps {
    presetId: string;
}

export function CharacterEditor({ presetId }: CharacterEditorProps) {
    const preset = usePreset(presetId);

    const [activeTab, setActiveTab] = useState("basic");
    const tabRefs = useRef<Record<string, React.RefObject<HTMLButtonElement>>>({
        basic: createRef<HTMLButtonElement>(),
        messages: createRef<HTMLButtonElement>(),
        world_books: createRef<HTMLButtonElement>(),
        author_note: createRef<HTMLButtonElement>(),
        system: createRef<HTMLButtonElement>(),
        input: createRef<HTMLButtonElement>(),
    })

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
        if (preset.type === "main") {
            preset.name = (preset.preset as RawPreset).keywords[0];
        } else {
            preset.name = (preset.preset as CharacterPresetTemplate).name;
        }
        await updatePresetToLocal(preset.id, preset);
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
                        <TabsList className="h-10 relative pb-2">
                            {preset.type === "main"
                                ? <MainPresetTabs tabRefs={tabRefs.current} />
                                : <CharacterPresetTabs tabRefs={tabRefs.current} />}
                            <ActiveTabIndicator activeTab={activeTab} tabRefs={tabRefs.current} />
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
        </div>
    );
}

const tabTriggerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
};


function MainPresetTabs({ tabRefs }: { tabRefs: Record<string, React.RefObject<HTMLButtonElement>> }) {
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
                    className="relative px-3 py-1.5 text-sm font-medium transition-all z-10 data-[state=active]:bg-[transparent]"
                    ref={tabRefs.basic}
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
                    className="relative px-3 py-1.5 text-sm font-medium transition-all z-10 data-[state=active]:bg-[transparent]"
                    ref={tabRefs.messages}
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
                    className="relative px-3 py-1.5 text-sm font-medium transition-all z-10 data-[state=active]:bg-[transparent]"
                    ref={tabRefs.world_books}
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
                    className="relative px-3 py-1.5 text-sm font-medium transition-all z-10 data-[state=active]:bg-[transparent]"
                    ref={tabRefs.author_note}
                >
                    作者注释
                </TabsTrigger>
            </motion.div>
        </>
    );
}

function CharacterPresetTabs({ tabRefs }: { tabRefs: Record<string, React.RefObject<HTMLButtonElement>> }) {
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
                    className="relative px-3 py-1.5 text-sm font-medium transition-all z-10 data-[state=active]:bg-[transparent]"

                    ref={tabRefs.basic}
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
                    className="relative px-3 py-1.5 text-sm font-medium transition-all z-10 data-[state=active]:bg-[transparent]"
                    ref={tabRefs.system}
                    value="system"
                >
                    系统提示词
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
                    value="input"
                    className="relative px-3 py-1.5 text-sm font-medium transition-all z-10 data-[state=active]:bg-[transparent]"
                    ref={tabRefs.input}
                >
                    格式化输入提示词
                </TabsTrigger>
            </motion.div>

        </>
    );
}


interface ActiveTabIndicatorProps {
    activeTab: string;
    tabRefs: Record<string, React.RefObject<HTMLButtonElement>>;
}

const ActiveTabIndicator: React.FC<ActiveTabIndicatorProps> = ({ activeTab, tabRefs }) => {
    const [indicatorWidth, setIndicatorWidth] = useState(0);
    const [indicatorLeft, setIndicatorLeft] = useState(0);

    useEffect(() => {
        const updateIndicator = () => {
            const currentTabRef = tabRefs[activeTab as keyof typeof tabRefs];
            if (currentTabRef && currentTabRef.current) {
                setIndicatorWidth(currentTabRef.current.offsetWidth);
                setIndicatorLeft(currentTabRef.current.offsetLeft);
            }
        };

        updateIndicator();
        window.addEventListener("resize", updateIndicator);

        return () => {
            window.removeEventListener("resize", updateIndicator);
        };
    }, [activeTab, tabRefs]);

    return (
        <motion.div
            className="absolute top-[4px] left-0 h-8 bg-background rounded-(--radius) transition-all duration-300 z-1"
            style={{
                left: indicatorLeft,
                width: indicatorWidth,
            }}
            layout
        />
    );
};
