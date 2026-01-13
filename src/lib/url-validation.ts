/**
 * Validates that a URL uses a safe protocol (http: or https:)
 * Prevents XSS via javascript:, data:, vbscript: etc.
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
