/**
 * Client-Server Progress Synchronization Helper
 * Bi-directionally syncs PostgreSQL database records (source of truth) with LocalStorage cache.
 */

import { ProgressAttemptRecord } from "../progress/types";
import { loadProgressHistory, saveProgressAttempt } from "./storage";

export async function syncUserProgressWithServer(
  userId: string
): Promise<ProgressAttemptRecord[]> {
  if (!userId || typeof window === "undefined") {
    return [];
  }

  try {
    // 1. Fetch persistent records from PostgreSQL API
    const res = await fetch("/api/user/progress");
    if (!res.ok) {
      return loadProgressHistory(userId);
    }

    const json = await res.json();
    const serverAttempts: ProgressAttemptRecord[] = json.success && Array.isArray(json.data) ? json.data : [];
    const localAttempts = loadProgressHistory(userId);

    const mergedMap = new Map<string, ProgressAttemptRecord>();
    const missingOnServer: ProgressAttemptRecord[] = [];

    // Add server attempts first (source of truth)
    for (const item of serverAttempts) {
      mergedMap.set(item.id, item);
    }

    // Check local attempts
    for (const item of localAttempts) {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
        missingOnServer.push(item);
      }
    }

    // Update local cache with full merged history
    const mergedList = Array.from(mergedMap.values());
    for (const rec of mergedList) {
      saveProgressAttempt(rec, userId);
    }

    // Push local unsynced records to PostgreSQL server
    if (missingOnServer.length > 0) {
      fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(missingOnServer),
      }).catch((err) => {
        console.warn("[Sync Warning] Could not push offline attempts to server:", err);
      });
    }

    return mergedList;
  } catch (err) {
    console.warn("[Sync Error] Failed to sync progress with server:", err);
    return loadProgressHistory(userId);
  }
}
