import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Bot,
    Computer,
    Database,
    Moon,
    Settings,
    Sun,
    Trash2,
    Download,
    Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useRef } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "./ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AIModelSettings } from "@/components/ai/ai-model-settings";

interface SettingsCategoryProps {
    title: string;
    icon: React.ReactNode;
    value: string;
}

const settingsCategories: SettingsCategoryProps[] = [
    { title: "通用", icon: <Settings className="h-4 w-4" />, value: "general" },
    { title: "AI 模型", icon: <Bot className="h-4 w-4" />, value: "ai-model" },
    { title: "数据管理", icon: <Database className="h-4 w-4" />, value: "data" },
];

export function SettingsDialog({ compact = false }: { compact?: boolean }) {
    const { theme, setTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCategory, setSelectedCategory] = useState(settingsCategories[0].value);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleExportData = () => {
        const data = {
            characters: [],
            settings: {},
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "character-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    // Handle the imported data here
                    console.log("Imported data:", data);
                } catch (error) {
                    console.error("Error parsing imported data:", error);
                }
            };
            reader.readAsText(file);
        }
    };

    let categoryContent;

    switch (selectedCategory) {
        case "general":
            categoryContent = (
                <div className="grid gap-4 ml-3">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm">主题模式</span>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue>
                                    {theme === "light" && "浅色"}
                                    {theme === "dark" && "深色"}
                                    {theme === "system" && "跟随系统"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">
                                    <div className="flex items-center gap-2">
                                        <Sun className="h-4 w-4" />
                                        <span>浅色</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="dark">
                                    <div className="flex items-center gap-2">
                                        <Moon className="h-4 w-4" />
                                        <span>深色</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="system">
                                    <div className="flex items-center gap-2">
                                        <Computer className="size-4" /> 跟随系统
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                </div>
            );
            break;
        case "ai-model":
            categoryContent = (
                <div className="ml-1 h-full min-h-0">
                    <AIModelSettings />
                </div>
            );
            break;
        case "data":
            categoryContent = (
                <div className="grid gap-4 ml-3">
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-sm">导入数据</span>
                        <Button
                           variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImportData}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4 ">
                        <span className="text-sm">导出数据</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExportData}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                    <Separator />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm">清除所有数据</span>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                    
                                </Button>
                            </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    确认清除数据
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    此操作将清除所有角色和设置数据。此操作不可撤销，建议在清除前先导出备份。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                                    确认清除
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            );
            break;
        default:
            categoryContent = null;
    }


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    aria-label={compact ? "设置" : undefined}
                    title={compact ? "设置" : undefined}
                    className={cn(
                        "w-full justify-start gap-3 px-4 h-11 rounded-t-lg rounded-b-none border-t hover:bg-primary/5",
                        compact && "justify-center gap-0 px-0"
                    )}
                >
                    <Settings className="size-5 shrink-0" />
                    <span className={cn(compact && "sr-only")}>设置</span>
                </Button>
            </DialogTrigger>
            <DialogContent className={cn(
                "w-[calc(100%-2rem)] max-w-none rounded-2xl sm:max-w-[800px]",
                isMobile
                    ? "max-h-[calc(100vh-2rem)] overflow-y-auto"
                    : "max-h-[calc(100vh-2rem)] overflow-hidden"
            )}>
                <DialogHeader>
                    <DialogTitle>设置</DialogTitle>
                </DialogHeader>
                {isMobile ? (
                    <div className="flex flex-col">
                        <div className="flex flex-row overflow-x-auto pb-4">
                            {settingsCategories.map((category) => (
                                <Button
                                    key={category.value}
                                     variant="ghost"
                                     className={cn(
                                         "flex-shrink-0 w-[120px] justify-start gap-3 px-2 mt-0 h-10 rounded-lg m-1",
                                         selectedCategory === category.value && "bg-primary/10 text-primary hover:bg-primary/20"
                                     )}
                                     onClick={() => setSelectedCategory(category.value)}
                                >
                                    {category.icon}
                                    <span>{category.title}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4">
                            {categoryContent}
                        </div>
                    </div>
                ) : (
                    <div className="flex h-[min(60vh,32rem)] min-h-0">
                        <div className="w-[200px] border-r flex flex-col pr-6">
                            {settingsCategories.map((category) => (
                                <Button
                                    key={category.value}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-3 px-2 mt-0 h-10 rounded-lg",
                                        selectedCategory === category.value && "bg-primary/10 text-primary hover:bg-primary/20"
                                    )}
                                    onClick={() => setSelectedCategory(category.value)}
                                >
                                    {category.icon}
                                    <span>{category.title}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4">
                            {categoryContent}
                        </div>
                    </div>
                )}
                <div className="border-t pt-4 mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        ChatLuna 预设站 v0.1.0 by dingyi
                        <br />
                        <a className='text-primary' target="_blank" rel="noreferrer" href='https://github.com/ChatLunaLab/preset-editor'>Open Source Address</a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
