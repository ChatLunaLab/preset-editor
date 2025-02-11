import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CharacterPresetTemplate } from "@/types/preset";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CharacterBasicFormProps {
    updatePreset?: <K extends NestedKeyOf<CharacterPresetTemplate>>(
        key: K,
        value: GetNestedType<CharacterPresetTemplate, K>
    ) => void;
    preset: CharacterPresetTemplate;
}

export function CharacterBasic({
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
                                        value={preset.name}
                                        placeholder="预设名称"
                                        onChange={(e) => {

                                            updatePreset?.(
                                                "name",
                                                e.target.value
                                            );
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">触发昵称，使用逗号分割</Label>
                                    <Input
                                        id="type"
                                        type="string"
                                        value={preset.nick_name.join(", ")}
                                        placeholder="触发的昵称"
                                        className="rounded-lg"
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "nick_name",
                                                e.target.value.split(",").map((s) => s.trim())
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mute">禁言词，使用逗号分割</Label>
                                    <Input
                                        id="mute"
                                        type="string"
                                        value={preset.mute_keyword?.join(", ") || []}
                                        placeholder="触发的昵称"
                                        className="rounded-lg"
                                        onChange={(e) =>
                                            updatePreset?.(
                                                "mute_keyword",
                                                e.target.value.split(",").map((s) => s.trim())
                                            )
                                        }
                                    />
                                </div>
                               
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    状态信息
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="人物的状态模版信息"
                                    className="min-h-[100px] rounded-lg"
                                    rows={20}
                                    value={preset.status}
                                    onChange={(e) =>
                                        updatePreset?.(
                                            "status",
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
