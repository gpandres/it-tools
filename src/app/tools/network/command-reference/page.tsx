"use client";

import { Suspense, useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { COMMAND_DB } from "@/lib/network-command-catalog";
import { Search, Server, Shield, Activity, Share2, FileText, ChevronRight } from "lucide-react";

function CommandReferenceContent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(COMMAND_DB.map(c => c.category)))];

  const filteredCommands = useMemo(() => {
    let filtered = COMMAND_DB;

    if (activeCategory !== "All") {
      filtered = filtered.filter(c => c.category === activeCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(c => 
        c.intent.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.keywords.some(k => k.includes(q)) ||
        Object.values(c.vendors).some(v => v?.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [query, activeCategory]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search Header */}
      <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search intent, concept, or command (e.g. 'routing table', 'nat', 'ospf')"
            className="w-full bg-black border border-[#1a1a1a] p-4 pl-12 text-[#00ff9c] font-mono text-lg focus:border-[#00ff9c] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
                activeCategory === cat 
                  ? "bg-[#00ff9c]/10 border-[#00ff9c]/50 text-[#00ff9c]" 
                  : "bg-black border-[#1a1a1a] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {filteredCommands.length === 0 ? (
          <div className="text-center p-12 border border-[#1a1a1a] bg-[#050505] text-zinc-500 font-mono text-sm">
            No commands found matching "{query}"
          </div>
        ) : (
          filteredCommands.map((cmd) => (
            <div key={cmd.id} className="border border-[#1a1a1a] bg-[#050505] overflow-hidden">
              <header className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center gap-3">
                <div className="p-2 bg-[#00ff9c]/10 text-[#00ff9c] rounded-sm">
                  {cmd.category === "Routing" && <Share2 className="w-4 h-4" />}
                  {cmd.category === "Interfaces" && <Server className="w-4 h-4" />}
                  {cmd.category === "Firewall & NAT" && <Shield className="w-4 h-4" />}
                  {cmd.category === "Diagnostics" && <Activity className="w-4 h-4" />}
                  {cmd.category === "System" && <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-[#00ff9c] font-bold tracking-wide">{cmd.intent}</h3>
                  <div className="flex gap-2 mt-1">
                    {cmd.keywords.slice(0, 3).map(k => (
                      <span key={k} className="text-[10px] text-zinc-500 font-mono uppercase bg-black px-1 border border-[#1a1a1a]">#{k}</span>
                    ))}
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]">
                
                {/* Cisco */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    Cisco IOS
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.cisco || "-"}</code>
                </div>

                {/* MikroTik */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    MikroTik RouterOS
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.mikrotik || "-"}</code>
                </div>

                {/* FortiGate */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    FortiGate
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.fortigate || "-"}</code>
                </div>

                {/* Linux */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    Linux (iproute2/etc)
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.linux || "-"}</code>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default function CommandReferenceTool() {
  return (
    <ToolLayout
      title="Cross-Vendor Command Reference"
      description="Translate operational intents into the exact CLI commands for Cisco, MikroTik, FortiGate, and Linux."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading database...</div>}>
        <CommandReferenceContent />
      </Suspense>
    </ToolLayout>
  );
}
