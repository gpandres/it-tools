"use client";

import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { 
  Search, ExternalLink, LogIn, Terminal, Anchor, ArrowUpCircle, 
  ShieldOff, Key, Search as SearchIcon, MoveHorizontal, 
  Archive, Radio, UploadCloud, AlertTriangle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MITRE_DB, Tactic } from "@/lib/mitre-db";

const TACTICS: Tactic[] = [
  "All",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Lateral Movement",
  "Command and Control",
  "Impact"
];

export default function MitreLookup() {
  const [search, setSearch] = useState("");
  const [filterTactic, setFilterTactic] = useState<Tactic>("All");

  const filteredMitre = useMemo(() => {
    return MITRE_DB.filter(def => {
      if (filterTactic !== "All" && def.tactic !== filterTactic) return false;
      if (!search.trim()) return true;
      
      const term = search.toLowerCase();
      return def.id.toLowerCase().includes(term) || 
             def.name.toLowerCase().includes(term) || 
             def.description.toLowerCase().includes(term) ||
             def.tactic.toLowerCase().includes(term);
    });
  }, [search, filterTactic]);

  return (
    <ToolLayout
      title="MITRE ATT&CK Reference"
      description="Quickly search and reference common MITRE ATT&CK tactics, techniques, and procedures (TTPs)."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
        
        {/* Filters Panel */}
        <div className="lg:col-span-3 space-y-6">
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
            
            <a 
              href="https://attack.mitre.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1a1a1a] text-zinc-300 hover:bg-[#2a2a2a] hover:text-white transition-colors border border-zinc-800 text-xs font-bold uppercase tracking-widest"
            >
              View Full Matrix <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-[#00ff9c] font-mono text-sm">
              Found {filteredMitre.length} technique{filteredMitre.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMitre.length === 0 ? (
              <div className="p-8 border border-[#1a1a1a] bg-[#050505] text-center flex flex-col items-center">
                <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 font-mono text-sm mb-4">No techniques found matching your filters.</p>
                {search.trim().toLowerCase().match(/^t\d{4}(\.\d{3})?$/) && (
                  <a
                    href={`https://attack.mitre.org/techniques/${search.trim().toUpperCase().split('.')[0]}`}
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
                return (
                  <div key={def.id} className="group border border-[#1a1a1a] bg-[#050505] p-5 hover:border-[#00ff9c]/30 transition-colors">
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
                      
                      <a 
                        href={`https://attack.mitre.org/techniques/${def.id.split('.')[0]}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-600 hover:text-[#00ff9c] transition-colors shrink-0"
                        title="View on MITRE website"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
