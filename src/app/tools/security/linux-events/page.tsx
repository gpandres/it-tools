"use client";

import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LINUX_EVENTS_DB, LinuxEventType } from "@/lib/linux-events-db";

const TYPES: LinuxEventType[] = [
  "All",
  "System Logs",
  "Auditd",
  "Authentication",
  "File System"
];

export default function LinuxEventsLookup() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<LinuxEventType>("All");
  const [visibleLimit, setVisibleLimit] = useState(5);

  const filteredEvents = useMemo(() => {
    return LINUX_EVENTS_DB.filter(def => {
      if (filterType !== "All" && def.type !== filterType) return false;
      if (!search.trim()) return true;
      
      const term = search.toLowerCase();
      return def.id.toLowerCase().includes(term) || 
             def.name.toLowerCase().includes(term) || 
             def.description.toLowerCase().includes(term) ||
             def.maliciousUse.toLowerCase().includes(term);
    });
  }, [search, filterType]);

  const typeCounts = useMemo(() => Object.fromEntries(TYPES.map(type => [type, type === "All" ? LINUX_EVENTS_DB.length : LINUX_EVENTS_DB.filter(event => event.type === type).length])), []);
  const visibleEvents = filteredEvents.slice(0, visibleLimit);

  return (
    <ToolLayout
      title="Linux Telemetry Reference"
      description="Quickly search and reference Linux Logs and Auditd Records."
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
                placeholder="Search log, auditd..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black border-[#1a1a1a] focus:border-orange-400 text-zinc-300 font-mono"
              />
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-xs font-mono text-zinc-500">Log Type</label>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex items-center gap-2 text-left px-3 py-2 text-[11px] uppercase tracking-wider font-bold border transition-colors ${
                      filterType === type 
                      ? "bg-orange-400/10 border-orange-400/50 text-orange-400" 
                      : "bg-black border-[#1a1a1a] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    <span>{type === "All" ? "All Log Types" : type}</span>
                    <span className="ml-auto min-w-5 rounded border border-[#1a1a1a] px-1.5 py-0.5 text-center text-[9px] font-mono text-zinc-500">{typeCounts[type]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-orange-400 font-mono text-sm">
              Found {filteredEvents.length} log{filteredEvents.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredEvents.length === 0 ? (
              <div className="p-8 border border-[#1a1a1a] bg-[#050505] text-center flex flex-col items-center">
                <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 font-mono text-sm">No telemetry logs found matching your filters.</p>
              </div>
            ) : (
              visibleEvents.map((def) => {
                const Icon = def.icon;
                return (
                  <div key={def.id} className="group border border-[#1a1a1a] bg-[#050505] p-5 hover:border-orange-400/30 transition-colors">
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
                            {def.type}
                          </span>
                        </div>
                        
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                          {def.description}
                        </p>
                        
                        <div className="bg-black border border-zinc-800 p-3 mb-2 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                          <p className="text-zinc-300 text-xs font-mono ml-2">
                            <span className="text-orange-500 font-bold mr-2">Useful Fields:</span>
                            {def.fields.join(", ")}
                          </p>
                        </div>
                        
                        <div className="bg-red-900/10 border border-red-900/30 p-3 mb-3 relative overflow-hidden">
                          <p className="text-red-400 text-xs font-mono">
                            <span className="font-bold mr-2">Malicious Use:</span>
                            {def.maliciousUse}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center mr-1">Related MITRE:</span>
                          {def.mitre.map(m => (
                            <span key={m} className="px-2 py-0.5 bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 text-[10px] font-mono">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {visibleEvents.length < filteredEvents.length && (
              <button onClick={() => setVisibleLimit(limit => limit + 5)} className="w-full border border-orange-400/30 bg-orange-400/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-orange-400 transition-colors hover:border-orange-400 hover:bg-orange-400/10">
                Show more ({Math.min(5, filteredEvents.length - visibleEvents.length)} logs)
              </button>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
