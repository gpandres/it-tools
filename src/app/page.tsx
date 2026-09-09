"use client";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Star, ArrowRight, Boxes, Compass, ChevronDown } from "lucide-react";
import { CommandMenu } from "@/components/command-menu";
import { useFavorites } from "@/components/favorites-provider";
import { toolsRegistry, CATEGORIES } from "@/lib/tools";
import { featuredWorkspaces, roleRecommendations, searchTools, toolDataFlow, workflows } from "@/lib/tool-discovery";
import { catalogStructuredData, serializeJsonLd, SITE_URL } from "@/lib/seo";
import { readLocalStorage, STORAGE_CHANGED, writeLocalStorage } from "@/lib/storage";

const HOME_JSON_LD = serializeJsonLd(catalogStructuredData(toolsRegistry));
const TOOL_DATA_FLOW = new Map(toolsRegistry.map(tool => [tool.id, toolDataFlow(tool)]));
const HOME_FILTERS_KEY = "it_tools_home_filters";
const INITIAL_TOOL_BATCH = 12;
const TOOL_BATCH_SIZE = 24;

function ToolCardsSkeleton() {
  return <div aria-label="Loading tools" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" role="status">
    {Array.from({ length: 3 }, (_, index) => <article key={index} aria-hidden="true" className="flex min-h-[190px] flex-col border border-zinc-800 bg-[#050505] p-5">
      <div className="h-2 w-24 animate-pulse bg-[#163b2d]" />
      <div className="mt-5 h-4 w-3/4 animate-pulse bg-[#101b17]" />
      <div className="mt-4 h-3 w-full animate-pulse bg-[#101b17]" />
      <div className="mt-2 h-3 w-5/6 animate-pulse bg-[#101b17]" />
    </article>)}
  </div>;
}

function FeaturedWorkspaceCard({ workspace }: { workspace: typeof featuredWorkspaces[number] }) {
  const tool = toolsRegistry.find(item => item.id === workspace.id);
  if (!tool) return null;
  return <article className="group flex min-h-[180px] flex-col border-t border-zinc-800 py-5 transition-colors hover:border-[#00ff9c]">
    <div className="flex items-center justify-between gap-4 pr-1">
      <span className="text-[10px] tracking-widest text-zinc-500">{workspace.eyebrow}</span>
      <Boxes aria-hidden="true" className="h-4 w-4 text-[#1f7a5a] group-hover:text-[#00ff9c]" />
    </div>
    <h3 className="mt-5 text-base font-bold text-[#00ff9c]"><Link href={tool.path} className="hover:underline">{tool.name}</Link></h3>
    <p className="mt-3 flex-1 text-xs leading-relaxed text-zinc-400">{workspace.summary}</p>
    <Link href={tool.path} className="mt-5 inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-[#00ff9c]">Open workspace <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
  </article>;
}

