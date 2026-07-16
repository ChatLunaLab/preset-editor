"use client";

import { db, type PresetModel } from "@/lib/database";
import { useLiveQuery } from "dexie-react-hooks";

export function usePresets() {
  return useLiveQuery(() => db.presets.toArray(), [], [] as PresetModel[]);
}

export function useRecentPresets() {
  return useLiveQuery(
    () => db.presets.orderBy("lastModified").reverse().limit(6).toArray(),
    [],
    [] as PresetModel[],
  );
}

export function usePreset(id: string) {
  return useLiveQuery(
    () => db.presets.get(id),
    [id],
    null as PresetModel | null | undefined,
  );
}
