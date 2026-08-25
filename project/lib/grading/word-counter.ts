/**
 * Deterministic Word Count Utility
 * Accurately counts words in candidate writing submissions.
 * Handles contractions (e.g. "don't"), hyphenated words (e.g. "well-known"),
 * and multiple whitespace/newline delimiters.
 */

export function countWords(text: unknown): number {
  if (typeof text !== "string") {
    return 0;
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }

  // Matches sequences of alphanumeric characters, including apostrophes and hyphens inside words
  const words = trimmed.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return words ? words.length : 0;
}
