import { randomBytes, createHash } from "node:crypto";

export function newId(): string {
  return randomBytes(12).toString("base64url");
}

/** Generates a high-entropy invite token (sent to the user, never stored). */
export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Only the hash of an invite token is persisted. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
