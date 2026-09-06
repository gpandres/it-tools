"use client";

import { ToolLayout } from "@/components/tool-layout";
import { useToolUrlState } from "@/hooks/use-tool-state";
import { calculateSubnet, validateIp } from "@/lib/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { Suspense, useState, useMemo } from "react";

function SubnetCalculatorContent() {
  const [state, setState] = useToolUrlState({ ip: "192.168.1.0", cidr: "24" });
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const isValidIp = validateIp(state.ip);
  const cidrNum = parseInt(state.cidr, 10);
  const isValidCidr = !isNaN(cidrNum) && cidrNum >= 0 && cidrNum <= 32;

  const result = useMemo(() => {
    if (isValidIp && isValidCidr) {
      return calculateSubnet(state.ip, cidrNum);
    }
    return null;
  }, [state.ip, cidrNum, isValidIp, isValidCidr]);

  return (
    <ToolLayout 
      title="Subnetting Calculator" 
      description="Calculate network address, broadcast, host range, and wildcard mask from an IP and CIDR."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="border border-[#1a1a1a] bg-[#050505]">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN]</span>
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Input Config</span>
          </header>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ip" className="text-zinc-500 font-mono text-xs uppercase tracking-wider">IP Address</Label>
              <Input
                id="ip"
                value={state.ip}
                onChange={(e) => setState({ ip: e.target.value })}
                className={`font-mono bg-black border-[#1a1a1a] text-zinc-300 rounded-none focus-visible:ring-[#00ff9c] ${!isValidIp && state.ip ? "border-red-500 text-red-400 focus-visible:ring-red-500" : ""}`}
                placeholder="192.168.1.0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cidr" className="text-zinc-500 font-mono text-xs uppercase tracking-wider">CIDR Prefix (/{state.cidr})</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="cidr"
                  type="range"
                  min="0"
                  max="32"
                  value={state.cidr}
                  onChange={(e) => setState({ cidr: e.target.value })}
                  className="flex-1 accent-[#00ff9c]"
                />
                <Input
                  type="number"
                  min="0"
                  max="32"
                  value={state.cidr}
                  onChange={(e) => setState({ cidr: e.target.value })}
                  className={`w-20 font-mono bg-black border-[#1a1a1a] text-zinc-300 text-center rounded-none focus-visible:ring-[#00ff9c] ${!isValidCidr ? "border-red-500 text-red-400 focus-visible:ring-red-500" : ""}`}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="border border-[#1a1a1a] bg-[#050505]">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[OUT]</span>
            <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center gap-2 uppercase tracking-widest">
              Results <span className="cursor-blink">_</span>
            </span>
          </header>
          <div className="p-6">
            {!result || result.error ? (
              <div className="flex gap-2 leading-relaxed text-sm">
                <span className="text-red-500 shrink-0 select-none">[ERR]</span>
                <span className="text-red-400 font-mono">{result?.error || "Awaiting valid input..."}</span>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-sm">
                <ResultRow label="Network Address" value={result.network!} onCopy={() => copyToClipboard(result.network!, "net")} copied={copiedKey === "net"} />
                <ResultRow label="Broadcast Address" value={result.broadcast!} onCopy={() => copyToClipboard(result.broadcast!, "bcast")} copied={copiedKey === "bcast"} />
                <ResultRow label="Subnet Mask" value={result.mask!} onCopy={() => copyToClipboard(result.mask!, "mask")} copied={copiedKey === "mask"} />
                <ResultRow label="Wildcard Mask" value={result.wildcard!} onCopy={() => copyToClipboard(result.wildcard!, "wild")} copied={copiedKey === "wild"} />
                <div className="border-t border-[#1a1a1a] my-3"></div>
                <ResultRow label="First Host" value={result.firstHost!} onCopy={() => copyToClipboard(result.firstHost!, "first")} copied={copiedKey === "first"} />
                <ResultRow label="Last Host" value={result.lastHost!} onCopy={() => copyToClipboard(result.lastHost!, "last")} copied={copiedKey === "last"} />
                <ResultRow label="Total Hosts" value={result.totalHosts.toLocaleString()} onCopy={() => copyToClipboard(result.totalHosts.toString(), "hosts")} copied={copiedKey === "hosts"} />
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}

export default function SubnetCalculator() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Initializing...</div>}>
      <SubnetCalculatorContent />
    </Suspense>
  );
}

function ResultRow({ label, value, onCopy, copied }: { label: string, value: string, onCopy: () => void, copied: boolean }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-zinc-500">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-zinc-200">{value}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--phosphor)] hover:bg-zinc-900"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3 w-3 text-[var(--phosphor)]" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}
