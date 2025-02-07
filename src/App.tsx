import PresetEditor from "./components/PresetEditor";
import AppBar from "./components/AppBar";
import { useState } from "react";
import { PresetTemplate } from "./types/preset";
import yaml from "js-yaml";

function App() {
    const [currentPreset, setCurrentPreset] = useState<PresetTemplate>();

    const handleLoadPreset = (text: string) => {
        try {
            const preset = yaml.load(text) as PresetTemplate;
            setCurrentPreset(preset);
        } catch (e) {
            console.error("Failed to parse preset:", e);
        }
    };

    const handleExportPreset = () => {
        if (!currentPreset) return;

        const yamlStr = yaml.dump(currentPreset);
        const blob = new Blob([yamlStr], { type: "text/yaml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentPreset.triggerKeyword[0] || "preset"}.yml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div />
            <AppBar
                loadPreset={handleLoadPreset}
                exportPreset={handleExportPreset}
            />
            <PresetEditor
                currentPreset={currentPreset}
                updatePreset={setCurrentPreset}
            />
            <div />
        </>
    );
}

export default App;
