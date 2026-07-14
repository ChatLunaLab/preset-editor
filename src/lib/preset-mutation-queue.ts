import {
  getPreset,
  withPresetTransaction,
  type PresetModel,
} from "@/hooks/use-preset";

const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(presetId: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(presetId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  queues.set(
    presetId,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

export interface PresetGenerateArtifact {
  content: string;
  fileName: string;
}

export interface PresetMutationResult {
  ok: true;
  changedFields: string[];
  presetType: PresetModel["type"];
  lastModified: number;
  message: string;
  warnings?: string[];
  generateArtifact?: PresetGenerateArtifact;
}

export interface PresetMutatorOutput {
  preset: PresetModel["preset"];
  changedFields: string[];
  message?: string;
  warnings?: string[];
  generateArtifact?: PresetGenerateArtifact;
}

/**
 * Serialize all Dexie writes for a presetId via a shared queue + RW transaction.
 * Mutator must be synchronous (no network). Throw before returning to abort write.
 * lastModified comes from the actual stored model.
 */
export async function mutatePreset(
  presetId: string,
  mutator: (latest: PresetModel) => PresetMutatorOutput,
): Promise<PresetMutationResult> {
  return enqueue(presetId, async () => {
    let meta: Omit<
      PresetMutatorOutput,
      "preset"
    > | null = null;

    const stored = await withPresetTransaction(presetId, (latest) => {
      const output = mutator(latest);
      meta = {
        changedFields: output.changedFields,
        message: output.message,
        warnings: output.warnings,
        generateArtifact: output.generateArtifact,
      };
      return output.preset;
    });

    if (!meta) {
      throw new Error("内部错误：mutation 未产生结果");
    }

    return {
      ok: true as const,
      changedFields: meta.changedFields,
      presetType: stored.type,
      lastModified: stored.lastModified,
      message:
        meta.message ??
        `已更新：${meta.changedFields.join(", ") || "无字段变化"}`,
      ...(meta.warnings && meta.warnings.length > 0
        ? { warnings: meta.warnings }
        : {}),
      ...(meta.generateArtifact
        ? { generateArtifact: meta.generateArtifact }
        : {}),
    };
  });
}

export async function readPresetOrThrow(presetId: string): Promise<PresetModel> {
  const latest = await getPreset(presetId);
  if (!latest) {
    throw new Error(`预设不存在：${presetId}`);
  }
  return latest;
}
