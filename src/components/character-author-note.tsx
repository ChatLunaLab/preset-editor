import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RawPreset } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { TemplateEditor } from "./template-editor";

interface CharacterAuthorNoteProps {
    updatePreset?: <K extends NestedKeyOf<RawPreset>>(
        key: K,
        value: GetNestedType<RawPreset, K>
    ) => void;
    preset: RawPreset;
}

export function CharacterAuthorNote({
    updatePreset,
    preset,
}: CharacterAuthorNoteProps) {
    const [openSections, setOpenSections] = useState({
        basic: true,
        other: false,
        postHandler: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="grid gap-6 sm:grid-cols-1">
            <Card className="gap-0 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>作者注释</CardTitle>
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
                            <div className="space-y-2">
                                <Label htmlFor="authors-note-content">注释内容</Label>
                                <TemplateEditor
                                    id="authors-note-content"
                                    placeholder="注释的内容"
                                    context="author-note"
                                    minRows={5}
                                    ariaLabel="作者注释内容"
                                    value={preset.authors_note?.content || ""}
                                    onChange={(value) =>
                                        updatePreset?.(
                                            "authors_note.content",
                                            value
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">插入频率</Label>
                                    <Input
                                        id="name"
                                        type="number"
                                        value={
                                            preset.authors_note
                                                ?.insertFrequency || 1
                                        }
                                        placeholder="插入频率"
                                        onChange={(e) => {
                                            updatePreset?.(
                                                "authors_note.insertFrequency",
                                                parseInt(e.target.value)
                                            );
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">插入深度</Label>
                                    <Input
                                        id="type"
                                        type="number"
                                        value={
                                            preset.authors_note?.insertDepth ||
                                            1
                                        }
                                        placeholder="插入深度"
                                        className="rounded-lg"
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "authors_note.insertDepth",
                                                parseInt(e.target.value)
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>插入位置</Label>
                                    <Select
                                        onValueChange={(value) => {
                                            updatePreset?.(
                                                "authors_note.insertPosition",
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
                                            <SelectItem value="after_char_defs">
                                                角色定义后
                                            </SelectItem>
                                            <SelectItem value="in_chat">
                                                聊天末尾
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>
        </div>
    );
}
