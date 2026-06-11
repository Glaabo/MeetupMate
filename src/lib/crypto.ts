"use client";

/**
 * End-to-end encryption for availability data (AES-256-GCM via WebCrypto).
 *
 * Group keys are generated in the browser, shared only through the #fragment
 * of invite links (never sent to the server), and stored in localStorage.
 * The server only ever stores base64(IV || ciphertext) blobs.
 */

export const KEY_VERIFIER_SENTINEL = "meetupmate-key-v1";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Generates a new group key, returned in URL-safe portable form. */
export async function generateGroupKey(): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const raw = await crypto.subtle.exportKey("raw", key);
  return toBase64Url(new Uint8Array(raw));
}

export function isValidKeyFormat(portableKey: string): boolean {
  try {
    return fromBase64Url(portableKey).length === 32;
  } catch {
    return false;
  }
}

async function importKey(portableKey: string): Promise<CryptoKey> {
  const raw = fromBase64Url(portableKey);
  if (raw.length !== 32) throw new Error("Invalid key");
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptJson(portableKey: string, value: unknown): Promise<string> {
  const key = await importKey(portableKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return toBase64Url(combined);
}

/** Returns null when the key doesn't match (GCM auth failure) or data is corrupt. */
export async function decryptJson<T>(portableKey: string, blob: string): Promise<T | null> {
  try {
    const key = await importKey(portableKey);
    const combined = fromBase64Url(blob);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}

/** Checks a candidate key against the group's encrypted sentinel. */
export async function verifyGroupKey(portableKey: string, keyVerifier: string): Promise<boolean> {
  const value = await decryptJson<string>(portableKey, keyVerifier);
  return value === KEY_VERIFIER_SENTINEL;
}
