import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";

export type PresetToolPart = ToolUIPart | DynamicToolUIPart;

export type PresetToolKind =
  "inspect" | "update" | "validate" | "generate" | "search" | "generic";

export interface PresetToolPresentation {
  name: string;
  kind: PresetToolKind;
  label: string;
  activity: string;
  pending: boolean;
  failed: boolean;
  hasDetails: boolean;
}

const SECTION_ACTIVITY: Record<string, string> = {
  summary: "预设概览",
  core: "核心内容",
  advanced: "高级配置",
};

const TOOL_META: Record<
  string,
  {
    kind: PresetToolKind;
    label: string;
  }
> = {
  inspectPreset: {
    kind: "inspect",
    label: "读取当前预设",
  },
  updateMainPreset: {
    kind: "update",
    label: "更新主插件预设",
  },
  upsertMainPrompt: {
    kind: "update",
    label: "增改提示词",
  },
  upsertWorldLore: {
    kind: "update",
    label: "增改世界书",
  },
  updateCharacterPreset: {
    kind: "update",
    label: "更新伪装预设",
  },
  replaceGeneratedMainPreset: {
    kind: "generate",
    label: "生成主插件预设",
  },
  replaceGeneratedCharacterPreset: {
    kind: "generate",
    label: "生成伪装预设",
  },
  validatePreset: {
    kind: "validate",
    label: "校验当前预设",
  },
  web_search: {
    kind: "search",
    label: "Web Search",
  },
  google_search: {
    kind: "search",
    label: "Google Search",
  },
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function getToolOutput(part: PresetToolPart): unknown {
  return "output" in part ? part.output : undefined;
}

export function getToolError(part: PresetToolPart): string | undefined {
  return "errorText" in part && typeof part.errorText === "string"
    ? part.errorText
    : undefined;
}

export function isToolPending(part: PresetToolPart) {
  return (
    part.state !== "output-available" &&
    part.state !== "output-error" &&
    part.state !== "output-denied"
  );
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function formatChangedFields(fields: string[]): string | null {
  if (fields.length === 0) return null;
  if (fields.length <= 2) return fields.join("、");
  return `${fields.slice(0, 2).join("、")} 等 ${fields.length} 个字段`;
}

function buildActivityAndDetails(
  name: string,
  part: PresetToolPart,
  pending: boolean,
  failed: boolean,
): { activity: string; hasDetails: boolean } {
  const input = asRecord(part.input);
  const output = asRecord(getToolOutput(part));
  const warnings = stringArray(output?.warnings);
  const changedFields = stringArray(output?.changedFields);
  const generateArtifact = asRecord(output?.generateArtifact);
  const hasArtifactContent =
    typeof generateArtifact?.content === "string" &&
    generateArtifact.content.length > 0;
  if (name === "inspectPreset") {
    const section =
      typeof input?.section === "string" ? input.section : "summary";
    const sectionLabel = SECTION_ACTIVITY[section] ?? "预设";
    if (pending) {
      return { activity: `正在读取${sectionLabel}`, hasDetails: false };
    }
    if (failed) {
      return {
        activity: `读取${sectionLabel}失败`,
        hasDetails: true,
      };
    }
    return {
      activity: `读取了${sectionLabel}`,
      hasDetails: false,
    };
  }

  if (name === "updateMainPreset" || name === "updateCharacterPreset") {
    const target = name === "updateMainPreset" ? "主插件预设" : "伪装预设";
    if (pending) {
      return { activity: `正在更新${target}`, hasDetails: false };
    }
    if (failed) {
      return {
        activity: `更新${target}失败`,
        hasDetails: true,
      };
    }
    const changedSummary = formatChangedFields(changedFields);
    return {
      activity: changedSummary
        ? `更新了 ${changedSummary}`
        : `检查了${target} · 无字段变化`,
      hasDetails: false,
    };
  }

  if (name === "upsertMainPrompt") {
    const index = input?.index;
    if (pending) {
      return {
        activity:
          typeof index === "number"
            ? `正在更新 prompts[${index}]`
            : "正在追加提示词",
        hasDetails: false,
      };
    }
    if (failed) {
      return {
        activity:
          typeof index === "number"
            ? `更新 prompts[${index}] 失败`
            : "追加提示词失败",
        hasDetails: true,
      };
    }
    return {
      activity:
        typeof index === "number" ? `更新了 prompts[${index}]` : "追加了提示词",
      hasDetails: false,
    };
  }

  if (name === "upsertWorldLore") {
    const index = input?.index;
    if (pending) {
      return {
        activity:
          typeof index === "number"
            ? `正在更新 world_lores[${index}]`
            : "正在追加世界书",
        hasDetails: false,
      };
    }
    if (failed) {
      return {
        activity:
          typeof index === "number"
            ? `更新 world_lores[${index}] 失败`
            : "追加世界书失败",
        hasDetails: true,
      };
    }
    return {
      activity:
        typeof index === "number"
          ? `更新了 world_lores[${index}]`
          : "追加了世界书",
      hasDetails: false,
    };
  }

  if (name === "validatePreset") {
    if (pending) {
      return { activity: "正在校验预设结构", hasDetails: false };
    }
    if (failed || output?.ok === false) {
      return {
        activity: "预设结构未通过",
        hasDetails: true,
      };
    }
    if (warnings.length > 0) {
      return {
        activity: `预设结构有 ${warnings.length} 条警告`,
        hasDetails: true,
      };
    }
    return {
      activity: "预设结构正常",
      hasDetails: false,
    };
  }

  if (
    name === "replaceGeneratedMainPreset" ||
    name === "replaceGeneratedCharacterPreset"
  ) {
    const target =
      name === "replaceGeneratedMainPreset" ? "主插件预设" : "伪装预设";
    if (pending) {
      return { activity: `正在生成并应用${target}`, hasDetails: false };
    }
    if (failed) {
      return {
        activity: `生成${target}失败`,
        hasDetails: true,
      };
    }
    return {
      activity: `生成并应用了${target}`,
      hasDetails: hasArtifactContent || warnings.length > 0,
    };
  }

  if (name === "web_search" || name === "google_search") {
    const label = name === "google_search" ? "Google Search" : "Web Search";
    let query: string | undefined;
    if (typeof input?.query === "string") {
      query = input.query;
    } else {
      const actionQuery = asRecord(input?.action)?.query;
      if (typeof actionQuery === "string") {
        query = actionQuery;
      }
    }
    if (pending) {
      return {
        activity: query ? `正在搜索：${query}` : `正在使用 ${label}`,
        hasDetails: false,
      };
    }
    if (failed) {
      return {
        activity: `${label} 失败`,
        hasDetails: true,
      };
    }
    return {
      activity: query ? `搜索了：${query}` : `使用了 ${label}`,
      hasDetails: false,
    };
  }

  // generic fallback
  if (pending) {
    return { activity: `正在执行 ${name}`, hasDetails: false };
  }
  if (failed) {
    return {
      activity: `${name} 执行失败`,
      hasDetails: true,
    };
  }
  return {
    activity: `执行了 ${name}`,
    hasDetails: hasArtifactContent || warnings.length > 0,
  };
}

export function presentTool(part: PresetToolPart): PresetToolPresentation {
  const name = getToolName(part);
  const meta = TOOL_META[name] ?? {
    kind: "generic" as const,
    label: name,
  };
  const pending = isToolPending(part);
  const output = asRecord(getToolOutput(part));
  const failed =
    part.state === "output-error" ||
    part.state === "output-denied" ||
    output?.ok === false;

  const { activity, hasDetails } = buildActivityAndDetails(
    name,
    part,
    pending,
    failed,
  );

  return {
    name,
    kind: meta.kind,
    label: meta.label,
    activity,
    pending,
    failed,
    hasDetails,
  };
}

export function summarizeToolGroup(parts: PresetToolPart[]) {
  const presentations = parts.map(presentTool);
  const pending = presentations.filter((item) => item.pending).length;
  const failed = presentations.filter((item) => item.failed).length;

  if (pending > 0) {
    return `正在执行 ${parts.length} 个工具调用`;
  }
  if (failed > 0) {
    return `执行了 ${parts.length} 个工具调用，${failed} 个未完成`;
  }

  const counts = presentations.reduce(
    (result, item) => {
      result[item.kind] = (result[item.kind] ?? 0) + 1;
      return result;
    },
    {} as Partial<Record<PresetToolKind, number>>,
  );
  const actions: string[] = [];
  if (counts.inspect) {
    const inspectedSections = Array.from(
      new Set(
        presentations
          .filter((item) => item.kind === "inspect")
          .map((item) => item.activity.replace(/^读取了/, "")),
      ),
    );
    actions.push(`读取了${inspectedSections.join("、")}`);
  }
  if (counts.update)
    actions.push(
      counts.update > 1 ? `更新了 ${counts.update} 项内容` : "更新了预设",
    );
  if (counts.generate) actions.push("生成并应用了预设");
  if (counts.validate) actions.push("校验了预设");
  if (counts.search) {
    actions.push(
      counts.search > 1 ? `搜索了 ${counts.search} 次` : "使用了 Web Search",
    );
  }
  if (counts.generic) actions.push(`执行了 ${counts.generic} 个操作`);

  return actions.join("，");
}
