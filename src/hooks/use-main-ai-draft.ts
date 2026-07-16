"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHARACTER_AI_DRAFT_KEYS,
  createEmptyAIRoleDraft,
  type AIRoleDraftFields,
  type CharacterAIDraftKey,
} from "@/lib/ai/character-details";

const STORAGE_PREFIX = "chatluna_main_ai_draft:";

interface StoredMainAIDraft {
  draft: AIRoleDraftFields;
  generatedDraft: AIRoleDraftFields | null;
}

function normalizeDraft(value: unknown): AIRoleDraftFields {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return Object.fromEntries(
    CHARACTER_AI_DRAFT_KEYS.map((key) => [
      key,
      typeof source[key] === "string" ? source[key] : "",
    ]),
  ) as AIRoleDraftFields;
}

function readStoredDraft(presetId: string): StoredMainAIDraft {
  if (typeof window === "undefined") {
    return { draft: createEmptyAIRoleDraft(), generatedDraft: null };
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${presetId}`);
    if (!raw) return { draft: createEmptyAIRoleDraft(), generatedDraft: null };

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      draft: normalizeDraft(parsed.draft),
      generatedDraft: parsed.generatedDraft
        ? normalizeDraft(parsed.generatedDraft)
        : null,
    };
  } catch {
    return { draft: createEmptyAIRoleDraft(), generatedDraft: null };
  }
}

function draftsEqual(
  left: AIRoleDraftFields,
  right: AIRoleDraftFields,
) {
  return CHARACTER_AI_DRAFT_KEYS.every((key) => left[key] === right[key]);
}

function writeStoredDraft(presetId: string, value: StoredMainAIDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${presetId}`,
      JSON.stringify(value),
    );
  } catch {
    // Keep the in-memory draft when storage is unavailable or full.
  }
}

export function useMainAIDraft(presetId: string) {
  const [initial] = useState(() => readStoredDraft(presetId));
  const [draft, setDraft] = useState(initial.draft);
  const draftRef = useRef(draft);
  const generatedDraftRef = useRef(initial.generatedDraft);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStoreRef = useRef<StoredMainAIDraft | null>(null);
  const [isDirty, setIsDirty] = useState(() =>
    initial.generatedDraft
      ? !draftsEqual(initial.draft, initial.generatedDraft)
      : CHARACTER_AI_DRAFT_KEYS.some((key) => initial.draft[key].trim()),
  );

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      if (pendingStoreRef.current) {
        writeStoredDraft(presetId, pendingStoreRef.current);
      }
    };
  }, [presetId]);

  const schedulePersist = useCallback(
    (value: StoredMainAIDraft) => {
      pendingStoreRef.current = value;
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        persistTimerRef.current = null;
        const pending = pendingStoreRef.current;
        pendingStoreRef.current = null;
        if (pending) writeStoredDraft(presetId, pending);
      }, 400);
    },
    [presetId],
  );

  const setField = useCallback(
    (key: CharacterAIDraftKey, value: string) => {
      const next = { ...draftRef.current, [key]: value };
      draftRef.current = next;
      setDraft(next);
      setIsDirty(
        generatedDraftRef.current
          ? !draftsEqual(next, generatedDraftRef.current)
          : CHARACTER_AI_DRAFT_KEYS.some((draftKey) => next[draftKey].trim()),
      );
      schedulePersist({
        draft: next,
        generatedDraft: generatedDraftRef.current,
      });
    },
    [schedulePersist],
  );

  const markGenerated = useCallback(() => {
    generatedDraftRef.current = { ...draftRef.current };
    setIsDirty(false);
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = null;
    pendingStoreRef.current = null;
    writeStoredDraft(presetId, {
      draft: draftRef.current,
      generatedDraft: generatedDraftRef.current,
    });
  }, [presetId]);

  return { draft, isDirty, setField, markGenerated };
}
