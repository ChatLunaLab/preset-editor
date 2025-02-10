import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "./ui/switch";
import {
    isWorldLoreConfig,
    RawPreset,
    RawWorldLore,
    WorldLoreConfig,
} from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { Plus, Trash2, Code } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { isWorldLore } from "../types/preset";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";

interface CharacterWorldLoreProps {
    updatePreset?: <K extends NestedKeyOf<RawPreset>>(
        key: K,
        value: GetNestedType<RawPreset, K>
    ) => void;
    preset: RawPreset;
}

export function CharacterWorldLore({
    updatePreset,
    preset,
}: CharacterWorldLoreProps) {
    const [isRegexMap, setIsRegexMap] = useState<Record<string, boolean>>({});

    const WorldLoresItem = (
        lore: RawWorldLore | WorldLoreConfig,
        index: number
    ) => {
        const handleKeywordDelete = (kidx: number) => {
            if (!isWorldLore(lore)) return;
            const currentKeywords = Array.from(lore.keywords || []);
            currentKeywords.splice(kidx, 1);
            updatePreset?.(`world_lores.${index}.keywords`, currentKeywords);
        };

        const handleDeleteLore = () => {
            const lores = [...(preset.world_lores || [])];
            lores.splice(index, 1);
            updatePreset?.("world_lores", lores);
        };

        const handleKeywordChange = (value: string, kidx: number) => {
            if (!isWorldLore(lore)) return;
            const currentKeywords = Array.from(lore.keywords || []);
            const key = `${index}-${kidx}`;
            currentKeywords[kidx] = isRegexMap[key] ? new RegExp(value) : value;
            updatePreset?.(`world_lores.${index}.keywords`, currentKeywords);
        };

        const toggleRegex = (kidx: number) => {
            const key = `${index}-${kidx}`;
            setIsRegexMap((prev) => ({
                ...prev,
                [key]: !prev[key],
            }));
        };

        if (!isWorldLore(lore)) return null;

        const firstKeyword = lore.keywords?.[0];
        const title =
            firstKeyword instanceof RegExp ? firstKeyword.source : firstKeyword;

        return (
            <Card key={index} className="mb-4 px-2 mx-4">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-lg">
                        {title || "未命名条目"}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 hover:bg-destructive/20"
                        onClick={handleDeleteLore}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>触发关键词</Label>
                        <div className="space-y-2 mt-4">
                            {Array.from(lore.keywords || []).map(
                                (keyword, kidx) => (
                                    <div
                                        key={kidx}
                                        className="flex gap-2 items-center"
                                    >
                                        <div className="relative flex-1 flex items-center">
                                            <Input
                                                value={
                                                    keyword instanceof RegExp
                                                        ? keyword.source
                                                        : keyword
                                                }
                                                onChange={(e) =>
                                                    handleKeywordChange(
                                                        e.target.value,
                                                        kidx
                                                    )
                                                }
                                                className="pr-10"
                                            />
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0",
                                                                isRegexMap[
                                                                    `${index}-${kidx}`
                                                                ] &&
                                                                    "bg-primary/20"
                                                            )}
                                                            onClick={() =>
                                                                toggleRegex(
                                                                    kidx
                                                                )
                                                            }
                                                        >
                                                            <Code className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>启用正则表达式</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Button
                                            aria-label="Delete keyword"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() =>
                                                handleKeywordDelete(kidx)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )
                            )}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    const currentKeywords = Array.from(
                                        lore.keywords || []
                                    );
                                    updatePreset?.(
                                        `world_lores.${index}.keywords`,
                                        [...currentKeywords, ""]
                                    );
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                添加关键词
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>条目内容</Label>
                        <Textarea
                            className="mt-4"
                            placeholder="输入内容"
                            value={lore.content}
                            onChange={(e) => {
                                updatePreset?.(
                                    `world_lores.${index}.content`,
                                    e.target.value.toString()
                                );
                            }}
                            rows={6}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {isWorldLoreConfig(lore) && (
                            <div className="space-y-2">
                                <Label>Token 限制</Label>
                                <Input
                                    type="number"
                                    className="mt-4"
                                    value={lore.tokenLimit || 0}
                                    onChange={(e) => {
                                        updatePreset?.(
                                            `world_lores.${index}.tokenLimit`,
                                            parseInt(e.target.value)
                                        );
                                    }}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>扫描深度</Label>
                            <Input
                                type="number"
                                className="mt-4"
                                value={lore.scanDepth || 0}
                                onChange={(e) => {
                                    updatePreset?.(
                                        `world_lores.${index}.scanDepth`,
                                        parseInt(e.target.value)
                                    );
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>最大递归深度</Label>
                            <Input
                                type="number"
                                className="mt-4"
                                value={lore.maxRecursionDepth || 0}
                                onChange={(e) => {
                                    updatePreset?.(
                                        `world_lores.${index}.maxRecursionDepth`,
                                        parseInt(e.target.value)
                                    );
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>插入位置</Label>
                            <Select
                                value={
                                    lore.insertPosition || "before_char_defs"
                                }
                                onValueChange={(value) => {
                                    updatePreset?.(
                                        `world_lores.${index}.insertPosition`,
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        value as any
                                    );
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        className="mt-4"
                                        placeholder="选择插入位置"
                                    />
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

                        <div className="flex justify-between  items-baseline mt-3">
                            <Label>是否递归扫描</Label>
                            <Switch
                                className="mt-4"
                                checked={lore.recursiveScan || false}
                                onCheckedChange={(checked) => {
                                    updatePreset?.(
                                        `world_lores.${index}.recursiveScan`,
                                        checked
                                    );
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="grid gap-6">
            <div>
                <div className="flex flex-row items-center justify-between p-6">
                    <CardTitle>世界书列表</CardTitle>
                    <Button
                        className="size-8"
                        variant="ghost"
                        onClick={() => {
                            const lores = preset.world_lores || [];
                            updatePreset?.("world_lores", [
                                ...lores,
                                {
                                    keywords: [""],
                                    content: "",
                                },
                            ]);
                        }}
                    >
                        <Plus />
                    </Button>
                </div>
                <div>
                    {(preset.world_lores || [])
                        .sort((a, b) => {
                            if (isWorldLoreConfig(a) && isWorldLoreConfig(b)) {
                                return (
                                    (b as WorldLoreConfig).tokenLimit! -
                                    (a as WorldLoreConfig).tokenLimit!
                                );
                            } else if (isWorldLoreConfig(a) && isWorldLore(b)) {
                                return -1;
                            }
                            return a.content > b.content ? 1 : -1;
                        })
                        .map((lore, index) => WorldLoresItem(lore, index))}
                </div>
            </div>
        </div>
    );
}
