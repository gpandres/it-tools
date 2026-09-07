"use client";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toolsRegistry } from "@/lib/tools";
import { addFavorite, removeFavorite, visitTool, clearRecent, changeConsent, subscribePreferences, getPreferencesSnapshot, getServerPreferencesSnapshot } from "@/lib/preferences-store";
function usePreferencesStore() {
  const state = useSyncExternalStore(subscribePreferences, getPreferencesSnapshot, getServerPreferencesSnapshot);
  return { ...state, isLoaded: state.loaded, addFavorite, removeFavorite, clearRecent, changeConsent, isFavorite: (id: string) => state.favorites.includes(id) };
}
const FavoritesContext = createContext<ReturnType<typeof usePreferencesStore> | undefined>(undefined);
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const preferences = usePreferencesStore();
  const pathname = usePathname();
  useEffect(() => {
    const tool = toolsRegistry.find(item => item.path === pathname);
    if (preferences.isLoaded && tool) visitTool(tool.id);
  }, [pathname, preferences.isLoaded]);
  return <FavoritesContext.Provider value={preferences}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
}
