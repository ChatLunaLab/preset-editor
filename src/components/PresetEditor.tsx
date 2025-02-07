import { BaseMessage, PresetTemplate, AuthorsNote, KnowledgeConfig, RoleBook } from "@/types/preset";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "./ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trash2, ChevronDown } from "lucide-react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface PresetEditorProps {
    currentPreset?: PresetTemplate;
    updatePreset?: (preset: PresetTemplate) => void;
}

export default function PresetEditor({
    currentPreset,
    updatePreset,
}: PresetEditorProps) {
    const [copyOfCurrentPreset, setCopyOfCurrentPreset] =
        useState<PresetTemplate>(
            currentPreset || {
                triggerKeyword: [],
                rawText: "",
                messages: [],
                config: {
                    longMemoryPrompt: "",
                    loreBooksPrompt: "",
                    longMemoryExtractPrompt: "",
                    longMemoryNewQuestionPrompt: "",
                    postHandler: "",
                },
                loreBooks: {
                    items: [],
                },
                authorsNote: {
                    content: "",
                    position: "before_char_defs",
                },
                knowledge: {
                    content: "",
                    tokenLimit: 0,
                },
                version: "",
            }
        );

    const handleMessageChange = (
        index: number,
        field: keyof BaseMessage,
        value: string
    ) => {
        const newMessages = [...copyOfCurrentPreset.messages];
        newMessages[index] = { ...newMessages[index], [field]: value };
        setCopyOfCurrentPreset({
            ...copyOfCurrentPreset,
            messages: newMessages,
        });
    };

    const handleAddMessage = () => {
        setCopyOfCurrentPreset({
            ...copyOfCurrentPreset,
            messages: [
                ...copyOfCurrentPreset.messages,
                { role: "user", content: "" },
            ],
        });
    };

    const handleDeleteMessage = (index: number) => {
        const newMessages = copyOfCurrentPreset.messages.filter(
            (_, i) => i !== index
        );
        setCopyOfCurrentPreset({
            ...copyOfCurrentPreset,
            messages: newMessages,
        });
    };

    const handleSave = () => {
        if (updatePreset) {
            updatePreset(copyOfCurrentPreset);
        }
    };

    const formatUserPromptString = (input: string): string => {
        // 这里实现你的格式化逻辑
        return input.trim().replace(/\s+/g, " ");
    };

    return (
        <div className="min-h-screen flex flex-col p-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                    {/* 基本信息 */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>基本信息</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>预设名称</Label>
                                <Input
                                    placeholder="输入预设名称"
                                    value={copyOfCurrentPreset.triggerKeyword.join(
                                        ","
                                    )}
                                    onChange={(e) =>
                                        setCopyOfCurrentPreset({
                                            ...copyOfCurrentPreset,
                                            triggerKeyword:
                                                e.target.value.split(","),
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>版本</Label>
                                <Input
                                    placeholder="输入版本"
                                    value={copyOfCurrentPreset.version || ""}
                                    onChange={(e) =>
                                        setCopyOfCurrentPreset({
                                            ...copyOfCurrentPreset,
                                            version: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 消息列表 */}
                    <Card className="w-full">
                        <Collapsible className="w-full">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">
                                        消息列表
                                    </h3>
                                </div>
                                <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-6">
                                    {copyOfCurrentPreset.messages.map(
                                        (message, index) => (
                                            <div
                                                key={index}
                                                className="flex gap-4 items-start"
                                            >
                                                <div className="space-y-2">
                                                    <Label>角色</Label>
                                                    <Select
                                                        value={message.role}
                                                        onValueChange={(value) =>
                                                            handleMessageChange(
                                                                index,
                                                                "role",
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">
                                                                用户
                                                            </SelectItem>
                                                            <SelectItem value="assistant">
                                                                助手
                                                            </SelectItem>
                                                            <SelectItem value="system">
                                                                系统
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2 flex-grow">
                                                    <Label>内容</Label>
                                                    <Textarea
                                                        value={message.content}
                                                        onChange={(e) =>
                                                            handleMessageChange(
                                                                index,
                                                                "content",
                                                                e.target.value
                                                            )
                                                        }
                                                        rows={3}
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDeleteMessage(
                                                            index
                                                        )
                                                    }
                                                    className="mt-8"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )
                                    )}
                                    <div className="flex justify-end">
                                        <Button onClick={handleAddMessage}>
                                            添加消息
                                        </Button>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>

                    {/* 世界书 */}
                    <Card className="w-full">
                        <Collapsible className="w-full">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">
                                        世界书
                                    </h3>
                                </div>
                                <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-6">
                                    {(
                                        copyOfCurrentPreset.loreBooks?.items ||
                                        []
                                    ).map((lore, index) => (
                                        <div key={index} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>关键词</Label>
                                                <Input
                                                    placeholder="输入关键词"
                                                    value={
                                                        Array.isArray(lore.keywords)
                                                            ? lore.keywords.join(
                                                                  ","
                                                              )
                                                            : lore.keywords
                                                    }
                                                    onChange={(e) => {
                                                        const newLoreBooks = {
                                                            ...copyOfCurrentPreset.loreBooks,
                                                            items: [
                                                                ...(copyOfCurrentPreset
                                                                    .loreBooks
                                                                    ?.items ?? []),
                                                            ],
                                                        };
                                                        newLoreBooks.items[index] =
                                                            {
                                                                ...newLoreBooks
                                                                    .items[index],
                                                                keywords:
                                                                    e.target.value.split(
                                                                        ","
                                                                    ),
                                                            };
                                                        setCopyOfCurrentPreset({
                                                            ...copyOfCurrentPreset,
                                                            loreBooks: newLoreBooks,
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>内容</Label>
                                                <Textarea
                                                    placeholder="输入内容"
                                                    value={lore.content}
                                                    onChange={(e) => {
                                                        const newLoreBooks = {
                                                            ...copyOfCurrentPreset.loreBooks,
                                                            items: [
                                                                ...(copyOfCurrentPreset
                                                                    .loreBooks
                                                                    ?.items || []),
                                                            ],
                                                        };
                                                        newLoreBooks.items[index] =
                                                            {
                                                                ...newLoreBooks
                                                                    .items[index],
                                                                content:
                                                                    e.target.value,
                                                            };
                                                        setCopyOfCurrentPreset({
                                                            ...copyOfCurrentPreset,
                                                            loreBooks: newLoreBooks,
                                                        });
                                                    }}
                                                    rows={6}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>扫描深度</Label>
                                                <Input
                                                    type="number"
                                                    value={lore.scanDepth || 0}
                                                    onChange={(e) => {
                                                        const newLoreBooks = {
                                                            ...copyOfCurrentPreset.loreBooks,
                                                            items: [
                                                                ...(copyOfCurrentPreset
                                                                    .loreBooks
                                                                    ?.items || []),
                                                            ],
                                                        };
                                                        newLoreBooks.items[index] =
                                                            {
                                                                ...newLoreBooks
                                                                    .items[index],
                                                                scanDepth: parseInt(e.target.value),
                                                            };
                                                        setCopyOfCurrentPreset({
                                                            ...copyOfCurrentPreset,
                                                            loreBooks: newLoreBooks,
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Token 限制</Label>
                                                <Input
                                                    type="number"
                                                    value={lore.tokenLimit || 0}
                                                    onChange={(e) => {
                                                        const newLoreBooks = {
                                                            ...copyOfCurrentPreset.loreBooks,
                                                            items: [
                                                                ...(copyOfCurrentPreset
                                                                    .loreBooks
                                                                    ?.items || []),
                                                            ],
                                                        };
                                                        newLoreBooks.items[index] =
                                                            {
                                                                ...newLoreBooks
                                                                    .items[index],
                                                                tokenLimit: parseInt(e.target.value),
                                                            };
                                                        setCopyOfCurrentPreset({
                                                            ...copyOfCurrentPreset,
                                                            loreBooks: newLoreBooks,
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>递归扫描</Label>
                                                <Switch
                                                    checked={lore.recursiveScan || false}
                                                    onCheckedChange={(checked) => {
                                                        const newLoreBooks = {
                                                            ...copyOfCurrentPreset.loreBooks,
                                                            items: [
                                                                ...(copyOfCurrentPreset
                                                                    .loreBooks
                                                                    ?.items || []),
                                                            ],
                                                        };
                                                        newLoreBooks.items[index] =
                                                            {
                                                                ...newLoreBooks
                                                                    .items[index],
                                                                recursiveScan: checked,
                                                            };
                                                        setCopyOfCurrentPreset({
                                                            ...copyOfCurrentPreset,
                                                            loreBooks: newLoreBooks,
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>最大递归深度</Label>
                                                <Input
                                                    type="number"
                                                    value={lore.maxRecursionDepth || 0}
                                                    onChange={(e) => {
                                                        const newLoreBooks = {
                                                            ...copyOfCurrentPreset.loreBooks,
                                                            items: [
                                                                ...(copyOfCurrentPreset
                                                                    .loreBooks
                                                                    ?.items || []),
                                                            ],
                                                        };
                                                        newLoreBooks.items[index] =
                                                            {
                                                                ...newLoreBooks
                                                                    .items[index],
                                                                maxRecursionDepth: parseInt(e.target.value),
                                                            };
                                                        setCopyOfCurrentPreset({
                                                            ...copyOfCurrentPreset,
                                                            loreBooks: newLoreBooks,
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>插入位置</Label>
                                                <Select
                                                    value={lore.insertPosition || "before_char_defs"}
                                                    onValueChange={(value) => {
                                                        const newLoreBooks = {
                                                            ...copyOfCurrentPreset.loreBooks,
                                                            items: [
                                                                ...(copyOfCurrentPreset
                                                                    .loreBooks
                                                                    ?.items || []),
                                                            ],
                                                        };
                                                        newLoreBooks.items[index] =
                                                            {
                                                                ...newLoreBooks
                                                                    .items[index],
                                                                insertPosition: value as
                                                                    | "before_char_defs"
                                                                    | "after_char_defs"
                                                                    | "before_example_messages"
                                                                    | "after_example_messages",
                                                            };
                                                        setCopyOfCurrentPreset({
                                                            ...copyOfCurrentPreset,
                                                            loreBooks: newLoreBooks,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择插入位置" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="before_char_defs">
                                                            角色定义前
                                                        </SelectItem>
                                                        <SelectItem value="after_char_defs">
                                                            角色定义后
                                                        </SelectItem>
                                                        <SelectItem value="before_example_messages">
                                                            示例消息前
                                                        </SelectItem>
                                                        <SelectItem value="after_example_messages">
                                                            示例消息后
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => {
                                                const newLoreBooks = {
                                                    ...copyOfCurrentPreset.loreBooks,
                                                    items: [
                                                        ...(copyOfCurrentPreset
                                                            .loreBooks?.items ||
                                                            []),
                                                        {
                                                            keywords: [],
                                                            content: "",
                                                            scanDepth: 0,
                                                            tokenLimit: 0,
                                                            recursiveScan: false,
                                                            maxRecursionDepth: 0,
                                                            insertPosition: "before_char_defs",
                                                        },
                                                    ],
                                                };
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    loreBooks: newLoreBooks,
                                                });
                                            }}
                                        >
                                            添加世界书
                                        </Button>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>

                    {/* 作者备注 */}
                    <Card className="w-full">
                        <Collapsible className="w-full">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">
                                        作者备注
                                    </h3>
                                </div>
                                <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>作者备注内容</Label>
                                        <Textarea
                                            placeholder="输入作者备注内容"
                                            value={copyOfCurrentPreset.authorsNote?.content || ""}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    authorsNote: {
                                                        ...copyOfCurrentPreset.authorsNote,
                                                        content: e.target.value,
                                                    },
                                                })
                                            }
                                            rows={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>插入位置</Label>
                                        <Select
                                            value={copyOfCurrentPreset.authorsNote?.position || "before_char_defs"}
                                            onValueChange={(value) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    authorsNote: {
                                                        ...copyOfCurrentPreset.authorsNote,
                                                        position: value as
                                                            | "before_char_defs"
                                                            | "after_char_defs",
                                                    },
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择插入位置" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="before_char_defs">
                                                    角色定义前
                                                </SelectItem>
                                                <SelectItem value="after_char_defs">
                                                    角色定义后
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>

                    {/* 知识库 */}
                    <Card className="w-full">
                        <Collapsible className="w-full">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">
                                        知识库
                                    </h3>
                                </div>
                                <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>知识库内容</Label>
                                        <Textarea
                                            placeholder="输入知识库内容"
                                            value={copyOfCurrentPreset.knowledge?.content || ""}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    knowledge: {
                                                        ...copyOfCurrentPreset.knowledge,
                                                        content: e.target.value,
                                                    },
                                                })
                                            }
                                            rows={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Token 限制</Label>
                                        <Input
                                            type="number"
                                            value={copyOfCurrentPreset.knowledge?.tokenLimit || 0}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    knowledge: {
                                                        ...copyOfCurrentPreset.knowledge,
                                                        tokenLimit: parseInt(e.target.value),
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>

                    {/* 配置 */}
                    <Card className="w-full">
                        <Collapsible className="w-full">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">
                                        配置
                                    </h3>
                                </div>
                                <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>长期记忆提示</Label>
                                        <Textarea
                                            placeholder="输入长期记忆提示"
                                            value={copyOfCurrentPreset.config.longMemoryPrompt || ""}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    config: {
                                                        ...copyOfCurrentPreset.config,
                                                        longMemoryPrompt: e.target.value,
                                                    },
                                                })
                                            }
                                            rows={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>世界书提示</Label>
                                        <Textarea
                                            placeholder="输入世界书提示"
                                            value={copyOfCurrentPreset.config.loreBooksPrompt || ""}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    config: {
                                                        ...copyOfCurrentPreset.config,
                                                        loreBooksPrompt: e.target.value,
                                                    },
                                                })
                                            }
                                            rows={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>长期记忆提取提示</Label>
                                        <Textarea
                                            placeholder="输入长期记忆提取提示"
                                            value={copyOfCurrentPreset.config.longMemoryExtractPrompt || ""}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    config: {
                                                        ...copyOfCurrentPreset.config,
                                                        longMemoryExtractPrompt: e.target.value,
                                                    },
                                                })
                                            }
                                            rows={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>长期记忆新问题提示</Label>
                                        <Textarea
                                            placeholder="输入长期记忆新问题提示"
                                            value={copyOfCurrentPreset.config.longMemoryNewQuestionPrompt || ""}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    config: {
                                                        ...copyOfCurrentPreset.config,
                                                        longMemoryNewQuestionPrompt: e.target.value,
                                                    },
                                                })
                                            }
                                            rows={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>后处理器</Label>
                                        <Textarea
                                            placeholder="输入后处理器"
                                            value={copyOfCurrentPreset.config.postHandler || ""}
                                            onChange={(e) =>
                                                setCopyOfCurrentPreset({
                                                    ...copyOfCurrentPreset,
                                                    config: {
                                                        ...copyOfCurrentPreset.config,
                                                        postHandler: e.target.value,
                                                    },
                                                })
                                            }
                                            rows={4}
                                        />
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>

                    {/* 保存和取消按钮 */}
                    <div className="flex gap-4">
                        <Button onClick={handleSave}>保存</Button>
                        {currentPreset && (
                            <Button variant="outline" onClick={() => {}}>
                                取消
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}