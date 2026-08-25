/**
 * Normalization utilities for candidate submissions and answer keys.
 * Rules:
 * - Trims leading and trailing whitespace.
 * - Preserves strict item ordering for sentence reordering tasks.
 * - Safely canonicalizes string tokens.
 */

export function normalizeString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export function normalizeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim());
}

export function normalizeId(id: unknown): string {
  if (typeof id !== "string") {
    return "";
  }
  return id.trim();
}
