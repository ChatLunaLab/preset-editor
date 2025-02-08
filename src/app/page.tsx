import { MainLayout } from "@/components/main-layout"
import { CharacterList } from "@/components/character-list"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"

const characters = [
  {
    id: "1",
    name: "朱诺",
    type: "主要角色",
    lastModified: "2024-02-09",
  },
  {
    id: "2",
    name: "露娜",
    type: "配角",
    lastModified: "2024-02-08",
  },
]

export default function Page() {
  return (
    <MainLayout>
      <div className="container py-6 px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="text-2xl md:text-3xl font-bold"></div>
          <div className="flex gap-2">
            <Button className="flex-1 md:flex-none">
              <Upload className="w-4 h-4 mr-2" />
              导入预设
            </Button>
            <Button variant="default" className="flex-1 md:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              新建角色
            </Button>
          </div>
        </div>
        <CharacterList characters={characters} />
      </div>
    </MainLayout>
  )
}

