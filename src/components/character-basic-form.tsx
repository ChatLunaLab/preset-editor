import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function CharacterBasicForm() {
  return (
    <div className="grid gap-6">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input id="name" placeholder="角色名称" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">版本号（可选）</Label>
              <Input id="type" placeholder="角色类型" className="rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">用户格式化输入</Label>
            <Textarea id="description" placeholder="请输入角色简介..." className="min-h-[100px] rounded-lg" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>其他配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">长期记忆检索 Prompt</Label>
              <Input id="age" type="number" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">长期记忆新问题 Prompt</Label>
              <Input id="height" type="number" className="rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appearance">长期记忆提取 Prompt</Label>
            <Textarea id="appearance" placeholder="请描述角色的外貌特征..." className="min-h-[100px] rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

