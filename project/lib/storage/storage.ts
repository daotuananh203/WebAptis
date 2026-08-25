/**
 * Client Storage Layer
 * Robust Web Storage API implementation with in-memory fallback, corruption recovery, and SSR safety.
 * Supports complete data isolation per user account and backwards compatibility with test adapters.
 */

import { ProgressAttemptRecord } from "../progress/types";
import {
  DEFAULT_USER_PREFERENCES,
  IStorageAdapter,
  STORAGE_KEYS,
  UserPreferences,
} from "./types";

const MAX_HISTORY_RECORDS = 500;

/**
 * In-memory fallback storage adapter for SSR, Node.js, and private browsing.
 */
export class MemoryStorageAdapter implements IStorageAdapter {
  public memoryMap = new Map<string, string>();

  getItem<T>(key: string, defaultValue: T): T {
    const raw = this.memoryMap.get(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    try {
      this.memoryMap.set(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  removeItem(key: string): boolean {
    return this.memoryMap.delete(key);
  }

  clear(): boolean {
    this.memoryMap.clear();
    return true;
  }

  isAvailable(): boolean {
    return true;
  }
}

/**
 * Standard Web Storage API (localStorage) adapter with full exception handling.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private fallbackMemory = new MemoryStorageAdapter();

  isAvailable(): boolean {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    try {
      const testKey = "__aptis_storage_probe__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) {
      return this.fallbackMemory.getItem(key, defaultValue);
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[Storage Warning] Corrupted data for key "${key}", falling back to default.`, err);
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      return this.fallbackMemory.setItem(key, value);
    }
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (err) {
      console.warn(`[Storage Error] Failed to set item "${key}" in localStorage.`, err);
      return false;
    }
  }

  removeItem(key: string): boolean {
    if (!this.isAvailable()) {
      return this.fallbackMemory.removeItem(key);
    }
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) {
      return this.fallbackMemory.clear();
    }
    try {
      window.localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton storage instance
let globalStorageAdapter: IStorageAdapter | null = null;

export function getStorageAdapter(): IStorageAdapter {
  if (!globalStorageAdapter) {
    if (typeof window !== "undefined" && window.localStorage) {
      globalStorageAdapter = new LocalStorageAdapter();
    } else {
      globalStorageAdapter = new MemoryStorageAdapter();
    }
  }
  return globalStorageAdapter;
}

function resolveUserAndAdapter(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): { userId?: string; adapter: IStorageAdapter } {
  if (typeof userIdOrAdapter === "string") {
    return { userId: userIdOrAdapter, adapter: adapterParam ?? getStorageAdapter() };
  }
  if (userIdOrAdapter && typeof userIdOrAdapter === "object" && "getItem" in userIdOrAdapter) {
    return { userId: undefined, adapter: userIdOrAdapter };
  }
  return { userId: undefined, adapter: adapterParam ?? getStorageAdapter() };
}

/**
 * Load candidate progress history array from storage for a specific user or anonymous session.
 */
export function loadProgressHistory(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): ProgressAttemptRecord[] {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  try {
    const key = userId ? STORAGE_KEYS.userHistory(userId) : STORAGE_KEYS.HISTORY;
    const history = adapter.getItem<ProgressAttemptRecord[]>(key, []);
    if (!Array.isArray(history)) {
      return [];
    }
    return history;
  } catch (err) {
    console.warn("[Storage Error] Exception during loadProgressHistory, returning empty array.", err);
    return [];
  }
}

/**
 * Save a new progress attempt into storage with deduplication, user-scoped key, and capacity limit.
 */
export function saveProgressAttempt(
  record: ProgressAttemptRecord,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): boolean {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  try {
    const key = userId ? STORAGE_KEYS.userHistory(userId) : STORAGE_KEYS.HISTORY;
    const currentHistory = loadProgressHistory(userId, adapter);

    // Prevent duplicates by ID
    const filtered = currentHistory.filter((item) => item.id !== record.id);
    filtered.push(record);

    // Cap history to latest MAX_HISTORY_RECORDS
    const trimmed = filtered.slice(-MAX_HISTORY_RECORDS);

    return adapter.setItem(key, trimmed);
  } catch (err) {
    console.warn("[Storage Error] Exception during saveProgressAttempt.", err);
    return false;
  }
}

/**
 * Clear all progress history from storage for a user or anonymous session.
 */
export function clearProgressHistory(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): boolean {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  try {
    const key = userId ? STORAGE_KEYS.userHistory(userId) : STORAGE_KEYS.HISTORY;
    return adapter.removeItem(key);
  } catch {
    return false;
  }
}

/**
 * Load user UI/session preferences.
 */
export function loadUserPreferences(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): UserPreferences {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  try {
    const key = userId ? STORAGE_KEYS.userPreferences(userId) : STORAGE_KEYS.PREFERENCES;
    const stored = adapter.getItem<Partial<UserPreferences>>(
      key,
      DEFAULT_USER_PREFERENCES
    );
    return { ...DEFAULT_USER_PREFERENCES, ...stored };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

/**
 * Update user preferences in storage.
 */
export function saveUserPreferences(
  prefs: Partial<UserPreferences>,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): boolean {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  try {
    const key = userId ? STORAGE_KEYS.userPreferences(userId) : STORAGE_KEYS.PREFERENCES;
    const current = loadUserPreferences(userId, adapter);
    const updated: UserPreferences = { ...current, ...prefs };
    return adapter.setItem(key, updated);
  } catch {
    return false;
  }
}
