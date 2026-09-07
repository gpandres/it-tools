import { toolsRegistry } from "./tools.ts";
export type ToolPreferences = { version: 1; favorites: string[]; recent: string[] };
export const EMPTY_PREFERENCES: ToolPreferences = { version: 1, favorites: [], recent: [] };
const knownIds = new Set(toolsRegistry.map(tool => tool.id));
export function validToolIds(value: unknown, limit = toolsRegistry.length): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && knownIds.has(id)))].slice(0, limit);
}
export function parsePreferences(raw: string): ToolPreferences | null {
  if (raw.length > 64_000) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.favorites) || !Array.isArray(data.recent)) return null;
    return { version: 1, favorites: validToolIds(data.favorites), recent: validToolIds(data.recent, 12) };
  } catch { return null; }
}
export function recordRecent(recent: string[], id: string): string[] {
  return validToolIds([id, ...recent], 12);
}
