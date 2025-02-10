import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "./ui/switch";
import { RawPreset } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CharacterBasicFormProps {
    updatePreset?: <K extends NestedKeyOf<RawPreset>>(
        key: K,
        value: GetNestedType<RawPreset, K>
    ) => void;
    preset: RawPreset;
}

export function CharacterBasicForm({
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
            <Card className="rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between p-6">
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
                        <CardContent className="space-y-4 p-6 pt-0">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">预设名称</Label>
                                    <Input
                                        id="name"
                                        type="string"
                                        value={preset.keywords.join(",")}
                                        placeholder="预设名称"
                                        onChange={(e) => {
                                            const keywords =
                                                e.target.value.split(",");
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
                                <Label htmlFor="description">
                                    用户格式化输入
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="用户的格式化输入"
                                    className="min-h-[100px] rounded-lg"
                                    value={preset.format_user_prompt}
                                    onChange={(e) =>
                                        updatePreset?.(
                                            "format_user_prompt",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>

            <Card className="rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between p-6">
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
                        <CardContent className="space-y-4 p-6 pt-0">
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

            <Card className="rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between p-6">
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
                        <CardContent className="space-y-4 p-6 pt-0">
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
                                <Label htmlFor="description">
                                    知识库检索预设
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="知识库的预设"
                                    className="min-h-[100px] rounded-lg"
                                    value={preset.knowledge?.prompt}
                                    onChange={(e) =>
                                        updatePreset?.(
                                            "knowledge.prompt",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>

            <Card className="rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between p-6">
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
                        <CardContent className="space-y-4 p-6 pt-0">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="long_memory_prompt">
                                        长期记忆检索 Prompt
                                    </Label>
                                    <Input
                                        id="long_memory_prompt"
                                        type="string"
                                        className="rounded-lg"
                                        value={preset.config?.longMemoryPrompt}
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "config.longMemoryPrompt",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">
                                        长期记忆新问题 Prompt
                                    </Label>
                                    <Input
                                        id="height"
                                        type="string"
                                        className="rounded-lg"
                                        value={
                                            preset.config
                                                ?.longMemoryNewQuestionPrompt
                                        }
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "config.longMemoryNewQuestionPrompt",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="long_term_memory_extraction_prompt">
                                        长期记忆提取 Prompt
                                    </Label>
                                    <Input
                                        id="long_term_memory_extraction_prompt"
                                        type="string"
                                        value={
                                            preset.config
                                                ?.longMemoryExtractPrompt
                                        }
                                        className="rounded-lg"
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "config.longMemoryExtractPrompt",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="appearance">
                                    世界书检索 Prompt
                                </Label>
                                <Textarea
                                    id="appearance"
                                    placeholder="世界书检索 Prompt"
                                    value={preset.config?.loreBooksPrompt}
                                    className="min-h-[100px] rounded-lg"
                                    onChange={(e) =>
                                        updatePreset?.(
                                            "config.loreBooksPrompt",
                                            e.target.value
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
