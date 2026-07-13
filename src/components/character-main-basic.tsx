import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "./ui/switch";
import { RawPreset } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TemplateEditor } from "./template-editor";

interface CharacterBasicFormProps {
    updatePreset?: <K extends NestedKeyOf<RawPreset>>(
        key: K,
        value: GetNestedType<RawPreset, K>
    ) => void;
    preset: RawPreset;
}

export function CharacterMainBasic({
    updatePreset,
    preset,
}: CharacterBasicFormProps) {
    const [openSections, setOpenSections] = useState({
        basic: true,
        other: false,
        postHandler: false,
        knowledge: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="grid gap-6">
            <Card className="gap-0 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>基本信息</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection("basic")}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                openSections.basic ? "rotate-180" : ""
                            )}
                        />
                    </Button>
                </CardHeader>
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        openSections.basic
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]"
                    )}
                >
                    <div className="overflow-hidden">
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">预设名称</Label>
                                    <Input
                                        id="name"
                                        type="string"
                                        value={preset.keywords.join(", ")}
                                        placeholder="预设名称"
                                        onChange={(e) => {
                                            const keywords =
                                                e.target.value.split(",").map(s => s.trim())
                                            updatePreset?.(
                                                "keywords",
                                                keywords
                                            );
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">版本号（可选）</Label>
                                    <Input
                                        id="type"
                                        type="string"
                                        value={preset.version}
                                        placeholder="预设的版本号"
                                        className="rounded-lg"
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "version",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="format-user-prompt">
                                    用户格式化输入
                                </Label>
                                <TemplateEditor
                                    id="format-user-prompt"
                                    placeholder="用户的格式化输入"
                                    context="format-user"
                                    minRows={5}
                                    ariaLabel="用户格式化输入"
                                    value={preset.format_user_prompt}
                                    onChange={(value) =>
                                        updatePreset?.(
                                            "format_user_prompt",
                                            value
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>

            <Card className="gap-0 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>后处理器 （Post Handler） 配置</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection("postHandler")}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                openSections.postHandler ? "rotate-180" : ""
                            )}
                        />
                    </Button>
                </CardHeader>
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        openSections.postHandler
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]"
                    )}
                >
                    <div className="overflow-hidden">
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="prefix">
                                        内容主体前缀（prefix）
                                    </Label>
                                    <Input
                                        id="prefix"
                                        type="string"
                                        className="rounded-lg"
                                        value={
                                            preset.config?.postHandler?.prefix
                                        }
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "config.postHandler.prefix",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="suffix">
                                        内容主体后缀（prefix）
                                    </Label>
                                    <Input
                                        id="suffix"
                                        type="string"
                                        value={
                                            preset.config?.postHandler?.postfix
                                        }
                                        className="rounded-lg"
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "config.postHandler.postfix",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2 flex items-center">
                                    <Label
                                        htmlFor="censor"
                                        className="mr-4 mt-2"
                                    >
                                        是否启用 Censor 审核
                                    </Label>
                                    <Switch
                                        id="censor"
                                        onCheckedChange={(e) => {
                                            updatePreset?.(
                                                "config.postHandler.censor",
                                                e
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>

            <Card className="gap-0 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>知识库配置</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection("knowledge")}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                openSections.knowledge ? "rotate-180" : ""
                            )}
                        />
                    </Button>
                </CardHeader>
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        openSections.knowledge
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]"
                    )}
                >
                    <div className="overflow-hidden">
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        使用的知识库列表，用逗号分割
                                    </Label>
                                    <Input
                                        id="name"
                                        type="string"
                                        value={(() => {
                                            const id =
                                                preset.knowledge?.knowledge;
                                            if (typeof id === "string") {
                                                return id;
                                            } else if (Array.isArray(id)) {
                                                return id.join(",");
                                            } else {
                                                return "";
                                            }
                                        })()}
                                        placeholder="预设名称"
                                        onChange={(e) => {
                                            const keywords =
                                                e.target.value.split(",");
                                            updatePreset?.(
                                                "knowledge.knowledge",
                                                keywords
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="knowledge-prompt">
                                    知识库检索预设
                                </Label>
                                <TemplateEditor
                                    id="knowledge-prompt"
                                    placeholder="知识库的预设"
                                    context="knowledge"
                                    minRows={5}
                                    ariaLabel="知识库检索预设"
                                    value={preset.knowledge?.prompt}
                                    onChange={(value) =>
                                        updatePreset?.(
                                            "knowledge.prompt",
                                            value
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>

            <Card className="gap-0 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>其他配置</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection("other")}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                openSections.other ? "rotate-180" : ""
                            )}
                        />
                    </Button>
                </CardHeader>
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        openSections.other
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]"
                    )}
                >
                    <div className="overflow-hidden">
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="long_memory_prompt">
                                        长期记忆检索 Prompt
                                    </Label>
                                    <TemplateEditor
                                        id="long_memory_prompt"
                                        context="memory"
                                        minRows={5}
                                        ariaLabel="长期记忆检索 Prompt"
                                        value={preset.config?.longMemoryPrompt}
                                        onChange={(value) =>
                                            updatePreset?.(
                                                "config.longMemoryPrompt",
                                                value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="long_memory_new_question_prompt">
                                        长期记忆新问题 Prompt
                                    </Label>
                                    <TemplateEditor
                                        id="long_memory_new_question_prompt"
                                        context="memory"
                                        minRows={5}
                                        ariaLabel="长期记忆新问题 Prompt"
                                        value={
                                            preset.config
                                                ?.longMemoryNewQuestionPrompt
                                        }
                                        onChange={(value) =>
                                            updatePreset?.(
                                                "config.longMemoryNewQuestionPrompt",
                                                value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="long_term_memory_extraction_prompt">
                                        长期记忆提取 Prompt
                                    </Label>
                                    <TemplateEditor
                                        id="long_term_memory_extraction_prompt"
                                        context="memory"
                                        minRows={5}
                                        ariaLabel="长期记忆提取 Prompt"
                                        value={
                                            preset.config
                                                ?.longMemoryExtractPrompt
                                        }
                                        onChange={(value) =>
                                            updatePreset?.(
                                                "config.longMemoryExtractPrompt",
                                                value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lore_books_prompt">
                                    世界书检索 Prompt
                                </Label>
                                <TemplateEditor
                                    id="lore_books_prompt"
                                    placeholder="世界书检索 Prompt"
                                    context="memory"
                                    minRows={5}
                                    ariaLabel="世界书检索 Prompt"
                                    value={preset.config?.loreBooksPrompt}
                                    onChange={(value) =>
                                        updatePreset?.(
                                            "config.loreBooksPrompt",
                                            value
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>
        </div>
    );
}
