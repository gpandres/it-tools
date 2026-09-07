import { EMPTY_PREFERENCES, parsePreferences, recordRecent, validToolIds, type ToolPreferences } from "./tool-preferences.ts";
import { getStorageConsent, hasStorageConsent, readLocalStorage, setStorageConsent, STORAGE_CHANGED, writeLocalStorage, type StorageConsent } from "./storage.ts";
const KEY = "it_tools_preferences";
const initialSnapshot = { ...EMPTY_PREFERENCES, loaded: false, consent: null as StorageConsent, storageError: false };
let snapshot = initialSnapshot;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
function readPreferences(): ToolPreferences {
  const raw = readLocalStorage(KEY);
  if (raw) return parsePreferences(raw) ?? EMPTY_PREFERENCES;
  try {
    const legacy = readLocalStorage("it_tools_favorites");
    return { ...EMPTY_PREFERENCES, favorites: legacy ? validToolIds(JSON.parse(legacy)) : [] };
  } catch { return EMPTY_PREFERENCES; }
}
function syncStorage(event?: Event) {
  if (event instanceof StorageEvent && event.key && ![KEY, "cookie_consent", "it_tools_favorites"].includes(event.key)) return;
  snapshot = { ...snapshot, ...readPreferences(), consent: getStorageConsent(), loaded: true };
  emit();
}
export function subscribePreferences(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", syncStorage);
    window.addEventListener(STORAGE_CHANGED, syncStorage);
    syncStorage();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener(STORAGE_CHANGED, syncStorage);
    }
  };
}
export const getPreferencesSnapshot = () => snapshot;
export const getServerPreferencesSnapshot = () => initialSnapshot;
function update(preferences: ToolPreferences) {
  const storageError = hasStorageConsent() && !writeLocalStorage(KEY, JSON.stringify(preferences));
  snapshot = { ...snapshot, ...preferences, storageError };
  emit();
}
export function addFavorite(id: string) { update({ version: 1, favorites: validToolIds([...snapshot.favorites, id]), recent: snapshot.recent }); }
export function removeFavorite(id: string) { update({ version: 1, favorites: snapshot.favorites.filter(item => item !== id), recent: snapshot.recent }); }
export function visitTool(id: string) {
  if (snapshot.recent[0] === id) return;
  update({ version: 1, favorites: snapshot.favorites, recent: recordRecent(snapshot.recent, id) });
}
export function clearRecent() { update({ version: 1, favorites: snapshot.favorites, recent: [] }); }
export function changeConsent(consent: "essential" | "none") {
  const pending = { version: 1 as const, favorites: snapshot.favorites, recent: snapshot.recent };
  const saved = setStorageConsent(consent);
  if (saved && consent === "essential") update(pending);
  snapshot = { ...snapshot, storageError: !saved || snapshot.storageError };
  emit();
}
