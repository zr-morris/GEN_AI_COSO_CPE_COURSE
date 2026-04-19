// localStorage accessors for learner progress.
//
// Acts as an offline-friendly *cache* around the serialization shared with
// the server (see progressCodec.ts). The API is unchanged from Phase 2: the
// rest of the app calls `loadProgress` / `persistProgress` / `clearProgress`
// without caring where the bytes live.

import { decodeProgress, encodeProgress } from './progressCodec';
import type { CourseProgress } from './courseStore';

const STORAGE_KEY = 'coso-cpe-course:progress';

function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__ls_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function persistProgress(state: CourseProgress): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(encodeProgress(state)));
  } catch {
    // Quota exceeded or serialization error — fail silently;
    // progress will still work for the current session.
  }
}

export function loadProgress(): CourseProgress | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return decodeProgress(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPersistedProgress(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
