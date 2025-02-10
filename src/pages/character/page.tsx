"use client";

import { MainLayout } from "@/components/main-layout";
import { CharacterEditor } from "@/components/character-editor";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function CharacterEditPage() {
    //  xx?id=xx
    // get url params
    const [presetId, setPresetId] = useState<string>("");
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const id = searchParams.get("id");
        setPresetId(id!);
    }, [location]);

    if (!presetId || typeof presetId !== "string") {
        console.log(presetId);
        return <div>Preset not found</div>;
    }

    return (
        <MainLayout>
            <CharacterEditor presetId={presetId} />
        </MainLayout>
    );
}
