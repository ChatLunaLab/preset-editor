"use client";

import { useCallback } from "react";
import { type PresetModel } from "@/lib/database";
import { mutatePreset } from "@/lib/preset-mutation-queue";
import { GetNestedType, NestedKeyOf } from "@/types/util";
import { updateNestedObject } from "@/lib/utils";

export type PresetFieldUpdater = <K extends NestedKeyOf<PresetModel["preset"]>>(
  key: K,
  value: GetNestedType<PresetModel["preset"], K>,
) => Promise<void>;

/**
 * Field updater sharing the same mutatePreset / Dexie transaction path as Agent tools.
 */
export function usePresetUpdater(presetId: string): PresetFieldUpdater {
  return useCallback(
    <K extends NestedKeyOf<PresetModel["preset"]>>(
      key: K,
      value: GetNestedType<PresetModel["preset"], K>,
    ) => {
      return mutatePreset(presetId, (latest) => {
        const nextPresetData = updateNestedObject(latest.preset, key, value);
        return {
          preset: nextPresetData as PresetModel["preset"],
          changedFields: [String(key)],
          message: `已更新字段：${String(key)}`,
        };
      }).then(() => undefined);
    },
    [presetId],
  );
}
