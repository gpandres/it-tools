"use client";

import { Suspense, useState, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Plus, Trash2, Download, Upload, Copy, Check, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AclRule = {
  id: string;
  action: "permit" | "deny";
  protocol: "ip" | "tcp" | "udp" | "icmp";
  srcIp: string; // "any" or IP/CIDR
  dstIp: string;
  srcPort: string; // "any" or number
  dstPort: string;
  log: boolean;
};

// Helper: Convert CIDR to wildcard mask (for Cisco)
function cidrToWildcard(cidr: number): string {
  if (cidr < 0 || cidr > 32) return "0.0.0.0";
  const mask = ~((1 << (32 - cidr)) - 1);
  return [
    (~(mask >>> 24)) & 255,
    (~(mask >>> 16)) & 255,
    (~(mask >>> 8)) & 255,
    (~mask) & 255,
  ].join(".");
}

// Helper: format IP for Cisco
function formatCiscoIp(ipString: string): string {
  if (ipString.toLowerCase() === "any") return "any";
  if (ipString.includes("/")) {
    const [ip, cidrStr] = ipString.split("/");
    const cidr = parseInt(cidrStr, 10);
    if (cidr === 32) return `host ${ip}`;
    return `${ip} ${cidrToWildcard(cidr)}`;
  }
  return `host ${ipString}`;
}

function AclBuilderContent() {
  const [rules, setRules] = useState<AclRule[]>([]);
  const [activeTab, setActiveTab] = useState<"cisco" | "mikrotik" | "fortigate">("cisco");
  const [listName, setListName] = useState("MY_ACL");
  const [copied, setCopied] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const updateRule = (id: string, field: keyof AclRule, value: any) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const moveRuleTo = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newRules = [...rules];
    const [moved] = newRules.splice(fromIndex, 1);
    newRules.splice(toIndex, 0, moved);
    setRules(newRules);
  };

  const exportRules = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acl_rules_${listName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setRules(parsed);
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const generateCisco = () => {
    let out = `ip access-list extended ${listName}\n`;
    rules.forEach((r, idx) => {
      out += ` ${(idx + 1) * 10} ${r.action} ${r.protocol} ${formatCiscoIp(r.srcIp)}`;
      if (r.protocol === "tcp" || r.protocol === "udp") {
        if (r.srcPort.toLowerCase() !== "any") out += ` eq ${r.srcPort}`;
      }
      out += ` ${formatCiscoIp(r.dstIp)}`;
      if (r.protocol === "tcp" || r.protocol === "udp") {
        if (r.dstPort.toLowerCase() !== "any") out += ` eq ${r.dstPort}`;
      }
      if (r.log) out += ` log`;
      out += `\n`;
    });
    return out;
  };

  const generateMikrotik = () => {
    let out = "";
    rules.forEach((r) => {
      let line = `/ip firewall filter add chain=forward action=${r.action === "permit" ? "accept" : "drop"} protocol=${r.protocol}`;
      if (r.srcIp.toLowerCase() !== "any") line += ` src-address=${r.srcIp}`;
      if (r.dstIp.toLowerCase() !== "any") line += ` dst-address=${r.dstIp}`;
      if (r.protocol === "tcp" || r.protocol === "udp") {
        if (r.srcPort.toLowerCase() !== "any") line += ` src-port=${r.srcPort}`;
        if (r.dstPort.toLowerCase() !== "any") line += ` dst-port=${r.dstPort}`;
      }
      if (r.log) line += ` log=yes`;
      out += line + `\n`;
    });
    return out;
  };

  const generateFortigate = () => {
    let out = `config firewall policy\n`;
    rules.forEach((r, idx) => {
      out += `    edit ${idx + 1}\n`;
      out += `        set name "Rule_${idx + 1}"\n`;
      out += `        set srcintf "any"\n`;
      out += `        set dstintf "any"\n`;
      out += `        set srcaddr "${r.srcIp === "any" ? "all" : r.srcIp}"\n`;
      out += `        set dstaddr "${r.dstIp === "any" ? "all" : r.dstIp}"\n`;
      out += `        set action ${r.action === "permit" ? "accept" : "deny"}\n`;
      
      let service = "ALL";
      if (r.protocol === "tcp" && r.dstPort !== "any") service = `TCP_${r.dstPort}`;
      else if (r.protocol === "udp" && r.dstPort !== "any") service = `UDP_${r.dstPort}`;
      else if (r.protocol === "icmp") service = "ALL_ICMP";
      
      out += `        set service "${service}"\n`;
      out += `        set schedule "always"\n`;
      if (r.log) out += `        set logtraffic all\n`;
      out += `    next\n`;
    });
    out += `end`;
    return out;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatedOutput = 
    activeTab === "cisco" ? generateCisco() :
    activeTab === "mikrotik" ? generateMikrotik() :
    generateFortigate();

  return (
    <div className="space-y-6">
      {/* Controls & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0a] border border-[#1a1a1a] p-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">ACL Name:</label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={addRule} className="bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20 hover:border-[#00ff9c] rounded-none text-xs h-9 uppercase tracking-wider flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-1" /> Add Rule
          </Button>
          <div className="h-6 w-px bg-[#1a1a1a] hidden sm:block"></div>
          <input type="file" accept=".json" ref={fileInputRef} onChange={importRules} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-none border-[#1a1a1a] bg-black text-zinc-400 hover:text-white h-9">
            <Upload className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={exportRules} disabled={rules.length === 0} className="rounded-none border-[#1a1a1a] bg-black text-zinc-400 hover:text-white h-9">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Rule List */}
      <div className="space-y-2">
        {rules.length === 0 ? (
          <div className="border border-[#1a1a1a] border-dashed p-12 text-center text-zinc-600 font-mono text-sm bg-black/50">
            No rules defined. Click "Add Rule" or import a JSON file.
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div 
              key={rule.id} 
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveRuleTo(dragIndex, idx);
                setDragIndex(null);
              }}
              className={`border border-[#1a1a1a] bg-black p-3 flex flex-col xl:flex-row gap-3 xl:items-center relative group opacity-${dragIndex === idx ? '50' : '100'}`}
            >
              <div className="hidden xl:flex items-center justify-center w-6 text-zinc-600 hover:text-zinc-400 cursor-move cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="hidden xl:flex items-center justify-center w-6 text-zinc-600 font-mono text-xs">{idx + 1}</div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 xl:flex flex-1 gap-2">
                <select value={rule.action} onChange={(e) => updateRule(rule.id, "action", e.target.value)} className="bg-[#050505] border border-[#1a1a1a] text-sm font-bold uppercase p-2 focus:border-[#00ff9c] focus:outline-none w-full xl:w-24 text-center data-[state=permit]:text-[#00ff9c] data-[state=deny]:text-red-500" data-state={rule.action}>
                  <option value="permit">Permit</option>
                  <option value="deny">Deny</option>
                </select>

                <select value={rule.protocol} onChange={(e) => updateRule(rule.id, "protocol", e.target.value)} className="bg-[#050505] border border-[#1a1a1a] text-zinc-300 text-sm font-mono p-2 focus:border-[#00ff9c] focus:outline-none w-full xl:w-24 uppercase">
                  <option value="ip">IP</option>
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="icmp">ICMP</option>
                </select>

                <div className="flex gap-2 col-span-2 xl:col-span-1 xl:flex-1">
                  <input type="text" value={rule.srcIp} onChange={(e) => updateRule(rule.id, "srcIp", e.target.value)} placeholder="Src IP (any or CIDR)" className="bg-[#050505] border border-[#1a1a1a] text-[#00ff9c] text-sm font-mono p-2 focus:border-[#00ff9c] focus:outline-none w-full" spellCheck={false} />
                  {(rule.protocol === "tcp" || rule.protocol === "udp") && (
                    <input type="text" value={rule.srcPort} onChange={(e) => updateRule(rule.id, "srcPort", e.target.value)} placeholder="Src Port" className="bg-[#050505] border border-[#1a1a1a] text-zinc-300 text-sm font-mono p-2 focus:border-[#00ff9c] focus:outline-none w-24 shrink-0" />
                  )}
                </div>

                <div className="hidden xl:flex items-center text-zinc-600 px-2 font-bold">-&gt;</div>

                <div className="flex gap-2 col-span-2 xl:col-span-1 xl:flex-1">
                  <input type="text" value={rule.dstIp} onChange={(e) => updateRule(rule.id, "dstIp", e.target.value)} placeholder="Dst IP (any or CIDR)" className="bg-[#050505] border border-[#1a1a1a] text-[#00ff9c] text-sm font-mono p-2 focus:border-[#00ff9c] focus:outline-none w-full" spellCheck={false} />
                  {(rule.protocol === "tcp" || rule.protocol === "udp") && (
                    <input type="text" value={rule.dstPort} onChange={(e) => updateRule(rule.id, "dstPort", e.target.value)} placeholder="Dst Port" className="bg-[#050505] border border-[#1a1a1a] text-zinc-300 text-sm font-mono p-2 focus:border-[#00ff9c] focus:outline-none w-24 shrink-0" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#1a1a1a] pt-3 xl:border-0 xl:pt-0 mt-1 xl:mt-0">
                <label className="flex items-center gap-2 mr-2 cursor-pointer">
                  <input type="checkbox" checked={rule.log} onChange={(e) => updateRule(rule.id, "log", e.target.checked)} className="accent-[#00ff9c]" />
                  <span className="text-xs font-mono text-zinc-500">LOG</span>
                </label>
                <div className="flex xl:hidden cursor-move text-zinc-600 hover:text-zinc-400 p-2">
                  <GripVertical className="w-4 h-4" />
                </div>
                <button onClick={() => removeRule(rule.id)} className="text-zinc-600 hover:text-red-500 p-2 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Output Section */}
      {rules.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex border-b border-[#1a1a1a] gap-1 overflow-x-auto no-scrollbar">
            {(["cisco", "mikrotik", "fortigate"] as const).map((vendor) => (
              <button
                key={vendor}
                onClick={() => setActiveTab(vendor)}
                className={`
                  px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors
                  ${activeTab === vendor 
                    ? "text-[#00ff9c] border-b-2 border-[#00ff9c]" 
                    : "text-zinc-500 hover:text-zinc-300"}
                `}
              >
                {vendor}
              </button>
            ))}
          </div>
          <div className="relative group border border-[#1a1a1a] border-t-0">
            <pre className="p-6 bg-[#050505] text-[#00ff9c] font-mono text-sm overflow-x-auto whitespace-pre h-64 overflow-y-auto">
              {generatedOutput}
            </pre>
            
            <button
              onClick={() => handleCopy(generatedOutput)}
              className="absolute top-4 right-4 bg-[#1a1a1a] text-zinc-400 hover:text-[#00ff9c] px-3 py-1 text-xs uppercase tracking-wider transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
            >
              {copied ? <><Check className="w-3 h-3"/> Copied</> : <><Copy className="w-3 h-3"/> Copy</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AclBuilderTool() {
  return (
    <ToolLayout
      title="Universal ACL & Policy Builder"
      description="Create platform-agnostic firewall rules and instantly compile them into Cisco IOS, MikroTik RouterOS, or FortiOS syntax. Uses local browser storage."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <AclBuilderContent />
      </Suspense>
    </ToolLayout>
  );
}
