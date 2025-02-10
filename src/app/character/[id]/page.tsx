import { MainLayout } from "@/components/main-layout"
import { CharacterEditor } from "@/components/character-editor"
import { use } from "react"

export default async function CharacterEditPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <MainLayout>
      <CharacterEditor presetId={params.id} />
    </MainLayout>
  )
}

