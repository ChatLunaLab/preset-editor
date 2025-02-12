"use client";

import { MainLayout } from "@/components/main-layout";
import { CharacterEditor } from "@/components/character-editor";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

export default function CharacterEditPage() {
    const { id } = useParams();
    const [presetId, setPresetId] = useState<string>("");

    useEffect(() => {
        if (id) {
            setPresetId(id);
        }
    }, [id]);

    if (!presetId || typeof presetId !== "string") {
        return <div>Preset not found</div>;
    }

    return (
        <MainLayout>
            <CharacterEditor presetId={presetId} />
        </MainLayout>
    );
}
