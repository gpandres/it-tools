"use client";

import { Suspense, useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { useNotification } from "@/components/notification-provider";
import { COMMAND_DB, COMMAND_VENDORS } from "@/lib/network-command-catalog";
import { Search, Server, Shield, Activity, Share2, FileText, ChevronRight, Network, Check } from "lucide-react";

function CommandReferenceContent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [copiedCommandKey, setCopiedCommandKey] = useState<string | null>(null);
  const { notify } = useNotification();

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

  const copyCommand = async (command: string | undefined, vendorLabel: string, copyKey: string) => {
    if (!command) return;

    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommandKey(copyKey);
      notify(`${vendorLabel} command copied.`);
      window.setTimeout(() => setCopiedCommandKey(current => current === copyKey ? null : current), 1800);
    } catch {
      notify("Clipboard access is unavailable in this browser.", "error");
    }
  };

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
                  {cmd.category === "Discovery" && <Network className="w-4 h-4" />}
                  {cmd.category === "Services" && <Server className="w-4 h-4" />}
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

              <div className="grid grid-cols-1 gap-px bg-[#1a1a1a] sm:grid-cols-2 xl:grid-cols-3">
                {COMMAND_VENDORS.map(vendor => (
                  <div key={vendor.id} className="group flex min-w-0 flex-col bg-[#050505] p-4 transition-colors hover:bg-[#00ff9c]/5">
                    <span className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <ChevronRight className="h-3 w-3 text-[#00ff9c] opacity-0 transition-opacity group-hover:opacity-100" />
                      <span>{vendor.label}</span>
                      {copiedCommandKey === `${cmd.id}:${vendor.id}` && <span className="ml-auto flex items-center gap-1 text-[#00ff9c]" aria-live="polite"><Check className="h-3 w-3" aria-hidden="true" />Copied</span>}
                    </span>
                    <button
                      type="button"
                      onDoubleClick={() => copyCommand(cmd.vendors[vendor.id], vendor.label, `${cmd.id}:${vendor.id}`)}
                      disabled={!cmd.vendors[vendor.id]}
                      title={cmd.vendors[vendor.id] ? "Double-click to copy command" : "No command available for this vendor"}
                      aria-label={cmd.vendors[vendor.id] ? `Double-click to copy ${vendor.label} command` : `No ${vendor.label} command available`}
                      className={`min-w-0 flex-1 cursor-copy rounded-sm border border-transparent p-1 text-left transition-colors focus-visible:border-[#00ff9c] focus-visible:outline-none disabled:cursor-default ${copiedCommandKey === `${cmd.id}:${vendor.id}` ? "bg-[#00ff9c]/10 text-[#9fffd1]" : "hover:border-[#176b52]"}`}
                    >
                      <code className="block min-w-0 whitespace-pre-wrap break-words font-mono text-sm text-zinc-300">{cmd.vendors[vendor.id] || "-"}</code>
                    </button>
                  </div>
                ))}
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
      description="Translate operational intents into CLI commands for Cisco, MikroTik, FortiGate, Linux, Juniper, and Arista."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading database...</div>}>
        <CommandReferenceContent />
      </Suspense>
    </ToolLayout>
  );
}
