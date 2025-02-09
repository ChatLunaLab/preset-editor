import { MainLayout } from "@/components/main-layout"
import { CharacterEditor } from "@/components/character-editor"

export default function CharacterEditPage({ params }: { params: { id: string } }) {
  return (
    <MainLayout>
      <CharacterEditor presetId={params.id} />
    </MainLayout>
  )
}

