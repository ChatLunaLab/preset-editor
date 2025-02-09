"use client";

import {
    CharacterPresetTemplate,
    PresetTemplate,
    RawPreset,
} from "@/types/preset";
import { Dexie } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

const db = new Dexie("chatluna-preset") as Dexie & {
    presets: Dexie.Table<PresetModel, string>;
};

db.version(1).stores({
    presets: "++id, type, lastModified, preset",
});

export interface PresetModel<
    T extends "main" | "character" = "main" | "character"
> {
    id: string;
    name: string;
    type: T;
    lastModified: number;
    preset: T extends "main" ? RawPreset : CharacterPresetTemplate;
}

export function usePresets() {
    return useLiveQuery(() => db.presets.toArray(), [], [] as PresetModel[]);
}

export function useRecentPresets() {
    return useLiveQuery(
        () => db.presets.orderBy("lastModified").reverse().limit(6).toArray(),
        [],
        [] as PresetModel[]
    );
}

export async function createPreset<
    T extends "main" | "character" = "main" | "character"
>(model: Omit<PresetModel<T>, "lastModified" | "id">) {
    const id = crypto.randomUUID();
    return await db.presets.add({
        lastModified: Date.now(),
        ...model,
        id,
    });
}

export async function createMainPreset(name: string) {
    return createPreset({
        name,
        type: "main",
        preset: {
            keywords: [name],
            prompts: [
                {
                    role: "system",
                    content:
                        "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.",
                },
            ],
        },
    });
}

export async function updatePreset(id: string, preset: PresetModel["preset"]) {
    return await db.presets.update(id, {
        lastModified: Date.now(),
        preset,
    });
}

export async function deletePreset(id: string) {
    return await db.presets.delete(id);
}

export function getPreset(id: string) {
    return useLiveQuery(
        () => db.presets.get(id),
        [id],
        undefined as PresetModel | undefined
    );
}
