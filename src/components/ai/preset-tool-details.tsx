import { cn } from "@/lib/utils";
import {
  asRecord,
  getToolError,
  getToolOutput,
  type PresetToolPart,
  type PresetToolPresentation,
} from "./preset-tool-presentation";

function formatDetailValue(value: unknown): string | null {
  if (value === undefined) return null;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function DetailContent({ content }: { content: string }) {
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <pre className="overflow-x-auto px-3 py-2 font-mono leading-relaxed whitespace-pre">
        {content}
      </pre>
    </div>
  );
}

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
    outputRecord?.ok === false && outputRecord.error !== undefined
      ? formatDetailValue(outputRecord.error)
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
  const genericOutput = outputRecord
    ? Object.fromEntries(
        Object.entries(outputRecord).filter(
          ([key]) =>
            key !== "error" &&
            key !== "warnings" &&
            key !== "generateArtifact",
        ),
      )
    : output;
  const hasGenericOutput =
    genericOutput !== undefined &&
    (genericOutput === null ||
      typeof genericOutput !== "object" ||
      Object.keys(genericOutput as Record<string, unknown>).length > 0);
  const outputContent = hasGenericOutput
      ? formatDetailValue(genericOutput)
      : null;
  const hasDetails =
    statusMessage ||
    warnings.length > 0 ||
    outputContent !== null ||
    artifactContent;

  return (
    <div className="mt-1 w-full max-w-full overflow-hidden rounded-lg border border-border/60 bg-muted/15 text-xs">
      <div className="max-h-72 overflow-auto overscroll-contain">
        {statusMessage && (
          <div
            className={cn(
              "border-b border-border/50 px-3 py-2 break-words text-muted-foreground last:border-b-0",
              presentation.failed && "text-destructive",
            )}
          >
            {statusMessage}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-0.5 border-b border-border/50 px-3 py-2 text-amber-600 last:border-b-0 dark:text-amber-400">
            {warnings.map((warning) => (
              <div key={warning} className="break-words">
                <span aria-hidden="true">• </span>
                {warning}
              </div>
            ))}
          </div>
        )}

        {outputContent !== null && (
          <DetailContent content={outputContent} />
        )}

        {artifactContent && (
          <div className="max-w-full overflow-hidden bg-muted/35 text-[11px] text-foreground">
            {artifactFileName && (
              <div className="truncate border-b border-border/50 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                {artifactFileName}
              </div>
            )}
            <pre className="overflow-x-auto px-2.5 py-2 font-mono leading-relaxed whitespace-pre">
              {artifactContent}
            </pre>
          </div>
        )}

        {!hasDetails && (
          <div className="px-3 py-2 text-muted-foreground">暂无结果</div>
        )}
      </div>
    </div>
  );
}
