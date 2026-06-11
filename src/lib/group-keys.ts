"use client";

/** localStorage-backed storage for group keys. Keys never leave the device. */

const PREFIX = "mm.groupKey.";

export function getGroupKey(groupId: string): string | null {
  try {
    return localStorage.getItem(PREFIX + groupId);
  } catch {
    return null;
  }
}

export function storeGroupKey(groupId: string, portableKey: string): void {
  try {
    localStorage.setItem(PREFIX + groupId, portableKey);
  } catch {
    // Storage unavailable (private mode quota etc.) — the unlock UI will ask again.
  }
}

export function removeGroupKey(groupId: string): void {
  try {
    localStorage.removeItem(PREFIX + groupId);
  } catch {
    // ignore
  }
}
