import { MainLayout } from "@/components/main-layout"
import { CharacterEditor } from "@/components/character-editor"
import { use } from "react"

export default function CharacterEditPage({ params }: { params: { id: string } }) {
  return (
    <MainLayout>
      <CharacterEditor presetId={params.id} />
    </MainLayout>
  )
}

