"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type FavoritesContextType = {
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  isLoaded: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (consent === "all" || consent === "essential") {
        const stored = localStorage.getItem("it_tools_favorites");
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } else {
        // Clear if no consent
        localStorage.removeItem("it_tools_favorites");
      }
    } catch (e) {
      // Ignore local storage access issues
    }
    setIsLoaded(true);
  }, []);

  const saveFavorites = (newFavs: string[]) => {
    setFavorites(newFavs);
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (consent === "all" || consent === "essential") {
        localStorage.setItem("it_tools_favorites", JSON.stringify(newFavs));
      }
    } catch (e) {
      // Ignore
    }
  };

  const addFavorite = (id: string) => {
    if (!favorites.includes(id)) {
      saveFavorites([...favorites, id]);
    }
  };

  const removeFavorite = (id: string) => {
    saveFavorites(favorites.filter(fav => fav !== id));
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, isLoaded }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