const HomeToolCard = memo(function HomeToolCard({
  tool,
  favorite,
  onToggleFavorite,
}: {
  tool: typeof toolsRegistry[number];
  favorite: boolean;
  onToggleFavorite: (toolId: string, isFavorite: boolean) => void;
}) {
  const dataFlow = TOOL_DATA_FLOW.get(tool.id)!;
  return <article className="relative flex flex-col border border-zinc-800 bg-[#050505] p-5 hover:border-zinc-600 [content-visibility:auto] [contain-intrinsic-size:0_190px]">
    <p className="text-[10px] text-zinc-400 tracking-wide pr-8 mb-3">{tool.category}</p>
    <button aria-label={`${favorite ? "Remove" : "Add"} ${tool.name} ${favorite ? "from" : "to"} favorites`} aria-pressed={favorite} onClick={() => onToggleFavorite(tool.id, favorite)} className="absolute right-3 top-3 p-2 text-zinc-400 hover:text-[#ffb000]"><Star aria-hidden="true" className={`w-4 h-4 ${favorite ? "fill-[#ffb000] text-[#ffb000]" : ""}`} /></button>
    <h3 className="text-sm font-bold text-[#00ff9c]"><Link href={tool.path} className="hover:underline">{tool.name}</Link></h3>
    <p className="text-xs text-zinc-400 mt-2 mb-4 flex-1">{tool.description}</p>
    <details className="text-[11px] text-zinc-400">
      <summary className="cursor-pointer">{dataFlow.label}</summary>
      <p className="mt-2 leading-relaxed">{dataFlow.description}</p>
    </details>
  </article>;
});

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);
  const [activeRole, setActiveRole] = useState<typeof roleRecommendations[number]["id"]>(roleRecommendations[0].id);
  const [filtersReady, setFiltersReady] = useState(false);
  const [visibleToolCount, setVisibleToolCount] = useState(INITIAL_TOOL_BATCH);
  const { favorites, recent, addFavorite, removeFavorite, clearRecent, isLoaded } = useFavorites();
  const preferencesReady = useRef(isLoaded);
  useEffect(() => {
    preferencesReady.current = isLoaded;
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const restoreFilters = () => {
      const raw = readLocalStorage(HOME_FILTERS_KEY);
      if (raw && raw.length <= 4096) {
        try {
          const saved = JSON.parse(raw);
          if (saved && typeof saved === "object") {
            if (typeof saved.query === "string") setQuery(saved.query.slice(0, 200));
            if (typeof saved.category === "string" && CATEGORIES.includes(saved.category as typeof CATEGORIES[number])) setCategory(saved.category);
            if (typeof saved.favoritesOnly === "boolean") setFavoritesOnly(saved.favoritesOnly);
            if (typeof saved.localOnly === "boolean") setLocalOnly(saved.localOnly);
          }
        } catch {
          // Ignore malformed filter preferences and keep the default catalogue view.
        }
      }
      setFiltersReady(true);
    };
    const restoreTimer = window.setTimeout(restoreFilters, 0);
    window.addEventListener(STORAGE_CHANGED, restoreFilters);
    return () => {
      window.clearTimeout(restoreTimer);
      window.removeEventListener(STORAGE_CHANGED, restoreFilters);
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !filtersReady) return;
    const saveTimer = window.setTimeout(() => writeLocalStorage(HOME_FILTERS_KEY, JSON.stringify({
      query,
      category,
      favoritesOnly,
      localOnly,
    })), 250);
    return () => window.clearTimeout(saveTimer);
  }, [category, favoritesOnly, filtersReady, isLoaded, localOnly, query]);
  const filtered = useMemo(() => searchTools(query).filter(tool =>
    (!category || tool.category === category) &&
    (!favoritesOnly || favorites.includes(tool.id)) &&
    (!localOnly || TOOL_DATA_FLOW.get(tool.id)?.label === "Local processing")
  ), [query, category, favoritesOnly, localOnly, favorites]);
  const recentTools = recent.flatMap(id => {
    const tool = toolsRegistry.find(item => item.id === id);
    return tool ? [tool] : [];
  });
  const selectedRole = roleRecommendations.find(role => role.id === activeRole) ?? roleRecommendations[0];
  const selectedRoleTools = selectedRole.toolIds.flatMap(id => {
    const tool = toolsRegistry.find(item => item.id === id);
    return tool ? [tool] : [];
  });
  const catalogueReady = isLoaded && filtersReady;
  useEffect(() => {
    if (!catalogueReady) return;
    let nextCount = Math.min(INITIAL_TOOL_BATCH, filtered.length);
    let cancelled = false;
    let batchHandle: number | undefined;
    const browserWindow = window as unknown as {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const scheduleBatch = () => {
      if (cancelled) return;
      batchHandle = browserWindow.requestIdleCallback
        ? browserWindow.requestIdleCallback(addBatch, { timeout: 300 })
        : window.setTimeout(addBatch, 0);
    };
    const addBatch = () => {
      if (cancelled) return;
      nextCount = Math.min(nextCount + TOOL_BATCH_SIZE, filtered.length);
      setVisibleToolCount(nextCount);
      if (nextCount < filtered.length) scheduleBatch();
    };
    const initialHandle = window.setTimeout(() => {
      if (cancelled) return;
      setVisibleToolCount(nextCount);
      if (nextCount < filtered.length) scheduleBatch();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(initialHandle);
      if (browserWindow.requestIdleCallback && batchHandle !== undefined) browserWindow.cancelIdleCallback?.(batchHandle);
      else if (batchHandle !== undefined) window.clearTimeout(batchHandle);
    };
  }, [catalogueReady, category, favorites, favoritesOnly, filtered.length, localOnly, query]);
  const onToggleFavorite = useCallback((toolId: string, isFavorite: boolean) => {
    if (!preferencesReady.current) return;
    if (isFavorite) removeFavorite(toolId);
    else addFavorite(toolId);
  }, [addFavorite, removeFavorite]);
  return <main className="flex-1 p-4 sm:p-8 lg:p-12">
    <title>IT Tools | andresgp.dev</title>
    <meta name="description" content="Local-first tools for developers, sysadmins, DevOps and cybersecurity teams." />
    <meta name="keywords" content="developer tools, sysadmin tools, DevOps tools, cybersecurity tools, network tools, offline tools" />
    <link rel="canonical" href={SITE_URL} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="IT Tools | Privacy-First Developer Toolbox" />
    <meta property="og:description" content="Local-first network calculators, cryptography, encoders and security tools for developers and sysadmins." />
    <meta property="og:url" content={SITE_URL} />
    <meta property="og:site_name" content="IT Tools by andresgp.dev" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="IT Tools | Privacy-First Developer Toolbox" />
    <meta name="twitter:description" content="Local-first tools for developers, sysadmins and blue teams." />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: HOME_JSON_LD }} />
    <div className="max-w-7xl mx-auto space-y-10">
      <header className="py-6 sm:py-10 border-b border-[#1a1a1a]">
        <p className="text-xs text-[#00ff9c] tracking-widest mb-4">/ OPERATIONS TOOLKIT</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#ffb000] tracking-tight">IT_TOOLS<span className="cursor-blink text-[#00ff9c]">_</span></h1>
        <p className="mt-5 max-w-2xl text-zinc-300">Build, investigate and document — locally.</p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Local processing by default. No tracking. Tools that use network services are labelled before you open them.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-[#00ff9c]">{toolsRegistry.length} tools</span>
          <span className="text-zinc-400">{CATEGORIES.length} categories</span>
          <a href="https://github.com/gpandres/it-tools" target="_blank" rel="noopener noreferrer" className="text-zinc-400 underline underline-offset-4">View source</a>
          <div className="w-full sm:w-64 sm:ml-auto"><CommandMenu /></div>
        </div>
      </header>

      <section aria-labelledby="featured-heading">
        <div className="flex items-center gap-3">
          <Compass aria-hidden="true" className="h-4 w-4 text-[#ffb000]" />
          <h2 id="featured-heading" className="text-sm text-[#ffb000]">Featured workspaces</h2>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-zinc-400">Four focused places to design, operate, investigate, and respond.</p>
        <div className="mt-5 grid gap-x-10 sm:grid-cols-2">
          {featuredWorkspaces.map(workspace => <FeaturedWorkspaceCard key={workspace.id} workspace={workspace} />)}
        </div>
      </section>

      <section aria-labelledby="roles-heading" className="border-t border-[#1a1a1a] pt-8">
        <div className="flex items-center gap-3">
          <h2 id="roles-heading" className="text-sm text-[#ffb000]">Start by role</h2>
          <span className="text-[10px] tracking-wider text-zinc-600">PICK A STARTING POINT</span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">New here? Choose the work you do most and open one of the essential tools for it.</p>
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Recommended tools by role">
          {roleRecommendations.map(role => <button key={role.id} type="button" role="tab" aria-selected={role.id === activeRole} aria-controls={`role-panel-${role.id}`} onClick={() => setActiveRole(role.id)} className={`border px-3 py-2 text-xs transition-colors ${role.id === activeRole ? "border-[#00ff9c] bg-[#071710] text-[#00ff9c]" : "border-zinc-800 bg-[#050505] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"}`}>{role.name}</button>)}
        </div>
        <div id={`role-panel-${selectedRole.id}`} role="tabpanel" className="mt-5 grid gap-6 lg:grid-cols-[minmax(13rem,0.8fr)_repeat(3,minmax(0,1fr))]">
          <div className="border-b border-zinc-800 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <p className="text-[10px] tracking-widest text-zinc-500">{selectedRole.name.toUpperCase()}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{selectedRole.description}</p>
            <a href="#catalogue-heading" className="mt-5 inline-flex items-center gap-2 text-xs text-[#00ff9c] hover:underline">Explore all tools <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></a>
          </div>
          {selectedRoleTools.map(tool => <article key={tool.id} className="flex flex-col border-t border-zinc-800 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            <p className="text-[10px] tracking-wide text-zinc-600">{toolDataFlow(tool).label.toUpperCase()}</p>
            <h3 className="mt-3 text-sm font-bold text-[#00ff9c]"><Link href={tool.path} className="hover:underline">{tool.name}</Link></h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-zinc-400">{tool.description}</p>
            <Link href={tool.path} className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-[#00ff9c]">Open tool <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
          </article>)}
        </div>
      </section>

      {!isLoaded ? <section aria-label="Loading recently opened tools" className="space-y-3" role="status">
        <div className="flex items-center justify-between gap-4"><div className="h-4 w-40 animate-pulse bg-[#163b2d]" /><div className="h-3 w-28 animate-pulse bg-[#101b17]" /></div>
        <div className="flex gap-2"><div className="h-8 w-36 animate-pulse border border-zinc-800 bg-[#050505]" /><div className="h-8 w-28 animate-pulse border border-zinc-800 bg-[#050505]" /><div className="h-8 w-32 animate-pulse border border-zinc-800 bg-[#050505]" /></div>
      </section> : recentTools.length > 0 && <section aria-labelledby="recent-heading">
        <div className="flex justify-between gap-4 mb-4">
          <h2 id="recent-heading" className="text-sm text-[#ffb000]">Recently opened</h2>
          <button onClick={clearRecent} className="text-xs text-zinc-400 underline">Clear recent tools</button>
        </div>
        <div className="flex flex-wrap gap-2">{recentTools.map(tool => <Link key={tool.id} href={tool.path} className="border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:border-[#00ff9c]">{tool.name}</Link>)}</div>
      </section>}

      <section aria-labelledby="workflows-heading">
        <details className="group border-t border-[#1a1a1a] pt-5">
          <summary className="flex cursor-pointer list-none items-center gap-3 text-sm text-[#ffb000] marker:hidden">
            <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
            <span id="workflows-heading">Need a guided workflow?</span>
            <span className="text-xs text-zinc-500">Explore a complete route through several tools.</span>
          </summary>
          <div id="home-workflows-content" className="mt-5 grid gap-4 xl:grid-cols-3">
          {workflows.map(flow => <article key={flow.id} className="border border-zinc-800 bg-[#050505] p-5">
            <h3 className="text-sm font-bold text-[#00ff9c]">{flow.name}</h3>
            <p className="text-xs text-zinc-400 mt-2 mb-4">{flow.description}</p>
            <ol className="space-y-2">{flow.toolIds.map((id, index) => {
              const tool = toolsRegistry.find(item => item.id === id)!;
              return <li key={id}><Link href={tool.path} className="flex gap-2 items-center text-xs text-zinc-300 hover:text-[#00ff9c]"><span className="text-zinc-500">{index + 1}.</span>{tool.name}<ArrowRight className="w-3 h-3 ml-auto shrink-0" aria-hidden="true" /></Link></li>;
            })}</ol>
          </article>)}
          </div>
        </details>
      </section>

      <section aria-labelledby="catalogue-heading">
        <div className="mb-4 flex items-center gap-4">
          <h2 id="catalogue-heading" className="text-lg text-[#ffb000]">All tools</h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="tool-search" className="block text-xs text-zinc-400 mb-2">Search by name, task or vendor</label>
            <input id="tool-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try wildcard, firewall, Docker..." className="w-full bg-[#050505] border border-zinc-700 p-3 text-sm" />
          </div>
          <div>
            <label htmlFor="tool-category" className="block text-xs text-zinc-400 mb-2">Category</label>
            <select id="tool-category" value={category} onChange={event => setCategory(event.target.value)} className="w-full lg:w-72 bg-[#050505] border border-zinc-700 p-3 text-sm">
              <option value="">All categories</option>
              {CATEGORIES.map(item => <option key={item} value={item}>{item} ({toolsRegistry.filter(tool => tool.category === item).length})</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 items-center py-4 text-xs text-zinc-300">
          {!catalogueReady ? <div role="status" className="flex items-center gap-2 text-zinc-500"><span className="h-3 w-3 animate-pulse bg-[#163b2d]" />Loading saved preferences...</div> : <label className="flex items-center gap-2"><input type="checkbox" checked={favoritesOnly} onChange={event => setFavoritesOnly(event.target.checked)} className="accent-[#00ff9c]" />Favorites only</label>}
          <label className={catalogueReady ? "flex items-center gap-2" : "flex items-center gap-2 opacity-60"}><input type="checkbox" checked={localOnly} disabled={!catalogueReady} onChange={event => setLocalOnly(event.target.checked)} className="accent-[#00ff9c]" />No external services</label>
          <span role="status" className="text-zinc-400">{catalogueReady ? `${filtered.length} tools found` : "Preparing catalogue..."}</span>
          {catalogueReady && (query || category || favoritesOnly || localOnly) && <button className="underline text-[#00ff9c]" onClick={() => { setQuery(""); setCategory(""); setFavoritesOnly(false); setLocalOnly(false); }}>Reset filters</button>}
        </div>
        {!catalogueReady ? <ToolCardsSkeleton /> : filtered.length === 0 ? <p className="p-8 border border-zinc-800 text-sm text-zinc-400">No matching tools. Try another search or reset the filters.</p> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.slice(0, visibleToolCount).map(tool => <HomeToolCard key={tool.id} tool={tool} favorite={favorites.includes(tool.id)} onToggleFavorite={onToggleFavorite} />)}
        </div>}
      </section>
    </div>
  </main>;
}
