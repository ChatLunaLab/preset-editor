import { useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Upload, Download, Info } from "lucide-react";

interface AppBarProps {
    loadPreset?: (text: string) => void;
    exportPreset?: () => void;
}

export default function AppBar({ loadPreset, exportPreset }: AppBarProps) {
    const importInputRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="h-14 border-b flex items-center px-4 justify-between sticky top-0">
            <h1 className="text-lg font-semibold">ChatLuna 预设编辑器</h1>

            <div className="flex items-center gap-2">
                <input
                    type="file"
                    id="import-input"
                    hidden
                    accept=".yml"
                    className="hidden"
                    ref={importInputRef}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                if (loadPreset && e.target?.result) {
                                    loadPreset(e.target.result as string);
                                }
                            };
                            reader.readAsText(file);
                        }
                    }}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => importInputRef.current?.click()}
                >
                    <Upload className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" onClick={exportPreset}>
                    <Download className="h-5 w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDialogOpen(true)}
                >
                    <Info className="h-5 w-5" />
                </Button>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>关于</DialogTitle>
                            <DialogDescription>
                                <p>ChatLuna 预设编辑器</p>
                                <p>版本: 1.0.0</p>
                                <p>作者: dingyi</p>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
