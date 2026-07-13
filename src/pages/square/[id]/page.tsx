import { PresetDetails } from "@/components/preset-details"
import { incrementViews, useSquarePreset } from "@/hooks/use-square-presets";
import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import NotFoundPage from "@/pages/not-found";

export default function PresetViewPage() {
    const { id } = useParams();
    const presetId = typeof id === "string" ? id : "";
    const { preset, isLoading } = useSquarePreset(presetId);
    const viewedPathRef = useRef<string | null>(null);

    useEffect(() => {
        if (preset && viewedPathRef.current !== preset.rawPath) {
            viewedPathRef.current = preset.rawPath;
            void incrementViews(preset.rawPath);
        }
    }, [preset]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!presetId || !preset) {
        return <NotFoundPage />;
    }

    return <PresetDetails squarePreset={preset} />
}
