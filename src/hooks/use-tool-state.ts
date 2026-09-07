import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { hasStorageConsent } from "@/lib/storage";

// A generic hook to manage tool state and sync with URL query parameters
export function useToolUrlState<T extends Record<string, string>>(
  initialState: T
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL if present, otherwise use initialState
  const [state, setState] = useState<T>(() => {
    const stateFromUrl = { ...initialState };
    let hasUrlParams = false;
    
    Object.keys(initialState).forEach((key) => {
      const val = searchParams.get(key);
      if (val !== null) {
        // @ts-ignore
        stateFromUrl[key] = val;
        hasUrlParams = true;
      }
    });

    return hasUrlParams ? stateFromUrl : initialState;
  });

  // Debounced URL update
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      let hasChanges = false;
      
      Object.keys(state).forEach((key) => {
        const value = state[key];
        if (value && value !== initialState[key]) {
          if (params.get(key) !== value) {
            params.set(key, value);
            hasChanges = true;
          }
        } else if (params.has(key)) {
          params.delete(key);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        // Use replace to avoid filling history
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [state, router, pathname, searchParams, initialState]);

  const updateState = useCallback((updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState] as const;
}

// Hook to save local history of tool inputs
export function useToolHistory<T>(toolId: string, maxItems = 10) {
  const [history, setHistory] = useState<T[]>([]);

  useEffect(() => {
    try {
      if (!hasStorageConsent()) return;
      const stored = localStorage.getItem(`it_tools_${toolId}_history`);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, [toolId]);

  const addHistory = useCallback((item: T) => {
    setHistory((prev) => {
      const newHistory = [item, ...prev].slice(0, maxItems);
      try {
        if (!hasStorageConsent()) return newHistory;
        localStorage.setItem(`it_tools_${toolId}_history`, JSON.stringify(newHistory));
      } catch (e) {
         console.error("Failed to save history", e);
      }
      return newHistory;
    });
  }, [toolId, maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (hasStorageConsent()) localStorage.removeItem(`it_tools_${toolId}_history`);
  }, [toolId]);

  return { history, addHistory, clearHistory };
}

// Single value wrapper for useToolUrlState
export function useToolState(key: string, defaultValue: string) {
  const [state, setState] = useToolUrlState({ [key]: defaultValue });
  
  const setValue = useCallback((val: string) => {
    setState({ [key]: val });
  }, [key, setState]);

  return [state[key], setValue] as const;
}
