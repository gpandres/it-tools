export const STORAGE_CHANGED = "it-tools-storage-changed";
export type StorageConsent = "all" | "essential" | "none" | null;
export function getStorageConsent(): StorageConsent {
  try {
    const consent = window.localStorage.getItem("cookie_consent");
    return consent === "all" || consent === "essential" || consent === "none" ? consent : null;
  } catch { return null; }
}
export function hasStorageConsent(): boolean {
  const consent = getStorageConsent();
  return consent === "all" || consent === "essential";
}
export function setStorageConsent(consent: Exclude<StorageConsent, null>): boolean {
  try {
    window.localStorage.setItem("cookie_consent", consent);
    if (consent === "none") {
      // Clear only application-owned keys, never the whole origin.
      const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
        .filter((key): key is string => key !== null && (key.startsWith("it_tools_") || ["playbook_draft", "runbook_draft", "network_diagram", "network_diagram_library"].includes(key)));
      keys.forEach(key => window.localStorage.removeItem(key));
      window.indexedDB?.deleteDatabase("InvestigationWorkspaceDB");
    }
    window.dispatchEvent(new Event(STORAGE_CHANGED));
    return true;
  } catch {
    window.dispatchEvent(new Event(STORAGE_CHANGED));
    return false;
  }
}
export function readLocalStorage(key: string): string | null {
  if (!hasStorageConsent()) return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}
export function writeLocalStorage(key: string, value: string): boolean {
  if (!hasStorageConsent()) return false;
  try { window.localStorage.setItem(key, value); return true; } catch { return false; }
}
