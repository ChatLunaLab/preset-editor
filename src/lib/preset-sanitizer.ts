const SENSITIVE_KEYS = new Set([
  "api_url",
  "api_token",
  "api_key",
  "apiKey",
  "token",
  "model",
]);

export function isSensitivePresetKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

/**
 * Recursively clone a value while removing known credential / connection keys.
 * Preserves RegExp instances (not converted to plain objects). Does not mutate input.
 */
export function stripSensitivePresetKeys<T>(value: T): T {
  return stripSensitiveDeep(value) as T;
}

function stripSensitiveDeep(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof RegExp) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveDeep(item));
  }
  if (typeof value !== "object") {
    return value;
  }
  // Preserve other non-plain objects (Date, etc.) by identity when not plain data.
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }

  const source = value as Record<string, unknown>;
  const clone: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    if (isSensitivePresetKey(key)) {
      continue;
    }
    clone[key] = stripSensitiveDeep(child);
  }
  return clone;
}
