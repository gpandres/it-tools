"use client";

import * as React from "react";
import { CommandMenu } from "./command-menu";
import { useFavorites } from "@/components/favorites-provider";
import { Star } from "lucide-react";
import { usePathname } from "next/navigation";
import { toolsRegistry } from "@/lib/tools";
import Link from "next/link";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function ToolLayout({ title, description, children, fullWidth = false }: ToolLayoutProps) {
  const pathname = usePathname();
  const { favorites, addFavorite, removeFavorite, isFavorite, isLoaded } = useFavorites();

  const currentTool = toolsRegistry.find(t => t.path === pathname);
  
  const relatedTools = React.useMemo(() => {
    if (!currentTool) return [];
    return toolsRegistry
      .filter(t => t.id !== currentTool.id && t.category === currentTool.category)
      .slice(0, 3);
  }, [currentTool]);

  const toggleFavorite = () => {
    if (!currentTool) return;
    if (isFavorite(currentTool.id)) {
      removeFavorite(currentTool.id);
    } else {
      addFavorite(currentTool.id);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#050505]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-[#ffb000] glow-amber flex items-center gap-2 uppercase tracking-widest">
              <span className="text-[#00ff9c] text-xs">/</span>
              {title}
            </h1>
            {isLoaded && currentTool && (
              <button 
                onClick={toggleFavorite} 
                className="text-zinc-500 hover:text-[#ffb000] transition-colors"
                title="Toggle Favorite"
              >
                <Star className={`w-4 h-4 ${isFavorite(currentTool.id) ? 'fill-[#ffb000] text-[#ffb000]' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-mono">{description}</p>
        </div>
        <div className="hidden md:block w-64">
          <CommandMenu />
        </div>
      </header>
      
      <main className="flex-1 p-6 overflow-x-hidden flex flex-col">
        <div className={`${fullWidth ? "w-full max-w-[95vw]" : "max-w-7xl w-full"} mx-auto flex-1`}>
          {children}
        </div>
        
        {/* RELATED TOOLS */}
        {relatedTools.length > 0 && (
          <div className={`${fullWidth ? "w-full max-w-[95vw]" : "max-w-7xl w-full"} mx-auto mt-16 pt-8 border-t border-[#1a1a1a]`}>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Related Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedTools.map(tool => (
                <Link href={tool.path} key={tool.id}>
                  <div className="p-4 border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#00ff9c] transition-colors cursor-pointer group h-full flex flex-col">
                    <h4 className="text-[#00ff9c] font-bold text-xs uppercase tracking-wider mb-2 group-hover:glow">{tool.name}</h4>
                    <p className="text-zinc-500 text-[10px] font-mono leading-relaxed flex-1">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
