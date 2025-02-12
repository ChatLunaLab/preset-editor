import { sha1 } from "@/lib/utils";
import { CharacterPresetTemplate, RawPreset } from "@/types/preset";
import { SquarePresetData } from "@/types/square";
import { load } from "js-yaml";
import { useState, useEffect } from "react";

//https://gcore.jsdelivr.net/gh/chatlunalab/awesome-chatluna-presets@preset/presets.json

async function fetchPresets() {
    try {
        if (globalThis.cachePresets) {
            return globalThis.cachePresets as SquarePresetData[];
        }
        const response = await fetch(
            "https://cdn.jsdelivr.net/gh/chatlunalab/awesome-chatluna-presets@preset/presets.json"
        );
        if (!response.ok) {
            throw new Error("Failed to fetch presets");
        }
        const loadedPreset = (await response.json()) as SquarePresetData[];
        for (const preset of loadedPreset) {
            preset.sha1 = await sha1(preset.rawPath);
        }
        globalThis.cachePresets = loadedPreset;
        return loadedPreset;
    } catch (error) {
        console.error("Error fetching presets:", error);
    }
}

export function useSquarePresets(sortOption: string, keywords: string[]) {
    const [presets, setPresets] = useState<SquarePresetData[]>([]);
    const [sortedPresets, setSortedPresets] = useState<SquarePresetData[]>([]);

    // fetch presets from url
    useEffect(() => {
        fetchPresets().then((presets) => {
            setPresets(presets);
        });
    }, []);

    useEffect(() => {
        let sorted = [...presets]; // Create a copy to avoid mutating the original array

        switch (sortOption) {
            /*   case "downloads":
                sorted.sort((a, b) => b.downloads - a.downloads);
                break;
            case "views":
                sorted.sort((a, b) => b.views - a.views);
                break; */
            case "rating":
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case "newest":
                // Assuming 'id' represents the creation order, sort by id in descending order
                sorted.sort((a, b) => b.modified - a.modified);
                break;
            default:
                // No sorting
                break;
        }

        if (keywords.length > 0) {
            sorted = sorted.filter((preset) => {
                for (const keyword of keywords) {
                    const keywordLower = keyword.toLowerCase();
                    const presetType =
                        preset.type === "main" ? "主插件" : "伪装";
                    if (
                        preset.name.toLowerCase().includes(keywordLower) ||
                        preset.description
                            .toLowerCase()
                            .includes(keywordLower) ||
                        presetType.includes(keywordLower) ||
                        preset.tags.some((tag) =>
                            tag.toLowerCase().includes(keywordLower)
                        )
                    ) {
                        return true;
                    }
                }
                return false;
            });
        }

        setSortedPresets((prev) => {
            // 浅比较或内容比较，避免相同结果时更新
            if (JSON.stringify(prev) === JSON.stringify(sorted)) return prev;
            return sorted;
        });
    }, [sortOption, presets, keywords]);

    return sortedPresets;
}

export function useSquarePreset(id: string) {
    const [preset, setPreset] = useState<SquarePresetData>();

    useEffect(() => {
        const cachePresets = globalThis.cachePresets as
            | SquarePresetData[]
            | undefined;

        if (cachePresets) {
            const preset = cachePresets.find((preset) => preset.sha1 === id);

            setPreset(preset);

            return;
        }
        fetchPresets().then((presets) => {
            const preset = presets.find((preset) => preset.sha1 === id);

            setPreset(preset);
        });
    }, [id]);

    return preset;
}

export function useSquarePresetForNetwork(squarePreset: SquarePresetData) {
    const [preset, setPreset] = useState<
        RawPreset | CharacterPresetTemplate | undefined
    >();

    useEffect(() => {
        loadPresetForNetwork(
            squarePreset.rawPath.replace(
                "https://raw.githubusercontent.com/ChatLunaLab/awesome-chatluna-presets/main/presets",
                "https://gcore.jsdelivr.net/gh/chatlunalab/awesome-chatluna-presets@main/presets"
            )
        ).then((preset) => {
            setPreset(preset);
        });
    }, [squarePreset.rawPath]);

    return preset;
}

export async function loadPresetContent(url: string) {
    const cache_preset = globalThis.cache_preset as {
        [key: string]: string;
    };

    if (cache_preset?.[url]) {
        return cache_preset[url];
    }

    return fetch(url)
        .then((response) => response.text())
        .then((content) => {
            globalThis.cache_preset = globalThis.cache_preset || {};

            globalThis.cache_preset[url] = content;

            return content;
        });
}

export async function loadPresetForNetwork(url: string) {
    const cache_preset = globalThis.cache_preset as {
        [key: string]: string;
    };

    if (cache_preset?.[url]) {
        return load(cache_preset[url]) as RawPreset | CharacterPresetTemplate;
    }

    return loadPresetContent(url).then((content) => {
        const preset = load(content) as RawPreset | CharacterPresetTemplate;

        return preset as RawPreset | CharacterPresetTemplate;
    });
}

export async function downloadPreset(preset: SquarePresetData) {
    const response = await fetch(
        preset.rawPath.replace(
            "https://raw.githubusercontent.com/ChatLunaLab/awesome-chatluna-presets/main/presets",
            "https://gcore.jsdelivr.net/gh/chatlunalab/awesome-chatluna-presets@main/presets"
        )
    );
    const blob = await response.blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = preset.name + ".yml";
    a.click();

    document.body.removeChild(a);
}
