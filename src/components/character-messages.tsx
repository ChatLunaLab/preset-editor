import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "./ui/switch";
import { RawPreset } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

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

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-6">
                    <CardTitle>消息列表</CardTitle>
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

                                        console.log(lastPrompt)
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
                                    className="flex gap-4 items-start"
                                >
                                    <div className="space-y-2">
                                        <Label>角色</Label>
                                        <Select value={message.role}>
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
                                    <div className="space-y-2 flex-grow">
                                        <Label>内容</Label>
                                        <Textarea
                                            className="mt-4"
                                            value={message.content}
                                            rows={3}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mt-10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </div>
                </div>
            </Card>
        </div>
    );
}
