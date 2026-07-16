"use client";

import { CharacterMainBasic } from "./character-main-basic";
import { CharacterWorldLore } from "./character-world-lore";
import { CharacterMessagesForm } from "./character-messages";
import { CharacterAuthorNote } from "./character-author-note";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePreset } from "@/hooks/use-preset";
import { exportPreset } from "@/lib/preset-io";
import { CharacterPresetTemplate, RawPreset } from "@/types/preset";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Download, Share2, SquarePenIcon } from "lucide-react";
import { CharacterBasic } from "./character-basic";
import { CharacterSystem } from "./character-system";
import { CharacterInput } from "./character-input";
import { UploadPresetDialog } from "./upload-preset-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { CharacterAIContent } from "./ai/character-ai-content";
import {
    CHARACTER_PRESET_FORMATS,
    MAIN_PRESET_FORMATS,
} from "./ai/character-ai-editor";
import { useAIGenerate } from "@/hooks/use-ai-generate";
import { useCharacterAIDraft } from "@/hooks/use-character-ai-draft";
import { useMainAIDraft } from "@/hooks/use-main-ai-draft";
import { usePresetUpdater } from "@/hooks/use-preset-updater";
import type {
    CharacterPresetFormat,
    EditorMode,
    MainPresetFormat,
} from "@/types/ai";
import { useNavigate, useParams } from "react-router";
import {
    buildCharacterPath,
    getRememberedCharacterPath,
    rememberCharacterPath,
    resolveEditorRoute,
    type EditorTab,
} from "@/lib/editor-route";
import {
    EditorSegmentedTabs,
    type EditorSegmentedTab,
} from "./editor-segmented-tabs";

const MODE_TABS = [
    { value: "edit", label: "配置" },
    { value: "ai", label: "助手" },
] as const;

const MAIN_PRESET_TABS = [
    { value: "basic", label: "基本配置" },
    { value: "messages", label: "角色提示词" },
    { value: "world_books", label: "世界书" },
    { value: "author_note", label: "作者注释" },
] as const;

const CHARACTER_PRESET_TABS = [
    { value: "basic", label: "基本配置" },
    { value: "system", label: "系统提示词" },
    { value: "input", label: "格式化输入提示词" },
] as const;

const AI_TABS = [
    { value: "agent", label: "Agent" },
    { value: "edit", label: "角色设定" },
    { value: "preview", label: "预览" },
] as const;

interface CharacterEditorProps {
    presetId: string;
}

export function CharacterEditor({ presetId }: CharacterEditorProps) {
    return <CharacterEditorInner key={presetId} presetId={presetId} />;
}

