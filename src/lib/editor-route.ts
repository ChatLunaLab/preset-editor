import type { EditorMode } from "@/types/ai";

export type MainEditTab =
  | "basic"
  | "messages"
  | "world_books"
  | "author_note";

export type CharacterEditTab = "basic" | "system" | "input";

export type AIEditTab = "edit" | "agent" | "preview";

export type EditTab = MainEditTab | CharacterEditTab;
export type EditorTab = EditTab | AIEditTab;

export type PresetType = "main" | "character";

const MAIN_EDIT_TABS: readonly MainEditTab[] = [
  "basic",
  "messages",
  "world_books",
  "author_note",
];

const CHARACTER_EDIT_TABS: readonly CharacterEditTab[] = [
  "basic",
  "system",
  "input",
];

const AI_TABS: readonly AIEditTab[] = ["edit", "agent", "preview"];
const LAST_EDITOR_PATH_KEY_PREFIX = "preset-editor:last-path:";

function getLastEditorPathKey(presetId: string): string {
  return `${LAST_EDITOR_PATH_KEY_PREFIX}${presetId}`;
}

export function getEditTabs(presetType: PresetType): readonly EditTab[] {
  return presetType === "main" ? MAIN_EDIT_TABS : CHARACTER_EDIT_TABS;
}

export function getDefaultTab(
  mode: EditorMode,
  // Reserved for future mixed preset tab defaults.
  presetType?: PresetType,
): EditorTab {
  void presetType;
  if (mode === "ai") return "edit";
  return "basic";
}

export function isValidEditorMode(value: string | undefined): value is EditorMode {
  return value === "edit" || value === "ai";
}

export function isValidTab(
  mode: EditorMode,
  presetType: PresetType,
  tab: string | undefined,
): tab is EditorTab {
  if (!tab) return false;
  if (mode === "ai") {
    return (AI_TABS as readonly string[]).includes(tab);
  }
  return (getEditTabs(presetType) as readonly string[]).includes(tab);
}

export function buildCharacterPath(
  presetId: string,
  mode: EditorMode = "edit",
  tab?: EditorTab,
  presetType: PresetType = "main",
): string {
  const resolvedTab = tab ?? getDefaultTab(mode, presetType);
  return `/character/${presetId}/${mode}/${resolvedTab}`;
}

export function rememberCharacterPath(
  presetId: string,
  presetType: PresetType,
  mode: EditorMode,
  tab: EditorTab,
): void {
  if (typeof window === "undefined" || !isValidTab(mode, presetType, tab)) {
    return;
  }

  try {
    window.localStorage.setItem(
      getLastEditorPathKey(presetId),
      buildCharacterPath(presetId, mode, tab, presetType),
    );
  } catch {
    // Browsing contexts can disable localStorage; navigation should still work.
  }
}

export function getRememberedCharacterPath(
  presetId: string,
  presetType: PresetType,
): string {
  const fallbackPath = buildCharacterPath(
    presetId,
    "edit",
    "basic",
    presetType,
  );
  if (typeof window === "undefined") return fallbackPath;

  try {
    const storedPath = window.localStorage.getItem(
      getLastEditorPathKey(presetId),
    );
    if (!storedPath) return fallbackPath;

    const segments = storedPath.split("/").filter(Boolean);
    if (
      segments.length !== 4 ||
      segments[0] !== "character" ||
      segments[1] !== presetId
    ) {
      return fallbackPath;
    }

    const route = resolveEditorRoute(
      presetId,
      presetType,
      segments[2],
      segments[3],
    );
    return route.isCanonical ? route.canonicalPath : fallbackPath;
  } catch {
    return fallbackPath;
  }
}

export function forgetRememberedCharacterPath(presetId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getLastEditorPathKey(presetId));
  } catch {
    // Ignore unavailable storage during deletion.
  }
}

export interface ResolvedEditorRoute {
  mode: EditorMode;
  tab: EditorTab;
  isCanonical: boolean;
  canonicalPath: string;
}

/**
 * Resolve and normalize character editor route params.
 * Missing/invalid mode or tab fall back to defaults and mark non-canonical.
 */
export function resolveEditorRoute(
  presetId: string,
  presetType: PresetType,
  modeParam?: string,
  tabParam?: string,
): ResolvedEditorRoute {
  const mode: EditorMode = isValidEditorMode(modeParam) ? modeParam : "edit";
  const defaultTab = getDefaultTab(mode, presetType);
  const tab: EditorTab = isValidTab(mode, presetType, tabParam)
    ? tabParam
    : defaultTab;
  const isCanonical =
    isValidEditorMode(modeParam) && isValidTab(mode, presetType, tabParam);
  const canonicalPath = buildCharacterPath(presetId, mode, tab, presetType);

  return { mode, tab, isCanonical, canonicalPath };
}
