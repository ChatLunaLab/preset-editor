import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CharacterWorldForm() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>世界观设定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="world">世界背景</Label>
          <Textarea id="world" placeholder="请描述角色所在的世界背景..." className="min-h-[200px] rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="relationships">人际关系</Label>
          <Textarea
            id="relationships"
            placeholder="请描述角色与其他角色的关系..."
            className="min-h-[200px] rounded-lg"
          />
        </div>
      </CardContent>
    </Card>
  )
}

