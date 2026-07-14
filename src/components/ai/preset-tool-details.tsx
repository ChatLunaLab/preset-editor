import { cn } from "@/lib/utils";
import {
  asRecord,
  getToolError,
  getToolOutput,
  type PresetToolPart,
  type PresetToolPresentation,
} from "./preset-tool-presentation";

export function PresetToolDetails({
  part,
  presentation,
}: {
  part: PresetToolPart;
  presentation: PresetToolPresentation;
}) {
  const output = getToolOutput(part);
  const outputRecord = asRecord(output);
  const error = getToolError(part);
  const warnings = Array.isArray(outputRecord?.warnings)
    ? outputRecord.warnings.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const validationError =
    outputRecord?.ok === false && typeof outputRecord.error === "string"
      ? outputRecord.error
      : undefined;
  const denialMessage =
    part.state === "output-denied" ? "操作未获准执行" : undefined;
  const statusMessage = error ?? validationError ?? denialMessage;
  const generateArtifact = asRecord(outputRecord?.generateArtifact);
  const artifactContent =
    typeof generateArtifact?.content === "string"
      ? generateArtifact.content
      : undefined;
  const artifactFileName =
    typeof generateArtifact?.fileName === "string"
      ? generateArtifact.fileName
      : undefined;

  if (!statusMessage && warnings.length === 0 && !artifactContent) {
    return null;
  }

  return (
    <div className="mt-1 max-w-full space-y-1.5 text-xs">
      {statusMessage && (
        <div
          className={cn(
            "break-words text-muted-foreground",
            presentation.failed && "text-destructive",
          )}
        >
          {statusMessage}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-0.5 text-amber-600 dark:text-amber-400">
          {warnings.map((warning) => (
            <div key={warning} className="break-words">
              <span aria-hidden="true">• </span>
              {warning}
            </div>
          ))}
        </div>
      )}

      {artifactContent && (
        <div className="max-w-full overflow-hidden rounded-md border border-border/50 bg-zinc-950/90 text-[11px] text-zinc-300 dark:bg-zinc-950">
          {artifactFileName && (
            <div className="truncate border-b border-white/5 px-2.5 py-1.5 text-[10px] text-zinc-500">
              {artifactFileName}
            </div>
          )}
          <pre className="max-h-48 overflow-auto px-2.5 py-2 font-mono leading-relaxed whitespace-pre">
            {artifactContent}
          </pre>
        </div>
      )}
    </div>
  );
}
