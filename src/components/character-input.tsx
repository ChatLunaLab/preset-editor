import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CharacterPresetTemplate } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { ChevronDown, Plus } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CharacterInputProps {
    updatePreset?: <K extends NestedKeyOf<CharacterPresetTemplate>>(
        key: K,
        value: GetNestedType<CharacterPresetTemplate, K>
    ) => void;
    preset: CharacterPresetTemplate;
}

export function CharacterInput({
    updatePreset,
    preset,
}: CharacterInputProps) {
    const [openSections, setOpenSections] = useState({
        basic: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const updateTextarea = useCallback((newValue: string) => {
        updatePreset?.("input", newValue);
    }, [updatePreset]);

    return (
        <div className="grid gap-6 sm:grid-cols-1">
            <Card className="rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between p-6">
                    <CardTitle>输入提示词</CardTitle>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSection("basic")}
                            className="h-8 w-8 p-0"
                        >
                            <Plus
                                className=
                                "h-4 w-4 transition-transform duration-200"
                            />
                        </Button>
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
                    </div>
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
                            <div className="space-y-2">
                                <Label htmlFor="description">格式化输入提示词内容</Label>
                                <Textarea
                                    id="description"
                                    placeholder="格式化输入提示词内容"
                                    className="min-h-[100px] rounded-lg"
                                   // minRows={10}
                                    value={preset.input}
                                    onChange={(e) =>
                                        updateTextarea(e.target.value)
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
