"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { toolsRegistry, CATEGORIES } from "@/lib/tools";
import { useFavorites } from "@/components/favorites-provider";
import { Star } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { favorites, isLoaded } = useFavorites();

  // Group tools by category dynamically
  const groupedTools = useMemo(() => {
    const groups: Record<string, typeof toolsRegistry> = {};
    CATEGORIES.forEach(c => groups[c] = []);
    
    toolsRegistry.forEach(tool => {
      if (groups[tool.category]) {
        groups[tool.category].push(tool);
      } else {
        groups[tool.category] = [tool];
      }
    });
    
    return groups;
  }, []);

  const favoriteTools = useMemo(() => {
    return toolsRegistry.filter(t => favorites.includes(t.id));
  }, [favorites]);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-black">
        <span className="font-bold text-[#ffb000] glow-amber text-sm tracking-widest">IT_TOOLS<span className="cursor-blink">_</span></span>
        <button className="text-zinc-500" onClick={() => setIsOpen(!isOpen)}>
          [{isOpen ? "x" : "="}]
        </button>
      </div>

      <aside className={`
        fixed md:sticky top-0 h-screen w-64 flex-shrink-0
        bg-[#050505] border-r border-[#1a1a1a]
        overflow-y-auto z-40 transition-transform duration-200 ease-in-out custom-scrollbar
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6 hidden md:block border-b border-[#1a1a1a] bg-[#0a0a0a]">
          <Link href="/" className="font-bold text-xl text-[#ffb000] glow-amber block mb-2 tracking-widest">
            IT_TOOLS<span className="cursor-blink text-[#00ff9c]">_</span>
          </Link>
          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-[#00ff9c] animate-pulse"></span>
            ALL CLIENT-SIDE
          </div>
        </div>

        <nav className="p-4 space-y-8">
          {/* FAVORITES SECTION */}
          {isLoaded && favoriteTools.length > 0 && (
            <div>
              <h3 className="mb-3 text-[10px] font-bold text-[#ffb000] uppercase tracking-widest flex items-center gap-2">
                <Star className="w-3 h-3 fill-[#ffb000]" /> FAVORITES
              </h3>
              <div className="space-y-2">
                {favoriteTools.map((tool) => {
                  const isActive = pathname === tool.path;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        block text-xs transition-colors
                        hover:text-[#ffb000]
                        ${isActive ? "text-[#ffb000] glow-amber" : "text-zinc-400"}
                      `}
                      title={tool.description}
                    >
                      {isActive ? "> " : "  "}{tool.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {CATEGORIES.map((category) => {
            const tools = groupedTools[category];
            if (!tools || tools.length === 0) return null;
            
            return (
              <div key={category}>
                <h3 className="mb-3 text-[10px] font-bold text-[#00ff9c] uppercase tracking-widest flex items-center gap-2">
                  <span className="text-zinc-600">/</span> {category}
                </h3>
                <div className="space-y-2">
                  {tools.map((tool) => {
                    const isActive = pathname === tool.path;
                    return (
                      <Link
                        key={tool.id}
                        href={tool.path}
                        onClick={() => setIsOpen(false)}
                        className={`
                          block text-xs transition-colors
                          hover:text-[#00ff9c] hover:glow
                          ${isActive ? "text-[#00ff9c] glow" : "text-zinc-400"}
                        `}
                        title={tool.description}
                      >
                        {isActive ? "> " : "  "}{tool.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
