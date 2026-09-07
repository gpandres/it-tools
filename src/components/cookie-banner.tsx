"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [essentialChecked, setEssentialChecked] = useState(true);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignore if localStorage is blocked by privacy extensions (e.g., Brave Shields)
    }
  }, []);

  const saveConsent = (type: string) => {
    try {
      if (type === "none") {
        // Clear it if they reject everything
        localStorage.removeItem("cookie_consent");
      } else {
        localStorage.setItem("cookie_consent", type);
      }
    } catch (e) {
      // Ignore storage errors
    }
    setIsVisible(false);
  };

  const savePreferences = () => {
    if (essentialChecked) {
      saveConsent("essential");
    } else {
      saveConsent("none");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-[#050505] border-2 border-[#00ff9c] shadow-[0_0_15px_rgba(0,255,156,0.2)] p-6 relative">
          
          <button 
            onClick={() => saveConsent("essential")}
            className="absolute top-2 right-2 text-zinc-500 hover:text-red-500 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {!showPreferences ? (
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-[#00ff9c] font-bold uppercase tracking-widest text-sm">
                  <Cookie className="w-4 h-4" />
                  <span>Cookie Banner</span>
                </div>
                <p className="text-sm text-zinc-300 font-mono">
                  The European bureaucrats force me to put this here, but we don't actually collect any analytics, tracking, or telemetry. Everything runs 100% locally in your browser. We only use local storage to save your tool data (essential functionality).
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => setShowPreferences(true)}
                  variant="outline" 
                  className="border-[#1a1a1a] text-zinc-400 hover:text-[#00ff9c] hover:border-[#00ff9c] font-mono text-xs h-9"
                >
                  Preferences
                </Button>
                <Button 
                  onClick={() => saveConsent("none")}
                  variant="outline" 
                  className="border-red-900/50 text-red-500 hover:bg-red-900/20 font-mono text-xs h-9"
                >
                  Reject All
                </Button>
                <Button 
                  onClick={() => saveConsent("all")}
                  className="bg-[#00ff9c] text-black hover:bg-[#00cc7d] font-bold font-mono text-xs h-9 shadow-[0_0_10px_rgba(0,255,156,0.3)]"
                >
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#00ff9c] font-bold uppercase tracking-widest text-sm">
                <Cookie className="w-4 h-4" />
                <span>Cookie Preferences</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 border border-[#1a1a1a] p-3">
                  <input 
                    type="checkbox" 
                    checked={essentialChecked} 
                    onChange={(e) => setEssentialChecked(e.target.checked)}
                    className="mt-1 accent-[#00ff9c] cursor-pointer" 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Strictly Necessary</h4>
                    <p className="text-xs text-zinc-400 font-mono mt-1">
                      Required for the website to function. Includes keeping your tool data persistent across reloads.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  onClick={savePreferences}
                  variant="outline" 
                  className="border-[#00ff9c] text-[#00ff9c] hover:bg-[#00ff9c]/10 font-mono text-xs h-9"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
