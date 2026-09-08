"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import { CommandMenu } from "@/components/command-menu";
import { useFavorites } from "@/components/favorites-provider";
import { toolsRegistry, CATEGORIES } from "@/lib/tools";
import { searchTools, toolDataFlow, workflows } from "@/lib/tool-discovery";
import { catalogStructuredData, serializeJsonLd, SITE_URL } from "@/lib/seo";

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);
  const { favorites, recent, addFavorite, removeFavorite, clearRecent } = useFavorites();
  const filtered = useMemo(() => searchTools(query).filter(tool =>
    (!category || tool.category === category) &&
    (!favoritesOnly || favorites.includes(tool.id)) &&
    (!localOnly || toolDataFlow(tool).label === "Local processing")
  ), [query, category, favoritesOnly, localOnly, favorites]);
  const recentTools = recent.flatMap(id => {
    const tool = toolsRegistry.find(item => item.id === id);
    return tool ? [tool] : [];
  });
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(catalogStructuredData(toolsRegistry)) }} />
    <div className="max-w-7xl mx-auto space-y-10">
      <header className="py-6 sm:py-10 border-b border-[#1a1a1a]">
        <p className="text-xs text-[#00ff9c] tracking-widest mb-4">/ OPERATIONS TOOLKIT</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#ffb000] tracking-tight">IT_TOOLS<span className="cursor-blink text-[#00ff9c]">_</span></h1>
        <p className="mt-5 max-w-2xl text-zinc-300">Your everyday workspace for networks, infrastructure and incident response.</p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Local processing by default. No tracking. Tools that use network services are labelled before you open them.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-[#00ff9c]">{toolsRegistry.length} tools</span>
          <span className="text-zinc-400">{CATEGORIES.length} categories</span>
          <a href="https://github.com/gpandres/it-tools" target="_blank" rel="noopener noreferrer" className="text-zinc-400 underline underline-offset-4">View source</a>
          <div className="w-full sm:w-64 sm:ml-auto"><CommandMenu /></div>
        </div>
      </header>

      {recentTools.length > 0 && <section aria-labelledby="recent-heading">
        <div className="flex justify-between gap-4 mb-4">
          <h2 id="recent-heading" className="text-sm text-[#ffb000]">Recently opened</h2>
          <button onClick={clearRecent} className="text-xs text-zinc-400 underline">Clear recent tools</button>
        </div>
        <div className="flex flex-wrap gap-2">{recentTools.map(tool => <Link key={tool.id} href={tool.path} className="border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:border-[#00ff9c]">{tool.name}</Link>)}</div>
      </section>}

      <section aria-labelledby="workflows-heading">
        <h2 id="workflows-heading" className="text-sm text-[#ffb000] mb-2">Start with a workflow</h2>
        <p className="text-xs text-zinc-400 mb-4">Guided routes through existing tools. Move your results between steps manually.</p>
        <div className="grid xl:grid-cols-3 gap-4">
          {workflows.map(flow => <article key={flow.id} className="border border-zinc-800 bg-[#050505] p-5">
            <h3 className="text-sm font-bold text-[#00ff9c]">{flow.name}</h3>
            <p className="text-xs text-zinc-400 mt-2 mb-4">{flow.description}</p>
            <ol className="space-y-2">{flow.toolIds.map((id, index) => {
              const tool = toolsRegistry.find(item => item.id === id)!;
              return <li key={id}><Link href={tool.path} className="flex gap-2 items-center text-xs text-zinc-300 hover:text-[#00ff9c]"><span className="text-zinc-500">{index + 1}.</span>{tool.name}<ArrowRight className="w-3 h-3 ml-auto shrink-0" aria-hidden="true" /></Link></li>;
            })}</ol>
          </article>)}
        </div>
      </section>

      <section aria-labelledby="catalogue-heading">
        <h2 id="catalogue-heading" className="text-lg text-[#ffb000] mb-4">All tools</h2>
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
          <label className="flex items-center gap-2"><input type="checkbox" checked={favoritesOnly} onChange={event => setFavoritesOnly(event.target.checked)} className="accent-[#00ff9c]" />Favorites only</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={localOnly} onChange={event => setLocalOnly(event.target.checked)} className="accent-[#00ff9c]" />No external services</label>
          <span role="status" className="text-zinc-400">{filtered.length} tools found</span>
          {(query || category || favoritesOnly || localOnly) && <button className="underline text-[#00ff9c]" onClick={() => { setQuery(""); setCategory(""); setFavoritesOnly(false); setLocalOnly(false); }}>Reset filters</button>}
        </div>
        {filtered.length === 0 ? <p className="p-8 border border-zinc-800 text-sm text-zinc-400">No matching tools. Try another search or reset the filters.</p> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tool => {
            const favorite = favorites.includes(tool.id);
            const dataFlow = toolDataFlow(tool);
            return <article key={tool.id} className="relative flex flex-col border border-zinc-800 bg-[#050505] p-5 hover:border-zinc-600">
              <p className="text-[10px] text-zinc-400 tracking-wide pr-8 mb-3">{tool.category}</p>
              <button aria-label={`${favorite ? "Remove" : "Add"} ${tool.name} ${favorite ? "from" : "to"} favorites`} aria-pressed={favorite} onClick={() => favorite ? removeFavorite(tool.id) : addFavorite(tool.id)} className="absolute right-3 top-3 p-2 text-zinc-400 hover:text-[#ffb000]"><Star aria-hidden="true" className={`w-4 h-4 ${favorite ? "fill-[#ffb000] text-[#ffb000]" : ""}`} /></button>
              <h3 className="text-sm font-bold text-[#00ff9c]"><Link href={tool.path} className="hover:underline">{tool.name}</Link></h3>
              <p className="text-xs text-zinc-400 mt-2 mb-4 flex-1">{tool.description}</p>
              <details className="text-[11px] text-zinc-400">
                <summary className="cursor-pointer">{dataFlow.label}</summary>
                <p className="mt-2 leading-relaxed">{dataFlow.description}</p>
              </details>
            </article>;
          })}
        </div>}
      </section>
    </div>
  </main>;
}
