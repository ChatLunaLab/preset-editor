import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface Character {
  id: string
  name: string
  type: string
  description?: string
  personality?: string
}

interface CharacterPanelProps {
  character: Character
  onClose: () => void
}

export function CharacterPanel({ character, onClose }: CharacterPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">角色详情</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <Input id="name" defaultValue={character.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">类型</Label>
            <Input id="type" defaultValue={character.type} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea id="description" defaultValue={character.description} rows={4} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality">性格</Label>
            <Textarea id="personality" defaultValue={character.personality} rows={4} />
          </div>
        </div>
      </div>
    </div>
  )
}

