"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { useNotification } from "@/components/notification-provider";

export type TelemetryReferenceItem = {
  id: string;
  type: string;
  name: string;
  description: string;
  fields: string[];
  maliciousUse: string;
  mitre: string[];
  icon: LucideIcon;
  color: string;
};

type Accent = "blue" | "orange";

const accentStyles = {
  blue: {
    input: "focus:border-blue-400",
    active: "bg-blue-400/10 border-blue-400/50 text-blue-400",
    hover: "hover:border-blue-400 hover:bg-blue-400/10",
    icon: "text-blue-500",
    result: "text-blue-400",
  },
  orange: {
    input: "focus:border-orange-400",
    active: "bg-orange-400/10 border-orange-400/50 text-orange-400",
    hover: "hover:border-orange-400 hover:bg-orange-400/10",
    icon: "text-orange-500",
    result: "text-orange-400",
  },
} satisfies Record<Accent, Record<string, string>>;

type TelemetryReferenceProps = {
  title: string;
  description: string;
  searchPlaceholder: string;
  filterLabel: string;
  emptyMessage: string;
  itemLabel: string;
  items: readonly TelemetryReferenceItem[];
  types: readonly string[];
  accent: Accent;
};

export function TelemetryReference({
  title,
  description,
  searchPlaceholder,
  filterLabel,
  emptyMessage,
  itemLabel,
  items,
  types,
  accent,
}: TelemetryReferenceProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [visibleLimit, setVisibleLimit] = useState(5);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { notify } = useNotification();
  const styles = accentStyles[accent];

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filterType !== "All" && item.type !== filterType) return false;
      if (!term) return true;
      return [item.id, item.name, item.description, item.maliciousUse, item.type, ...item.fields, ...item.mitre]
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [items, search, filterType]);

  const typeCounts = useMemo(() => Object.fromEntries(types.map((type) => [
    type,
    type === "All" ? items.length : items.filter((item) => item.type === type).length,
  ])), [items, types]);
  const visibleItems = filteredItems.slice(0, visibleLimit);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1600);
    } catch {
      notify("Clipboard access is unavailable.", "error");
    }
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setVisibleLimit(5);
  };

  const updateType = (value: string) => {
    setFilterType(value);
    setVisibleLimit(5);
  };

  return (
    <ToolLayout title={title} description={description}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-3">
          <div className="space-y-4 border border-[#1a1a1a] bg-[#050505] p-6">
            <h2 className="border-b border-[#1a1a1a] pb-2 text-sm font-bold uppercase tracking-widest text-zinc-500">Filters</h2>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full border border-[#1a1a1a] bg-black py-2 pl-9 pr-8 font-mono text-xs text-zinc-300 outline-none ${styles.input}`}
                aria-label={`${title} search`}
              />
              {search && <button type="button" onClick={() => updateSearch("")} className="absolute right-2 top-2.5 text-zinc-600 hover:text-zinc-300" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <div className="space-y-2 pt-2">
              <label className="font-mono text-xs text-zinc-500">{filterLabel}</label>
              <div className="flex max-h-[500px] flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {types.map((type) => (
                  <button key={type} type="button" onClick={() => updateType(type)} className={`flex items-center gap-2 border px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider transition-colors ${filterType === type ? styles.active : "border-[#1a1a1a] bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
                    <span className="min-w-0 truncate">{type === "All" ? `All ${itemLabel} Types` : type}</span>
                    <span className="ml-auto min-w-5 rounded border border-[#1a1a1a] px-1.5 py-0.5 text-center text-[9px] font-mono text-zinc-500">{typeCounts[type] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="space-y-4 lg:col-span-9">
          <div className="flex items-end justify-between gap-4"><h2 className={`${styles.result} font-mono text-sm`}>Found {filteredItems.length} {itemLabel.toLowerCase()}{filteredItems.length === 1 ? "" : "s"}</h2><span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Local reference</span></div>
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center border border-[#1a1a1a] bg-[#050505] p-8 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-zinc-600" /><p className="font-mono text-sm text-zinc-500">{emptyMessage}</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return <article key={item.id} className="group border border-[#1a1a1a] bg-[#050505] p-5 transition-colors hover:border-zinc-700">
                  <div className="flex items-start gap-4">
                    <div className={`rounded bg-[#1a1a1a] p-3 ${item.color} transition-transform group-hover:scale-110`}><Icon className="h-6 w-6" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <h3 className="min-w-0 break-words text-lg font-bold text-zinc-200"><span className={`${item.color} mr-2 font-mono`}>{item.id}</span>{item.name}</h3>
                        <span className="w-fit shrink-0 border border-[#1a1a1a] bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.type}</span>
                        <button type="button" onClick={() => copyId(item.id)} className="flex w-fit items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600 hover:text-zinc-200" aria-label={`Copy ${item.id}`}>{copiedId === item.id ? <><Check className="h-3 w-3 text-[#00ff9c]" /> Copied</> : <><Copy className="h-3 w-3" /> Copy ID</>}</button>
                      </div>
                      <p className="mb-4 text-sm leading-relaxed text-zinc-400">{item.description}</p>
                      <div className="relative mb-2 overflow-hidden border border-zinc-800 bg-black p-3"><div className={`absolute bottom-0 left-0 top-0 w-1 ${styles.icon}`} /><p className="ml-2 break-words font-mono text-xs text-zinc-300"><span className={`${styles.icon} mr-2 font-bold`}>Useful Fields:</span>{item.fields.join(", ")}</p></div>
                      <div className="relative mb-3 overflow-hidden border border-red-900/30 bg-red-900/10 p-3"><p className="break-words font-mono text-xs text-red-400"><span className="mr-2 font-bold">Malicious Use:</span>{item.maliciousUse}</p></div>
                      <div className="flex flex-wrap gap-2"><span className="mr-1 flex items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">Related MITRE:</span>{item.mitre.map((technique) => <span key={technique} className="border border-[#00ff9c]/30 bg-[#00ff9c]/10 px-2 py-0.5 font-mono text-[10px] text-[#00ff9c]">{technique}</span>)}</div>
                    </div>
                  </div>
                </article>;
              })}
              {visibleItems.length < filteredItems.length && <button type="button" onClick={() => setVisibleLimit((limit) => limit + 5)} className={`w-full border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${styles.active} ${styles.hover}`}>Show more ({Math.min(5, filteredItems.length - visibleItems.length)} {itemLabel.toLowerCase()}{filteredItems.length - visibleItems.length === 1 ? "" : "s"})</button>}
            </div>
          )}
        </main>
      </div>
    </ToolLayout>
  );
}
