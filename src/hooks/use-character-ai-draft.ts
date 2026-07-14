"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHARACTER_AI_DRAFT_KEYS,
  type AIRoleDraftFields,
  type CharacterAIDraftKey,
} from "@/lib/ai/character-details";
import type { CharacterPresetTemplate } from "@/types/preset";
import type { PresetFieldUpdater } from "@/hooks/use-preset-updater";

const EMPTY_DRAFT: AIRoleDraftFields = {
  bot_id: "",
  owner_id: "",
  description: "",
  personality: "",
  hobbies: "",
  dialogue_examples: "",
  chat_style: "",
  chat_behavior: "",
  relationship: "",
  stickers: "",
};

function readDraft(
  preset: CharacterPresetTemplate | null | undefined,
): AIRoleDraftFields {
  if (!preset) {
    return { ...EMPTY_DRAFT };
  }

  return {
    bot_id: preset.bot_id || "",
    owner_id: preset.owner_id || "",
    description: preset.description || "",
    personality: preset.personality || "",
    hobbies: preset.hobbies || "",
    dialogue_examples: preset.dialogue_examples || "",
    chat_style: preset.chat_style || "",
    chat_behavior: preset.chat_behavior || "",
    relationship: preset.relationship || "",
    stickers: preset.stickers || "",
  };
}

function persistField(
  updater: PresetFieldUpdater | undefined,
  key: CharacterAIDraftKey,
  value: string,
) {
  if (!updater) {
    return;
  }
  // Draft keys are top-level string fields on CharacterPresetTemplate.
  void updater(key, value as never);
}

/**
 * Debounced draft for character AI detail fields.
 * Accepts nullable / non-character presets so the hook can be called unconditionally.
 * Remount with key={presetId} when switching presets.
 * Flushes pending field writes on unmount instead of discarding them.
 */
export function useCharacterAIDraft(
  preset: CharacterPresetTemplate | null | undefined,
  updatePreset?: PresetFieldUpdater,
  debounceMs = 400,
) {
  const [draft, setDraft] = useState<AIRoleDraftFields>(() =>
    readDraft(preset),
  );
  const [isDirty, setIsDirty] = useState(false);

  const draftRef = useRef(draft);
  const generatedDraftRef = useRef(draft);
  const initializedRef = useRef(Boolean(preset));
  const updatePresetRef = useRef(updatePreset);
  const pendingRef = useRef<Partial<Record<CharacterAIDraftKey, string>>>({});
  const timersRef = useRef<
    Partial<Record<CharacterAIDraftKey, ReturnType<typeof setTimeout>>>
  >({});

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    updatePresetRef.current = updatePreset;
  }, [updatePreset]);

  useEffect(() => {
    if (!preset || initializedRef.current) {
      return;
    }

    const nextDraft = readDraft(preset);
    initializedRef.current = true;
    draftRef.current = nextDraft;
    generatedDraftRef.current = nextDraft;
    setDraft(nextDraft);
    setIsDirty(false);
  }, [preset]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
      timersRef.current = {};

      const pending = pendingRef.current;
      const updater = updatePresetRef.current;
      pendingRef.current = {};

      for (const key of CHARACTER_AI_DRAFT_KEYS) {
        const value = pending[key];
        if (value === undefined) {
          continue;
        }
        persistField(updater, key, value);
      }
    };
  }, []);

  const setField = useCallback(
    (key: CharacterAIDraftKey, value: string) => {
      const next = { ...draftRef.current, [key]: value };
      draftRef.current = next;
      setDraft(next);
      setIsDirty(
        CHARACTER_AI_DRAFT_KEYS.some(
          (draftKey) => next[draftKey] !== generatedDraftRef.current[draftKey],
        ),
      );
      pendingRef.current[key] = value;

      const existing = timersRef.current[key];
      if (existing) {
        clearTimeout(existing);
      }

      timersRef.current[key] = setTimeout(() => {
        delete timersRef.current[key];
        delete pendingRef.current[key];
        persistField(updatePresetRef.current, key, value);
      }, debounceMs);
    },
    [debounceMs],
  );

  const getMergedCharacterPreset = useCallback(
    (
      base: CharacterPresetTemplate | null | undefined,
    ): CharacterPresetTemplate | null => {
      if (!base) {
        return null;
      }
      return {
        ...base,
        ...draftRef.current,
      };
    },
    [],
  );

  const markGenerated = useCallback(() => {
    generatedDraftRef.current = { ...draftRef.current };
    setIsDirty(false);
  }, []);

  return {
    draft,
    isDirty,
    setField,
    keys: CHARACTER_AI_DRAFT_KEYS,
    getMergedCharacterPreset,
    markGenerated,
  };
}
