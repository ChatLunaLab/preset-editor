import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createCharacterPreset, createMainPreset } from "@/hooks/use-preset";

export function NewPresetDialog() {
    const [name, setName] = useState("");
    const [type, setType] = useState("main");
    const [error, setError] = useState("");

    const handleCreatePreset = async (e: React.MouseEvent) => {
        if (!name.trim()) {
            setError("请输入预设名称");
            e.preventDefault();
            return;
        }

        setError("");

        if (type === "main") {
            await createMainPreset(name);
        } else {
            await createCharacterPreset(name);
        }
    };
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default" className="flex-1 md:flex-none">
                    <Plus className="w-4 h-4 md:mr-0 md:w-auto md:h-auto" />

                    <span className="hidden md:inline">新建预设</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[90vw] md:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>新建预设</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="name" className="text-sm">
                            名称
                        </label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError("");
                            }}
                            className={error ? "border-red-500" : ""}
                        />
                        {error && <span className="text-sm text-red-500">{error}</span>}
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="type" className="text-sm">
                            类型
                        </label>
                        <Select
                            value={type}
                            defaultValue="character"
                            onValueChange={setType}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="选择预设类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="main">
                                    ChatLuna 预设
                                </SelectItem>
                                <SelectItem value="character">
                                    ChatLuna 伪装预设
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogClose asChild>
                    <Button onClick={handleCreatePreset}>创建</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
