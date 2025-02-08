import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Settings, Moon, Sun, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "@/components/ui/alert-dialog"
import React from "react"

export function SettingsDialog() {
  const { theme, setTheme } = useTheme()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleExportData = () => {
    const data = {
      // Add your data structure here
      characters: [],
      settings: {},
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "character-data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          // Handle the imported data here
          console.log("Imported data:", data)
        } catch (error) {
          console.error("Error parsing imported data:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 h-11 rounded-t-lg rounded-b-none border-t hover:bg-primary/5"
        >
          <Settings className="h-5 w-5" />
          <span>设置</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
                <SelectItem value="system">跟随系统</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">数据管理</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                导入数据
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                导出数据
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportData} />
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">危险操作</span>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  清除所有数据
                </Button>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认清除数据</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将清除所有角色和设置数据。此操作不可撤销，建议在清除前先导出备份。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">确认清除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}

