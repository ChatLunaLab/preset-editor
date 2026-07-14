import { dump } from "js-yaml";
import { stripSensitivePresetKeys } from "@/lib/preset-sanitizer";
import type { CharacterPresetTemplate, RawPreset } from "@/types/preset";

/**
 * Serialize preset data to YAML for export boundary only.
 * Throws a clear error when values cannot be dumped (e.g. RegExp in world lore).
 */
export function serializePresetData(
  presetData: RawPreset | CharacterPresetTemplate,
): string {
  try {
    return dump(stripSensitivePresetKeys(presetData), { lineWidth: -1 });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : String(error ?? "未知错误");
    throw new Error(
      `无法序列化为 YAML：${detail}。若世界书 keywords 含 RegExp，请先转为可导出的字符串后再生成。`,
      { cause: error },
    );
  }
}

export function buildPresetFileName(baseName: string): string {
  const safe = (baseName || "preset").replace(/[\\/:*?"<>|]/g, "_");
  return `${safe}.yml`;
}

export function downloadGeneratedYaml(content: string, fileName: string): void {
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/yaml;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
