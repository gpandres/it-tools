"use client";

import * as React from "react";
import { CommandMenu } from "./command-menu";
import { useFavorites } from "@/components/favorites-provider";
import { Star } from "lucide-react";
import { usePathname } from "next/navigation";
import { toolsRegistry } from "@/lib/tools";
import { relatedToolsFor, toolDataFlow } from "@/lib/tool-discovery";
import { serializeJsonLd, toolCanonicalUrl, toolStructuredData, toolTitle } from "@/lib/seo";
import Link from "next/link";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function ToolLayout({ title, description, children, fullWidth = false }: ToolLayoutProps) {
  const pathname = usePathname();
  const { addFavorite, removeFavorite, isFavorite, isLoaded } = useFavorites();

  const currentTool = toolsRegistry.find(t => t.path === pathname);
  const seoTool = currentTool;
  const seoDescription = currentTool?.description ?? description;
  
  const relatedTools = React.useMemo(() => {
    if (!currentTool) return [];
    return relatedToolsFor(currentTool.id);
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
      {seoTool && <>
        <title>{toolTitle(seoTool)}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={[...seoTool.keywords, seoTool.category, "IT tools"].join(", ")} />
        <link rel="canonical" href={toolCanonicalUrl(seoTool)} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolTitle(seoTool)} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={toolCanonicalUrl(seoTool)} />
        <meta property="og:site_name" content="IT Tools by andresgp.dev" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolTitle(seoTool)} />
        <meta name="twitter:description" content={seoDescription} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(toolStructuredData(seoTool, seoDescription)) }} />
      </>}
      <header className="relative sticky top-0 z-30 flex h-[104px] shrink-0 flex-nowrap items-start justify-between gap-4 overflow-visible border-b border-[#1a1a1a] bg-[#050505] px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="min-w-0 truncate text-sm font-bold text-[#ffb000] glow-amber flex items-center gap-2 uppercase tracking-widest">
              <span className="text-[#00ff9c] text-xs">/</span>
              {title}
            </h1>
            {isLoaded && currentTool && (
              <button 
                onClick={toggleFavorite} 
                className="text-zinc-500 hover:text-[#ffb000] transition-colors"
                title="Toggle Favorite"
                aria-label={isFavorite(currentTool.id) ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={isFavorite(currentTool.id)}
              >
                <Star className={`w-4 h-4 ${isFavorite(currentTool.id) ? 'fill-[#ffb000] text-[#ffb000]' : ''}`} />
              </button>
            )}
          </div>
          <p className="truncate text-xs text-zinc-500 mt-1 font-mono">{description}</p>
          {currentTool && <details className="absolute left-4 top-[72px] z-40 mt-0 max-w-[min(36rem,calc(100vw-2rem))] text-[11px] text-zinc-400 open:border open:border-[#242424] open:bg-[#050505] open:px-3 open:py-2 open:shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:left-6">
            <summary className="cursor-pointer">{toolDataFlow(currentTool).label}</summary>
            <p className="mt-2">{toolDataFlow(currentTool).description}</p>
          </details>}
        </div>
        <div className="w-48 shrink-0 sm:w-64">
          <CommandMenu />
        </div>
      </header>
      
      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden flex flex-col">
        <div className={`${fullWidth ? "max-w-none" : "max-w-7xl flex-1"} w-full min-w-0 mx-auto`}>
          {children}
        </div>
        
        {/* RELATED TOOLS */}
        {relatedTools.length > 0 && (
          <div className={`${fullWidth ? "max-w-none" : "max-w-7xl"} w-full min-w-0 mx-auto mt-16 pt-8 border-t border-[#1a1a1a]`}>
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
