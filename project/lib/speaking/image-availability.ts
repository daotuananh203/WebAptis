/**
 * Speaking image availability policy.
 *
 * The standard speaking generator currently contains test_XX image paths that
 * are placeholders, not source-backed mappings. They must never be requested
 * by the browser or presented to the examiner as visual context.
 */

const STANDARD_PLACEHOLDER_IMAGE =
  /^\/images\/speaking\/test_\d{2}_part(?:2|3)(?:_[ab])?\.(?:jpg|jpeg|png|webp)$/i;

export type SpeakingImageAvailability = "available" | "unavailable";

export function isSpeakingImagePlaceholder(value: unknown): boolean {
  return typeof value === "string" && STANDARD_PLACEHOLDER_IMAGE.test(value);
}

/**
 * Return only a public, source-backed-looking application asset path.
 * Unresolved standard placeholders and external/temporary URLs return null.
 */
export function resolveSpeakingImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;

  const url = value.trim();
  if (isSpeakingImagePlaceholder(url)) return null;
  if (url.includes("?") || url.includes("#")) return null;
  if (!url.startsWith("/images/speaking/")) return null;

  return url;
}

export function speakingImageAvailability(value: unknown): SpeakingImageAvailability {
  return resolveSpeakingImageUrl(value) ? "available" : "unavailable";
}
