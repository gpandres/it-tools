import test from "node:test";
import assert from "node:assert/strict";
import { subscribePreferences, getPreferencesSnapshot, addFavorite, visitTool, changeConsent, clearRecent } from "../src/lib/preferences-store.ts";
import { STORAGE_CHANGED, readLocalStorage, writeLocalStorage } from "../src/lib/storage.ts";

class MemoryStorage {
  values = new Map<string, string>();
  failWrites = false;
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error("Quota exceeded");
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
}
class TestStorageEvent extends Event {
  key: string | null = null;
  constructor() { super("storage"); }
}
test("preferences consent, migration, revocation, cross-tab updates and quota failures", () => {
  const storage = new MemoryStorage();
  const fakeWindow = Object.assign(new EventTarget(), { localStorage: storage });
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldEvent = Object.getOwnPropertyDescriptor(globalThis, "StorageEvent");
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, "StorageEvent", { configurable: true, value: TestStorageEvent });
  const unsubscribe = subscribePreferences(() => {});
  try {
    addFavorite("acl-builder");
    visitTool("log-parser");
    assert.equal(storage.getItem("it_tools_preferences"), null, "session-only choices must not persist");
    assert.equal(writeLocalStorage("runbook_draft", "secret"), false);
    changeConsent("essential");
    assert.deepEqual(JSON.parse(storage.getItem("it_tools_preferences")!).favorites, ["acl-builder"]);
    assert.equal(writeLocalStorage("runbook_draft", "draft"), true);
    storage.setItem("unrelated-app", "keep");
    changeConsent("none");
    assert.equal(storage.getItem("cookie_consent"), "none", "remember rejection");
    assert.equal(storage.getItem("runbook_draft"), null);
    assert.equal(storage.getItem("it_tools_preferences"), null);
    assert.equal(storage.getItem("unrelated-app"), "keep");
    assert.deepEqual(getPreferencesSnapshot().favorites, []);
    assert.equal(readLocalStorage("runbook_draft"), null);

    storage.setItem("cookie_consent", "essential");
    storage.setItem("it_tools_favorites", JSON.stringify(["log-parser", "unknown"]));
    fakeWindow.dispatchEvent(new TestStorageEvent());
    assert.deepEqual(getPreferencesSnapshot().favorites, ["log-parser"], "legacy favorites migrate");
    storage.setItem("it_tools_preferences", JSON.stringify({version:1,favorites:["acl-builder"],recent:["log-parser"]}));
    fakeWindow.dispatchEvent(new TestStorageEvent());
    assert.deepEqual(getPreferencesSnapshot().favorites, ["acl-builder"]);
    clearRecent();
    assert.deepEqual(getPreferencesSnapshot().recent, []);
    storage.failWrites = true;
    addFavorite("log-parser");
    assert.equal(getPreferencesSnapshot().storageError, true);
    assert.ok(getPreferencesSnapshot().favorites.includes("log-parser"), "quota failures preserve session state");
    storage.failWrites = false;
    storage.setItem("it_tools_preferences", "{bad");
    fakeWindow.dispatchEvent(new Event(STORAGE_CHANGED));
    assert.deepEqual(getPreferencesSnapshot().favorites, []);
  } finally {
    unsubscribe();
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else Reflect.deleteProperty(globalThis, "window");
    if (oldEvent) Object.defineProperty(globalThis, "StorageEvent", oldEvent); else Reflect.deleteProperty(globalThis, "StorageEvent");
  }
});
