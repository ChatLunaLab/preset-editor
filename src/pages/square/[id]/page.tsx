import { MainLayout } from "@/components/main-layout"
import { PresetDetails } from "@/components/preset-details"
import { useSquarePreset } from "@/hooks/use-square-presets";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PresetViewPage() {
    const { id } = useParams();
    const [presetId, setPresetId] = useState<string>("");

    const preset = useSquarePreset(presetId)

    useEffect(() => {
        if (id) {
            setPresetId(id);
        }
    }, [id]);

    if (!presetId || typeof presetId !== "string" || !preset) {
        return <div>Preset not found</div>;
    }
    return (
        <MainLayout>
            <PresetDetails squarePreset={preset} />
        </MainLayout>
    )
}

