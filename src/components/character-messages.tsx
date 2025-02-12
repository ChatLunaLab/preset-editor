import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RawPreset } from "@/types/preset";

import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { ChevronDown, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";

interface CharacterMessagesFormProps {
    updatePreset?: <K extends NestedKeyOf<RawPreset>>(
        key: K,
        value: GetNestedType<RawPreset, K>
    ) => void;
    preset: RawPreset;
}

export function CharacterMessagesForm({
    updatePreset,
    preset,
}: CharacterMessagesFormProps) {
    const [openSections, setOpenSections] = useState({
        messages: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const isMobile = useMediaQuery("(max-width: 768px)");

    return (
        <div className="grid gap-6 sm:grid-cols-1">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-6">
                    <CardTitle>提示词列表</CardTitle>
                    <div className="space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                const prompts = preset.prompts;

                                const lastPrompt =
                                    prompts.length > 0
                                        ? prompts[prompts.length - 1]
                                        : null;

                                updatePreset?.("prompts", [
                                    ...prompts,
                                    {
                                        role:
                                            lastPrompt == null
                                                ? "system"
                                                : lastPrompt.role === "system"
                                                ? "assistant"
                                                : lastPrompt.role ===
                                                  "assistant"
                                                ? "user"
                                                : "assistant",
                                        content: "",
                                    },
                                ]);
                            }}
                        >
                            <Plus
                                className={cn(
                                    "h-4 w-4 transition-transform duration-200"
                                )}
                            />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSection("messages")}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 transition-transform duration-200",
                                    openSections.messages ? "rotate-180" : ""
                                )}
                            />
                        </Button>
                    </div>
                </CardHeader>
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        openSections.messages
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]"
                    )}
                >
                    <div className="overflow-hidden">
                        <CardContent className="space-y-4 p-6 pt-0">
                            {preset.prompts.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex gap-4 items-start w-full",
                                        isMobile ? "flex-col" : ""
                                    )}
                                >
                                    <div className={`space-y-2 ${isMobile ? 'w-full' : ''}`}>
                                        <Label>提示词类型</Label>
                                        <Select
                                            value={message.role}
                                            onValueChange={(value) => {
                                                updatePreset?.(
                                                    `prompts.${index}.role`,
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    value as any
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="w-[120px] mt-4">
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
                                    <div className="space-y-2 flex-grow w-full">
                                        <Label>提示词内容</Label>
                                        <Textarea
                                            className="mt-4 min-h-[60px]"
                                            rows={isMobile ? 30 : 5}
                                            value={message.content}
                                            onChange={(e) => {
                                                updatePreset?.(
                                                    `prompts.${index}.content`,
                                                    e.target.value
                                                );
                                             }}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                         className="size-10 p-0 h-8"
                                         onClick={() => {
                                             const prompts = [...preset.prompts];
                                             prompts.splice(index, 1);
                                             updatePreset?.("prompts", prompts);
                                         }}
                                     >
                                         <Trash className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </div >
                </div>
            </Card>
        </div>
    );
}
