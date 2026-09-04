import { randomUUID } from "node:crypto";

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

/** Keep caller supplied correlation IDs safe for response headers and logs. */
export function getRequestId(incomingRequestId?: string | null): string {
  const candidate = incomingRequestId?.trim();
  return candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID();
}
