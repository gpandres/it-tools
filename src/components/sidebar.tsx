"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Clock3, Search, Star, X } from "lucide-react";
import { toolsRegistry, CATEGORIES } from "@/lib/tools";
import { useFavorites } from "./favorites-provider";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";

const APP_VERSION = "0.1.0";

function matchesTool(tool: typeof toolsRegistry[number], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [tool.name, tool.description, tool.category, ...tool.keywords, ...(tool.aliases ?? [])]
    .some(value => value.toLowerCase().includes(normalized));
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const { favorites, recent, isLoaded } = useFavorites();

  const filteredTools = useMemo(() => toolsRegistry.filter(tool => matchesTool(tool, query)), [query]);
  const favoriteTools = useMemo(() => filteredTools.filter(tool => favorites.includes(tool.id)), [favorites, filteredTools]);
  const recentTools = useMemo(() => recent.flatMap(id => filteredTools.filter(tool => tool.id === id)), [recent, filteredTools]);

  const closeMobileMenu = () => setIsOpen(false);
  const toggleCategory = (category: string) => {
    setCollapsedCategories(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category]);
  };

  const triggerEasterEgg = () => {
    setShowEasterEgg(true);
    window.setTimeout(() => setShowEasterEgg(false), 3200);
  };

  const renderLink = (tool: typeof toolsRegistry[number]) => (
    <Link key={tool.id} href={tool.path} onClick={closeMobileMenu} aria-current={pathname === tool.path ? "page" : undefined}
      className={`block truncate border-l-2 py-1.5 pl-3 text-[11px] transition-colors hover:text-[#00ff9c] ${pathname === tool.path ? "border-[#00ff9c] text-[#00ff9c]" : "border-transparent text-zinc-400"}`} title={tool.description}>
      {tool.name}
    </Link>
  );

  const navigation = (
    <nav aria-label="Tools" className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-4">
      <div className="relative mb-4">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input type="search" aria-label="Search tools in navigation" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tools..."
          className="h-9 w-full border border-[#242424] bg-black pl-9 pr-8 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-[#00ff9c]" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear tool search" className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
      </div>

      {isLoaded && favoriteTools.length > 0 && <section className="mb-3 border-b border-[#161616] pb-3">
        <div className="mb-1 flex items-center gap-2 px-1 text-[10px] font-bold tracking-widest text-[#ffb000]"><Star className="h-3 w-3" aria-hidden="true" /> FAVORITES <span className="ml-auto text-zinc-600">{favoriteTools.length}</span></div>
        {favoriteTools.map(renderLink)}
      </section>}

      {isLoaded && recentTools.length > 0 && <section className="mb-3 border-b border-[#161616] pb-3">
        <div className="mb-1 flex items-center gap-2 px-1 text-[10px] font-bold tracking-widest text-zinc-400"><Clock3 className="h-3 w-3" aria-hidden="true" /> RECENT <span className="ml-auto text-zinc-600">{recentTools.length}</span></div>
        {recentTools.slice(0, 5).map(renderLink)}
      </section>}

      <div className="mb-2 flex items-center justify-between px-1"><span className="text-[10px] font-bold tracking-widest text-[#00ff9c]">TOOLS</span><span className="text-[10px] text-zinc-600">{filteredTools.length}/{toolsRegistry.length}</span></div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
        {CATEGORIES.map(category => {
          const categoryTools = filteredTools.filter(tool => tool.category === category);
          if (query && categoryTools.length === 0) return null;
          const collapsed = collapsedCategories.includes(category);
          return <section key={category} className="border-b border-[#111] last:border-b-0">
            <button type="button" onClick={() => toggleCategory(category)} aria-expanded={!collapsed} className="flex w-full items-center gap-2 py-2 text-left text-[10px] font-bold tracking-wider text-zinc-500 transition-colors hover:text-zinc-200">
              <ChevronDown className={`h-3 w-3 transition-transform ${collapsed ? "-rotate-90" : ""}`} aria-hidden="true" /><span className="truncate">{category}</span><span className="ml-auto shrink-0 text-[9px] text-zinc-700">{categoryTools.length}</span>
            </button>
            {!collapsed && <div className="mb-2">{categoryTools.map(renderLink)}</div>}
          </section>;
        })}
        {filteredTools.length === 0 && <p className="px-1 py-4 text-[11px] text-zinc-500">No tools match “{query}”.</p>}
      </div>
    </nav>
  );

  const footer = <footer className="shrink-0 border-t border-[#1a1a1a] px-4 py-3 text-[10px] leading-relaxed text-zinc-600"><div className="flex items-center justify-between"><span>IT_TOOLBOX</span><span>v{APP_VERSION}</span></div><div className="mt-1 flex items-center justify-between"><span>{toolsRegistry.length} local tools</span><span>⌘K search</span></div></footer>;

  return <>
    <div className="flex items-center justify-between gap-4 border-b border-[#1a1a1a] bg-black p-4 md:hidden"><Link href="/" className="font-bold tracking-widest text-[#ffb000]">IT_TOOLS<span className="cursor-blink text-[#00ff9c]">_</span></Link><Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger className="border border-zinc-700 px-3 py-2 text-sm" aria-label="Open navigation">Menu</DialogTrigger><DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden bg-[#050505]"><DialogTitle>Tool navigation</DialogTitle><DialogDescription>Search, filter and browse the toolbox.</DialogDescription>{navigation}{footer}</DialogContent></Dialog></div>
    <aside className="sticky top-0 hidden h-dvh min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-[#1a1a1a] bg-[#050505] md:flex"><div className="relative min-h-[104px] shrink-0 border-b border-[#1a1a1a] px-4 py-4"><Link href="/" className="font-bold text-xl tracking-widest text-[#ffb000]">IT_TOOLS<span className="cursor-blink text-[#00ff9c]">_</span></Link><p className="mt-2 text-[10px] tracking-widest text-zinc-500">LOCAL-FIRST · NO TRACKING</p><div className={`absolute bottom-2 left-4 right-4 flex cursor-pointer select-none items-center gap-2 overflow-hidden text-[9px] tracking-wider text-zinc-600 ${showEasterEgg ? "sidebar-easter-egg" : ""}`} aria-label="Toolbox status" title="Double-click for a surprise" onDoubleClick={triggerEasterEgg}><span className="sidebar-pacman" aria-hidden="true">{showEasterEgg ? "★" : "◖"}</span><span className="sidebar-dots" aria-hidden="true">···</span><span className="truncate text-[#1f7a5a]">{showEasterEgg ? "secret unlocked // nice reflexes" : "packet parade"}</span></div></div>{navigation}{footer}</aside>
  </>;
}
