"use client";

import { CharacterEditor } from "@/components/character-editor";
import { useParams } from "react-router";

export default function CharacterEditPage() {
    const { id } = useParams();
    const presetId = typeof id === "string" ? id : "";

    if (!presetId) {
        return <div>Preset not found</div>;
    }

    return <CharacterEditor presetId={presetId} />;
}
