"use client";

import { Suspense, useState, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { isIpInNetwork } from "@/lib/network";
import { Plus, Trash2, Upload, Play, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AclRule } from "../acl-builder/page";

function AclSimulatorContent() {
  const [rules, setRules] = useState<AclRule[]>([]);
  
  // Simulated Packet
  const [pktSrcIp, setPktSrcIp] = useState("192.168.1.50");
  const [pktDstIp, setPktDstIp] = useState("10.0.0.5");
  const [pktProtocol, setPktProtocol] = useState<"tcp"|"udp"|"icmp"|"ip">("tcp");
  const [pktSrcPort, setPktSrcPort] = useState("54321");
  const [pktDstPort, setPktDstPort] = useState("443");

  const [simulationResult, setSimulationResult] = useState<{
    matched: boolean;
    ruleIndex: number;
    action: "permit" | "deny";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const importRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setRules(parsed);
          setSimulationResult(null);
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const addRule = () => {
    setRules([...rules, {
      id: crypto.randomUUID(),
      action: "permit",
      protocol: "ip",
      srcIp: "any",
      dstIp: "any",
      srcPort: "any",
      dstPort: "any",
      log: false
    }]);
    setSimulationResult(null);
  };

  const updateRule = (id: string, field: keyof AclRule, value: any) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    setSimulationResult(null);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setSimulationResult(null);
  };

  const simulatePacket = () => {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      let match = true;

      // Protocol match
      if (r.protocol !== "ip" && r.protocol !== pktProtocol) {
        match = false;
      }

      // IP match
      if (match && !isIpInNetwork(pktSrcIp, r.srcIp)) match = false;
      if (match && !isIpInNetwork(pktDstIp, r.dstIp)) match = false;

      // Port match
      if (match && (r.protocol === "tcp" || r.protocol === "udp")) {
        if (r.srcPort !== "any" && r.srcPort !== pktSrcPort) match = false;
        if (r.dstPort !== "any" && r.dstPort !== pktDstPort) match = false;
      }

      if (match) {
        setSimulationResult({
          matched: true,
          ruleIndex: i,
          action: r.action,
          message: `Packet matched Rule #${i + 1}. Action: ${r.action.toUpperCase()}`
        });
        return;
      }
    }

    // Implicit Deny
    setSimulationResult({
      matched: false,
      ruleIndex: -1,
      action: "deny",
      message: "Packet dropped by Default Implicit Deny (no rules matched)."
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Rules */}
      <div className="lg:col-span-8 border border-[#1a1a1a] bg-[#050505] flex flex-col h-fit">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Firewall Rules (Top-Down)</span>
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".json" ref={fileInputRef} onChange={importRules} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-xs bg-black border-[#1a1a1a] text-zinc-400">
              <Upload className="w-3 h-3 mr-1" /> Import JSON
            </Button>
            <Button size="sm" onClick={addRule} className="h-7 text-xs bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20">
              <Plus className="w-3 h-3 mr-1" /> Add Rule
            </Button>
          </div>
        </header>

        <div className="p-4 space-y-2 overflow-x-auto">
          {rules.length === 0 ? (
            <div className="text-center p-8 text-zinc-600 font-mono text-sm border border-dashed border-[#1a1a1a]">
              No rules defined. Import from Universal ACL Builder or add manually.
            </div>
          ) : (
            rules.map((rule, idx) => {
              const isMatched = simulationResult?.ruleIndex === idx;
              return (
                <div key={rule.id} className={`flex items-center gap-2 p-2 border font-mono text-sm min-w-[700px] transition-colors ${isMatched ? (rule.action === "permit" ? "bg-[#00ff9c]/20 border-[#00ff9c]" : "bg-red-500/20 border-red-500") : "bg-black border-[#1a1a1a]"}`}>
                  <div className="w-6 text-zinc-600 text-center text-xs">{idx + 1}</div>
                  <select value={rule.action} onChange={(e) => updateRule(rule.id, "action", e.target.value)} className={`bg-transparent p-1 focus:outline-none font-bold uppercase ${rule.action === "permit" ? "text-[#00ff9c]" : "text-red-500"}`}>
                    <option value="permit">Permit</option>
                    <option value="deny">Deny</option>
                  </select>
                  <select value={rule.protocol} onChange={(e) => updateRule(rule.id, "protocol", e.target.value)} className="bg-transparent text-zinc-300 p-1 focus:outline-none uppercase w-20">
                    <option value="ip">IP</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                  </select>
                  <input type="text" value={rule.srcIp} onChange={(e) => updateRule(rule.id, "srcIp", e.target.value)} className="bg-[#1a1a1a] text-[#00ff9c] px-2 py-1 w-32 focus:outline-none" placeholder="Src IP" />
                  {(rule.protocol === "tcp" || rule.protocol === "udp") && (
                    <input type="text" value={rule.srcPort} onChange={(e) => updateRule(rule.id, "srcPort", e.target.value)} className="bg-[#1a1a1a] text-zinc-300 px-2 py-1 w-16 focus:outline-none" placeholder="Port" />
                  )}
                  <span className="text-zinc-600">-&gt;</span>
                  <input type="text" value={rule.dstIp} onChange={(e) => updateRule(rule.id, "dstIp", e.target.value)} className="bg-[#1a1a1a] text-[#00ff9c] px-2 py-1 w-32 focus:outline-none" placeholder="Dst IP" />
                  {(rule.protocol === "tcp" || rule.protocol === "udp") && (
                    <input type="text" value={rule.dstPort} onChange={(e) => updateRule(rule.id, "dstPort", e.target.value)} className="bg-[#1a1a1a] text-zinc-300 px-2 py-1 w-16 focus:outline-none" placeholder="Port" />
                  )}
                  <div className="flex-1"></div>
                  <button onClick={() => removeRule(rule.id)} className="text-zinc-600 hover:text-red-500 px-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Packet & Result */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <article className="border border-[#1a1a1a] bg-[#050505]">
          <header className="px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Simulated Packet</span>
          </header>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-500">Protocol</label>
              <select value={pktProtocol} onChange={(e) => setPktProtocol(e.target.value as any)} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono uppercase focus:border-[#00ff9c] focus:outline-none">
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
                <option value="ip">Other IP</option>
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-mono text-zinc-500">Source IP</label>
                <input type="text" value={pktSrcIp} onChange={(e) => setPktSrcIp(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-500">Src Port</label>
                <input type="text" value={pktSrcPort} onChange={(e) => setPktSrcPort(e.target.value)} disabled={pktProtocol !== "tcp" && pktProtocol !== "udp"} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none disabled:opacity-30" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-mono text-zinc-500">Dest IP</label>
                <input type="text" value={pktDstIp} onChange={(e) => setPktDstIp(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-500">Dst Port</label>
                <input type="text" value={pktDstPort} onChange={(e) => setPktDstPort(e.target.value)} disabled={pktProtocol !== "tcp" && pktProtocol !== "udp"} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none disabled:opacity-30" />
              </div>
            </div>

            <Button onClick={simulatePacket} className="w-full bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20 hover:border-[#00ff9c] rounded-none font-mono uppercase tracking-widest mt-4">
              <Play className="w-4 h-4 mr-2" />
              Inject Packet
            </Button>
          </div>
        </article>

        {/* Result Area */}
        {simulationResult && (
          <div className={`p-4 border animate-in fade-in zoom-in-95 ${simulationResult.action === "permit" ? "bg-[#00ff9c]/10 border-[#00ff9c]/50 text-[#00ff9c]" : "bg-red-500/10 border-red-500/50 text-red-500"}`}>
            <div className="flex items-center gap-3 mb-2">
              {simulationResult.action === "permit" ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              <span className="font-bold uppercase tracking-widest text-lg">
                Packet {simulationResult.action === "permit" ? "Allowed" : "Dropped"}
              </span>
            </div>
            <p className="font-mono text-sm opacity-80 mt-2">
              {simulationResult.message}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default function AclSimulatorTool() {
  return (
    <ToolLayout
      title="Firewall ACL Simulator"
      description="Inject a virtual packet against a top-down list of ACL rules to see exactly which rule allows or drops it. 100% offline."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <AclSimulatorContent />
      </Suspense>
    </ToolLayout>
  );
}
