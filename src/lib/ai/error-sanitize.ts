/**
 * Redact API keys and common credential patterns from AI / provider errors
 * before showing them in toast or generate logs.
 */
export function sanitizeAIErrorMessage(
  message: string,
  apiKey?: string,
): string {
  let text = message;
  if (apiKey && apiKey.trim().length > 0) {
    text = text.split(apiKey).join("[redacted]");
  }
  return text
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [redacted]")
    .replace(
      /api[_-]?key["']?\s*[:=]\s*["']?[^"'\s]+/gi,
      "api_key=[redacted]",
    );
}

export function isTimeoutOrAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    /timeout/i.test(error.message)
  );
}
