"use client";

import { Suspense, useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { useNotification } from "@/components/notification-provider";
import { COMMAND_DB, COMMAND_VENDORS } from "@/lib/network-command-catalog";
import { Search, Server, Shield, Activity, Share2, FileText, ChevronRight, Network, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ToolPanel,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolPanelBody,
  ToolField,
  ToolStatus,
  ToolStatGrid,
  ToolBadge
} from "@/components/tool-design";

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
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
      
      {/* Search Header */}
      <ToolPanel>
        <ToolPanelHeader>
          <ToolPanelTitle marker="IN" className="text-[#ffb000] glow-amber">SEARCH COMMANDS</ToolPanelTitle>
        </ToolPanelHeader>
        <ToolPanelBody className="space-y-6">
          <ToolField htmlFor="search" label="Search intent, concept, or command">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-500" />
              <Input
                id="search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'routing table', 'nat', 'ospf'"
                className="pl-9 font-mono h-12 rounded-none border-[#1a1a1a] bg-black text-[#00ff9c] focus-visible:ring-[#00ff9c]"
                spellCheck={false}
              />
            </div>
          </ToolField>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={`h-7 rounded-none px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                  activeCategory === cat 
                    ? "bg-[#00ff9c]/10 border-[#00ff9c]/50 text-[#00ff9c] hover:bg-[#00ff9c]/20 hover:text-[#00ff9c]" 
                    : "bg-black border-[#1a1a1a] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </ToolPanelBody>
      </ToolPanel>

      {/* Results */}
      <div className="space-y-6">
        {filteredCommands.length === 0 ? (
          <ToolStatus tone="neutral">
            No commands found matching "{query}"
          </ToolStatus>
        ) : (
          filteredCommands.map((cmd) => (
            <ToolPanel key={cmd.id}>
              <ToolPanelHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-[#00ff9c]">
                    {cmd.category === "Routing" && <Share2 className="w-4 h-4" />}
                    {cmd.category === "Interfaces" && <Server className="w-4 h-4" />}
                    {cmd.category === "Firewall & NAT" && <Shield className="w-4 h-4" />}
                    {cmd.category === "Diagnostics" && <Activity className="w-4 h-4" />}
                    {cmd.category === "System" && <FileText className="w-4 h-4" />}
                    {cmd.category === "Discovery" && <Network className="w-4 h-4" />}
                    {cmd.category === "Services" && <Server className="w-4 h-4" />}
                  </div>
                  <div>
                    <ToolPanelTitle className="text-sm normal-case tracking-normal">{cmd.intent}</ToolPanelTitle>
                  </div>
                </div>
                <div className="flex gap-2">
                  {cmd.keywords.slice(0, 3).map(k => (
                    <ToolBadge key={k} tone="neutral">#{k}</ToolBadge>
                  ))}
                </div>
              </ToolPanelHeader>

              <ToolStatGrid className="sm:grid-cols-2 xl:grid-cols-3">
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
              </ToolStatGrid>
            </ToolPanel>
          ))
        )}
      </div>

    </div>
  );
}

export default function CommandReferenceTool() {
  return (
    <ToolLayout
      title="CROSS-VENDOR COMMAND REFERENCE"
      description="Translate operational intents into CLI commands for Cisco, MikroTik, FortiGate, Linux, Juniper, and Arista."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading database...</div>}>
        <CommandReferenceContent />
      </Suspense>
    </ToolLayout>
  );
}
