import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CharacterDescriptionForm() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>角色描述</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="background">背景故事</Label>
          <Textarea id="background" placeholder="请描述角色的背景故事..." className="min-h-[200px] rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="motivation">动机与目标</Label>
          <Textarea id="motivation" placeholder="请描述角色的动机与目标..." className="min-h-[200px] rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

