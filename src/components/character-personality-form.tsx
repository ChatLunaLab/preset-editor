import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CharacterPersonalityForm() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>性格特征</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="personality">性格描述</Label>
          <Textarea id="personality" placeholder="请描述角色的性格特征..." className="min-h-[200px] rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="habits">习惯与癖好</Label>
          <Textarea id="habits" placeholder="请描述角色的习惯与癖好..." className="min-h-[200px] rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

