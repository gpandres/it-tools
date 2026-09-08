"use client";

import { useState, useMemo, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Search, ExternalLink, Grid3X3, XCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { hasMitreTactic, MITRE_DB, MITRE_VERSION, Tactic, MitreDef } from "@/lib/mitre-db";

const TACTICS: Tactic[] = [
  "All",
  "Reconnaissance",
  "Resource Development",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Stealth",
  "Defense Impairment",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Exfiltration",
  "Impact"
];

const TACTIC_COLORS: Record<string, string> = {
  "Reconnaissance": "text-sky-400 border-sky-400/40 bg-sky-400/10",
  "Resource Development": "text-violet-400 border-violet-400/40 bg-violet-400/10",
  "Initial Access": "text-blue-400 border-blue-400/40 bg-blue-400/10",
  "Execution": "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  "Persistence": "text-purple-400 border-purple-400/40 bg-purple-400/10",
  "Privilege Escalation": "text-amber-400 border-amber-400/40 bg-amber-400/10",
  "Stealth": "text-red-300 border-red-300/40 bg-red-300/10",
  "Defense Impairment": "text-red-500 border-red-500/40 bg-red-500/10",
  "Credential Access": "text-pink-400 border-pink-400/40 bg-pink-400/10",
  "Discovery": "text-teal-400 border-teal-400/40 bg-teal-400/10",
  "Lateral Movement": "text-indigo-400 border-indigo-400/40 bg-indigo-400/10",
  "Collection": "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  "Command and Control": "text-orange-400 border-orange-400/40 bg-orange-400/10",
  "Exfiltration": "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  "Impact": "text-rose-500 border-rose-500/40 bg-rose-500/10",
};

function mitreHref(id: string): string {
  const [technique, subTechnique] = id.split(".");
  return subTechnique
    ? `https://attack.mitre.org/techniques/${technique}/${subTechnique}/`
    : `https://attack.mitre.org/techniques/${technique}/`;
}

function parentIdFor(def: MitreDef): string | undefined {
  return def.parentId ?? (def.id.includes(".") ? def.id.split(".")[0] : undefined);
}

function hasLocalParent(def: MitreDef): boolean {
  const parentId = parentIdFor(def);
  return Boolean(parentId && MITRE_DB.some(parent => parent.id === parentId));
}

export default function MitreLookup() {
  const [search, setSearch] = useState("");
  const [filterTactic, setFilterTactic] = useState<Tactic>("All");
  const [view, setView] = useState<"reference" | "matrix">("reference");
  const tacticRefs = useRef<Record<string, HTMLElement | null>>({});
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  const [modalTechnique, setModalTechnique] = useState<MitreDef | null>(null);

  const focusTactic = (tactic: Tactic) => {
    setFilterTactic(tactic);
    if (tactic !== "All") {
      window.requestAnimationFrame(() => tacticRefs.current[tactic]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
    }
  };

  const filteredMitre = useMemo(() => {
    return MITRE_DB.filter(def => {
      if (hasLocalParent(def)) return false;
      if (filterTactic !== "All" && !hasMitreTactic(def, filterTactic)) return false;
      if (!search.trim()) return true;
      
      const term = search.toLowerCase();
      return def.id.toLowerCase().includes(term) || 
             def.name.toLowerCase().includes(term) || 
             def.description.toLowerCase().includes(term) ||
             def.tactic.toLowerCase().includes(term);
    });
  }, [search, filterTactic]);

  const matrixColumns = useMemo(() => TACTICS.filter((tactic): tactic is Exclude<Tactic, "All"> => tactic !== "All").map((tactic) => ({
    tactic,
    techniques: MITRE_DB.filter((def) => hasMitreTactic(def, tactic) && !hasLocalParent(def) && (
      !search.trim() || `${def.id} ${def.name} ${def.description}`.toLowerCase().includes(search.toLowerCase())
    )),
  })), [search]);

  return (
    <ToolLayout
      title="MITRE ATT&CK Reference"
      description={`Quickly search and reference MITRE ATT&CK tactics, techniques, and procedures (TTPs). Enterprise v${MITRE_VERSION}.`}
      fullWidth={view === "matrix"}
    >
      <div className={`grid grid-cols-1 gap-6 ${view === "matrix" ? "w-full max-w-none mitre-matrix" : "lg:grid-cols-12 max-w-6xl"} mx-auto`}>
        
        {/* Filters Panel */}
        <div className={`${view === "matrix" ? "hidden" : "lg:col-span-3"} space-y-6`}>
          <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">
              Filters
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search T-code, technique..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black border-[#1a1a1a] focus:border-[#00ff9c] text-zinc-300 font-mono"
              />
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-xs font-mono text-zinc-500">Tactic Phase</label>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {TACTICS.map(tactic => (
                  <button
                    key={tactic}
                    onClick={() => setFilterTactic(tactic)}
                    className={`text-left px-3 py-2 text-[11px] uppercase tracking-wider font-bold border transition-colors ${
                      filterTactic === tactic 
                      ? "bg-[#00ff9c]/10 border-[#00ff9c]/50 text-[#00ff9c]" 
                      : "bg-black border-[#1a1a1a] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    {tactic === "All" ? "All Tactics" : tactic}
                  </button>
                ))}
              </div>
            </div>
            
            <button onClick={() => setView("matrix")} className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1a1a1a] text-zinc-300 hover:bg-[#2a2a2a] hover:text-white transition-colors border border-zinc-800 text-xs font-bold uppercase tracking-widest">
              Open Local Matrix <Grid3X3 className="w-3 h-3" />
            </button>
            <a href="https://attack.mitre.org/matrices/enterprise/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 hover:text-[#00ff9c]">
              Official MITRE matrix <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Results Panel */}
        <div className={`${view === "matrix" ? "order-1 min-w-0" : "lg:col-span-9"} space-y-4`}>
          <div className="flex justify-between items-end mb-4 gap-4">
            <h2 className="text-[#00ff9c] font-mono text-sm">
              {view === "matrix" ? "Enterprise technique matrix" : <>Found {filteredMitre.length} technique{filteredMitre.length !== 1 ? 's' : ''}</>}
            </h2>
            <div className="flex border border-[#1a1a1a] bg-[#050505]">
              <button onClick={() => setView("reference")} className={`px-3 py-2 text-[10px] uppercase tracking-wider ${view === "reference" ? "text-[#00ff9c] bg-[#00ff9c]/10" : "text-zinc-500"}`}>Reference</button>
              <button onClick={() => setView("matrix")} className={`px-3 py-2 text-[10px] uppercase tracking-wider ${view === "matrix" ? "text-[#00ff9c] bg-[#00ff9c]/10" : "text-zinc-500"}`}>Matrix</button>
            </div>
          </div>

          {view === "matrix" ? (
            <>
              <div className="border border-[#1a1a1a] bg-[#050505] p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest shrink-0">Filters</label>
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search technique or T-code..." className="h-8 bg-black border-[#1a1a1a] text-xs font-mono focus:border-[#00ff9c]" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {TACTICS.map((tactic) => (
                    <button key={tactic} aria-pressed={filterTactic === tactic} onClick={() => focusTactic(tactic)} className={`shrink-0 px-3 py-2 border text-[10px] uppercase tracking-wider font-bold transition-colors ${filterTactic === tactic ? `${TACTIC_COLORS[tactic] ?? "text-[#00ff9c] border-[#00ff9c]/40 bg-[#00ff9c]/10"} shadow-[0_0_12px_rgba(0,255,156,0.15)]` : "border-[#1a1a1a] text-zinc-600 hover:text-zinc-300 hover:border-zinc-700"}`}>
                      {tactic === "All" ? "All" : tactic}
                    </button>
                  ))}
                </div>
              </div>
              <div role="region" aria-label="MITRE technique matrix" tabIndex={0} className="min-w-0 border border-[#1a1a1a] bg-[#050505] p-3 overflow-x-auto">
              <div className="grid w-full items-start gap-2" style={{ gridTemplateColumns: `repeat(${matrixColumns.length}, minmax(8rem, 1fr))` }}>
                {matrixColumns.map(({ tactic, techniques }) => {
                  const isFocused = filterTactic === "All" || filterTactic === tactic;
                  return <section key={tactic} ref={(node) => { tacticRefs.current[tactic] = node; }} className={`min-w-0 border bg-black transition-all duration-200 ${isFocused ? "border-[#00ff9c]/50 opacity-100" : "border-[#1a1a1a] opacity-30 grayscale"}`}>
                    <button onClick={() => { focusTactic(tactic); setView("reference"); }} className={`flex h-24 w-full flex-col justify-center p-3 text-left border-b border-[#1a1a1a] hover:bg-[#00ff9c]/5 ${TACTIC_COLORS[tactic] ?? "text-[#00ff9c]"}`}>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest break-words">{tactic}</h3>
                      <span className="mt-2 text-[10px] leading-snug text-zinc-500 font-mono">{techniques.length} local techniques</span>
                    </button>
                    <div className="p-2 space-y-2">
                      {techniques.map((def) => (
                        <button key={def.id} onClick={() => setModalTechnique(def)} className="text-left w-full min-w-0 overflow-hidden break-words border border-zinc-800 p-2 hover:border-[#00ff9c]/60 hover:bg-[#00ff9c]/5">
                          <span className="block text-[10px] font-mono text-[#00ff9c] whitespace-normal [overflow-wrap:anywhere]">{def.id}</span>
                          <span className="block text-[11px] text-zinc-300 leading-tight whitespace-normal [overflow-wrap:anywhere]">{def.name}</span>
                        </button>
                      ))}
                      {techniques.length === 0 && <p className="p-2 text-[10px] text-zinc-700 italic">Not curated locally yet.</p>}
                    </div>
                  </section>;
                })}
              </div>
              </div>
            </>
          ) : <div className="grid grid-cols-1 gap-4">
            {filteredMitre.length === 0 ? (
              <div className="p-8 border border-[#1a1a1a] bg-[#050505] text-center flex flex-col items-center">
                <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 font-mono text-sm mb-4">No techniques found matching your filters.</p>
                {search.trim().toLowerCase().match(/^t\d{4}(\.\d{3})?$/) && (
                  <a
                    href={mitreHref(search.trim().toUpperCase())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20 hover:border-[#00ff9c] transition-all font-mono text-xs uppercase tracking-widest"
                  >
                    Technique not in local DB. Search {search.trim().toUpperCase()} on MITRE website <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              filteredMitre.map((def) => {
                const Icon = def.icon;
                const subtechniques = MITRE_DB.filter(child => parentIdFor(child) === def.id);
                return (
                  <div key={def.id} onClick={() => setModalTechnique(def)} className="group border border-[#1a1a1a] bg-[#050505] p-4 hover:border-[#00ff9c]/30 transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-[#1a1a1a] rounded ${def.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <h3 className="text-lg font-bold text-zinc-200">
                            <span className={`${def.color} mr-2 font-mono`}>{def.id}</span>
                            {def.name}
                          </h3>
                          <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-black border border-[#1a1a1a] text-zinc-400 w-fit">
                            {def.tactic}
                          </span>
                        </div>
                        
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                          {def.description}
                        </p>
                        
                        <div className="bg-black border border-zinc-800 p-3 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffb000]"></div>
                          <p className="text-zinc-300 text-xs font-mono ml-2">
                            <span className="text-[#ffb000] font-bold mr-2">Example:</span>
                            {def.example}
                          </p>
                        </div>
                      </div>
                      
                      <a onClick={(event) => event.stopPropagation()}
                        href={mitreHref(def.id)}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-600 hover:text-[#00ff9c] transition-colors shrink-0"
                        title="View on MITRE website"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                    {subtechniques.length > 0 && <>
                      <button onClick={(event) => { event.stopPropagation(); setExpandedTechnique(expandedTechnique === def.id ? null : def.id); }} aria-expanded={expandedTechnique === def.id} className="mt-3 flex w-full items-center gap-2 border-t border-[#1a1a1a] pt-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#00ff9c] hover:text-white"><ChevronDown className={`h-3 w-3 transition-transform ${expandedTechnique === def.id ? 'rotate-180' : ''}`} /> {expandedTechnique === def.id ? 'Hide' : 'Show'} sub-techniques ({subtechniques.length})</button>
                      {expandedTechnique === def.id && <div className="mt-3 space-y-2 border-t border-[#1a1a1a] pt-3">
                        {subtechniques.map(child => <button key={child.id} onClick={(event) => { event.stopPropagation(); setModalTechnique(child); }} className="w-full border border-zinc-800 bg-black p-3 text-left hover:border-[#00ff9c]/50"><span className="font-mono text-[10px] text-[#00ff9c]">{child.id}</span><span className="ml-2 text-xs text-zinc-300">{child.name}</span><span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">{child.description}</span></button>)}
                      </div>}
                    </>}
                  </div>
                );
              })
            )}
          </div>}
        </div>
      </div>
      {modalTechnique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setModalTechnique(null)}>
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto border border-[#00ff9c]/30 bg-[#050505] p-6" onClick={event => event.stopPropagation()}>
            <button className="absolute right-4 top-4 text-zinc-500 hover:text-white" onClick={() => setModalTechnique(null)} aria-label="Close technique details"><XCircle className="w-5 h-5" /></button>
            <p className="font-mono text-sm text-[#00ff9c]">{modalTechnique.id}</p>
            <h2 className="mt-1 pr-8 text-xl font-bold text-zinc-200">{modalTechnique.name}</h2>
            <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">{modalTechnique.tactic} · {modalTechnique.platform} · ATT&CK v{MITRE_VERSION}</p>
            <p className="mt-5 text-sm leading-relaxed text-zinc-300">{modalTechnique.description}</p>
            <div className="mt-4 border border-[#1a1a1a] bg-black p-3 text-xs text-zinc-400"><span className="font-bold text-[#ffb000]">Example: </span>{modalTechnique.example}</div>
            <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-[#00ff9c]">Sub-techniques</h3>
            {MITRE_DB.filter(child => parentIdFor(child) === modalTechnique.id).length === 0 ? <p className="mt-2 text-xs text-zinc-600">No local sub-techniques recorded for this parent.</p> : <div className="mt-2 space-y-2">{MITRE_DB.filter(child => parentIdFor(child) === modalTechnique.id).map(child => <button key={child.id} onClick={() => setModalTechnique(child)} className="w-full border border-[#1a1a1a] bg-black p-3 text-left hover:border-[#00ff9c]/50"><span className="font-mono text-xs text-[#00ff9c]">{child.id}</span><span className="mt-1 block text-xs text-zinc-300">{child.name}</span><span className="mt-2 block text-[11px] leading-relaxed text-zinc-500">{child.description}</span><span className="mt-2 block text-[10px] text-[#ffb000]">Example: {child.example}</span></button>)}</div>}
            <a href={mitreHref(modalTechnique.id)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-[#00ff9c]">Open official MITRE page <ExternalLink className="w-3 h-3" /></a>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
