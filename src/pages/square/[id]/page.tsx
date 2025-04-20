import { MainLayout } from "@/components/main-layout"
import { PresetDetails } from "@/components/preset-details"
import { incrementViews, useSquarePreset } from "@/hooks/use-square-presets";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

export default function PresetViewPage() {
    const { id } = useParams();
    const [presetId, setPresetId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const preset = useSquarePreset(presetId)

    useEffect(() => {
        if (id) {
            setPresetId(id);
        }
        setIsLoading(true);
    }, [id]);

    useEffect(() => {
        if (preset) {
            incrementViews(preset.rawPath);
            setIsLoading(false);
        } else if (presetId) {
            // 如果有 presetId 但没有找到 preset，说明加载完成但未找到
            setIsLoading(false);
        }
    }, [preset, presetId]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!presetId || typeof presetId !== "string" || !preset) {
        return <div>Preset not found</div>;
    }

    return (
        <MainLayout>
            <PresetDetails squarePreset={preset} />
        </MainLayout>
    )
}