function CharacterEditorInner({ presetId }: CharacterEditorProps) {
    const preset = usePreset(presetId);
    const updatePreset = usePresetUpdater(presetId);
    const navigate = useNavigate();
    const params = useParams();

    const characterPreset =
        preset?.type === "character"
            ? (preset.preset as CharacterPresetTemplate)
            : null;

    const characterDraft = useCharacterAIDraft(characterPreset, updatePreset);
    const mainDraft = useMainAIDraft(presetId);
    const characterGeneration = useAIGenerate("character");
    const mainGeneration = useAIGenerate("main");

    const [uploadOpen, setUploadOpen] = useState(false);
    const [canStartNewChat, setCanStartNewChat] = useState(false);
    const newChatActionRef = useRef<(() => void) | null>(null);
    const handleNewChatActionChange = useCallback(
        (action: (() => void) | null, canStart: boolean) => {
            newChatActionRef.current = action;
            setCanStartNewChat(canStart);
        },
        [],
    );
    const [characterPresetFormat, setCharacterPresetFormat] =
        useState<CharacterPresetFormat>("tool-call");
    const [mainPresetFormat, setMainPresetFormat] =
        useState<MainPresetFormat>("markdown");

    const route = preset
        ? resolveEditorRoute(
              presetId,
              preset.type,
              params.mode,
              params.tab,
          )
        : null;
    const presetType = preset?.type;
    const routeCanonicalPath = route?.canonicalPath;
    const routeIsCanonical = route?.isCanonical;
    const routeMode = route?.mode;
    const routeTab = route?.tab;

    useEffect(() => {
        if (!routeCanonicalPath || routeIsCanonical) return;
        const targetPath =
            !params.mode && !params.tab && presetType
                ? getRememberedCharacterPath(presetId, presetType)
                : routeCanonicalPath;
        navigate(targetPath, { replace: true });
    }, [
        navigate,
        params.mode,
        params.tab,
        presetType,
        presetId,
        routeCanonicalPath,
        routeIsCanonical,
    ]);

    useEffect(() => {
        if (!presetType || !routeIsCanonical || !routeMode || !routeTab) return;
        rememberCharacterPath(presetId, presetType, routeMode, routeTab);
    }, [
        presetType,
        presetId,
        routeIsCanonical,
        routeMode,
        routeTab,
    ]);

    if (preset === null) {
        return <CharacterEditorLoading />;
    }

    if (!preset || !route) {
        return (
            <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
                未找到该预设
            </div>
        );
    }

    const editorMode = route.mode;
    const activeTab = route.tab;

    const tabVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
    };

    const navigateEditor = (mode: EditorMode, tab: EditorTab) => {
        navigate(buildCharacterPath(presetId, mode, tab, preset.type));
    };

    const handleModeChange = (mode: EditorMode) => {
        const tab: EditorTab = mode === "ai" ? "agent" : "basic";
        navigateEditor(mode, tab);
    };

    const handleTabChange = (tab: string) => {
        navigateEditor(editorMode, tab as EditorTab);
    };

    const handleGenerate = async () => {
        if (editorMode !== "ai") return;

        if (preset.type === "main") {
            if (mainGeneration.isGenerating) return;
            const result = await mainGeneration.generateWithAI(
                presetId,
                mainDraft.draft,
                mainPresetFormat,
            );
            if (!result) return;
            mainDraft.markGenerated();
            return;
        }

        if (!characterGeneration.isGenerating) {
            const merged = characterDraft.getMergedCharacterPreset(
                preset.preset as CharacterPresetTemplate,
            );
            if (merged) {
                const result = await characterGeneration.generateWithAI(
                    presetId,
                    merged,
                    characterPresetFormat,
                );
                if (!result) return;
                characterDraft.markGenerated();
            }
        }
    };

    const handleExport = () => {
        exportPreset(preset);
    };

    const exportLabel = "导出 YAML";

    const isAIMode = editorMode === "ai";
    const isAgentTab = isAIMode && activeTab === "agent";
    const contentMaxWidth = isAIMode ? "max-w-7xl" : "max-w-4xl";
    const contentKey = `${preset.type}-${editorMode}-${activeTab}`;
    let editorTabs: readonly EditorSegmentedTab[] = CHARACTER_PRESET_TABS;
    if (editorMode === "ai") {
        editorTabs = AI_TABS;
    } else if (preset.type === "main") {
        editorTabs = MAIN_PRESET_TABS;
    }

    return (
        <div
            className={cn(
                "flex flex-col px-4 sm:px-6 lg:px-8",
                isAgentTab
                    ? "relative h-[calc(100%-4rem)] min-h-0 overflow-hidden [--agent-header-height:6rem] sm:[--agent-header-height:4rem] md:h-full"
                    : "min-h-full"
            )}
        >
            <div
                className={cn(
                    "z-20 border-b backdrop-blur-xl",
                    isAgentTab
                        ? "absolute top-0 right-4 left-4 h-[var(--agent-header-height)] bg-background/70 sm:right-6 sm:left-6 lg:right-8 lg:left-8"
                        : "sticky top-0 w-full shrink-0 bg-background/95 supports-[backdrop-filter]:bg-background/85"
                )}
            >
                <div className="flex h-full w-full min-h-14 flex-col gap-2 py-2 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-2">
                    <EditorSegmentedTabs
                        value={activeTab}
                        items={editorTabs}
                        ariaLabel="编辑器页面"
                        className="min-w-0 w-full sm:flex-1"
                        onValueChange={handleTabChange}
                    />

                    <div className="flex shrink-0 items-center justify-end gap-1">
                        <EditorSegmentedTabs
                            value={editorMode}
                            items={MODE_TABS}
                            onValueChange={(value) =>
                                handleModeChange(value as EditorMode)
                            }
                            ariaLabel="预设编辑方式"
                            className={cn("w-fit", "mr-1")}
                        />
                        {isAgentTab && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    newChatActionRef.current?.()
                                                }
                                                className="h-8 w-8 p-0"
                                                aria-label="新建聊天"
                                                disabled={!canStartNewChat}
                                            >
                                                <SquarePenIcon className="h-4 w-4" />
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        新建聊天
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setUploadOpen(true)}
                                        className="h-8 w-8 p-0"
                                        aria-label="分享预设"
                                    >
                                        <Share2
                                            className={cn(
                                                "h-4 w-4 transition-transform duration-200"
                                            )}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    分享预设
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleExport}
                                            className="h-8 w-8 p-0"
                                            aria-label={exportLabel}
                                        >
                                            <Download
                                                className={cn(
                                                    "h-4 w-4 transition-transform duration-200"
                                                )}
                                            />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    {exportLabel}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    "flex-1",
                    isAgentTab && "min-h-0 overflow-hidden"
                )}
            >
                <div
                    className={cn(
                        "container mx-auto",
                        isAgentTab ? "h-full" : "py-6",
                        contentMaxWidth
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={contentKey}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={tabVariants}
                            transition={{ duration: 0.2 }}
                            className={cn(isAgentTab && "h-full min-h-0")}
                        >
                            {editorMode === "edit" &&
                                activeTab === "basic" &&
                                preset.type === "main" && (
                                    <CharacterMainBasic
                                        updatePreset={(key, value) =>
                                            updatePreset(
                                                key,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value as any
                                            )
                                        }
                                        preset={preset.preset as RawPreset}
                                    />
                                )}
                            {editorMode === "edit" &&
                                activeTab === "messages" &&
                                preset.type === "main" && (
                                    <CharacterMessagesForm
                                        updatePreset={(key, value) =>
                                            updatePreset(
                                                key,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value as any
                                            )
                                        }
                                        preset={preset.preset as RawPreset}
                                    />
                                )}
                            {editorMode === "edit" &&
                                activeTab === "world_books" &&
                                preset.type === "main" && (
                                    <CharacterWorldLore
                                        updatePreset={(key, value) =>
                                            updatePreset(
                                                key,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value as any
                                            )
                                        }
                                        preset={preset.preset as RawPreset}
                                    />
                                )}
                            {editorMode === "edit" &&
                                activeTab === "author_note" &&
                                preset.type === "main" && (
                                    <CharacterAuthorNote
                                        updatePreset={(key, value) =>
                                            updatePreset(
                                                key,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value as any
                                            )
                                        }
                                        preset={preset.preset as RawPreset}
                                    />
                                )}

                            {editorMode === "edit" &&
                                activeTab === "basic" &&
                                preset.type === "character" && (
                                    <CharacterBasic
                                        updatePreset={(key, value) =>
                                            updatePreset(
                                                key,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value as any
                                            )
                                        }
                                        preset={
                                            preset.preset as CharacterPresetTemplate
                                        }
                                    />
                                )}

                            {editorMode === "edit" &&
                                activeTab === "system" &&
                                preset.type === "character" && (
                                    <CharacterSystem
                                        updatePreset={(key, value) =>
                                            updatePreset(
                                                key,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value as any
                                            )
                                        }
                                        preset={
                                            preset.preset as CharacterPresetTemplate
                                        }
                                    />
                                )}

                            {editorMode === "edit" &&
                                activeTab === "input" &&
                                preset.type === "character" && (
                                    <CharacterInput
                                        updatePreset={(key, value) =>
                                            updatePreset(
                                                key,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value as any
                                            )
                                        }
                                        preset={
                                            preset.preset as CharacterPresetTemplate
                                        }
                                    />
                                )}

                            {isAIMode && preset.type === "main" && (
                                <CharacterAIContent<MainPresetFormat>
                                    activeTab={activeTab}
                                    presetId={presetId}
                                    presetType="main"
                                    draft={mainDraft.draft}
                                    setField={mainDraft.setField}
                                    logs={mainGeneration.logs}
                                    isGenerating={mainGeneration.isGenerating}
                                    onGenerate={handleGenerate}
                                    format={mainPresetFormat}
                                    formatOptions={MAIN_PRESET_FORMATS}
                                    preset={preset.preset as RawPreset}
                                    previewContext="main-preset"
                                    agentName="Main Preset Agent"
                                    hasPendingRoleChanges={
                                        mainDraft.isDirty
                                    }
                                    onFormatChange={setMainPresetFormat}
                                    onClearLogs={mainGeneration.clearLogs}
                                    onNewChatActionChange={
                                        handleNewChatActionChange
                                    }
                                />
                            )}

                            {isAIMode && preset.type === "character" && (
                                <CharacterAIContent<CharacterPresetFormat>
                                    activeTab={activeTab}
                                    presetId={presetId}
                                    presetType="character"
                                    draft={characterDraft.draft}
                                    setField={characterDraft.setField}
                                    logs={characterGeneration.logs}
                                    isGenerating={
                                        characterGeneration.isGenerating
                                    }
                                    onGenerate={handleGenerate}
                                    format={characterPresetFormat}
                                    formatOptions={CHARACTER_PRESET_FORMATS}
                                    preset={
                                        preset.preset as CharacterPresetTemplate
                                    }
                                    previewContext="character-preset"
                                    agentName="Character Agent"
                                    hasPendingRoleChanges={
                                        characterDraft.isDirty
                                    }
                                    onFormatChange={
                                        setCharacterPresetFormat
                                    }
                                    onClearLogs={
                                        characterGeneration.clearLogs
                                    }
                                    onNewChatActionChange={
                                        handleNewChatActionChange
                                    }
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

function CharacterEditorLoading() {
    return (
        <div
            className="flex min-h-full flex-col px-4 sm:px-6 lg:px-8"
            aria-label="正在加载预设"
            aria-busy="true"
        >
            <div className="flex min-h-16 items-center justify-between gap-3 border-b py-2">
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="hidden h-9 w-28 sm:block" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                </div>
            </div>
            <div className="container mx-auto grid max-w-4xl gap-6 py-6">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-36 w-full rounded-xl" />
            </div>
        </div>
    );
}
