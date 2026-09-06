"use client";

import { ToolLayout } from "@/components/tool-layout";
import { useToolUrlState } from "@/hooks/use-tool-state";
import { calculateVlsm, validateIp } from "@/lib/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { Suspense, useState, useMemo } from "react";

function VlsmCalculatorContent() {
  const [state, setState] = useToolUrlState({ 
    ip: "192.168.1.0", 
    cidr: "24",
    subnets: JSON.stringify([{ name: "Subnet 1", hosts: 50 }, { name: "Subnet 2", hosts: 20 }]) 
  });
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parsedSubnets = useMemo(() => {
    try {
      return JSON.parse(state.subnets);
    } catch {
      return [];
    }
  }, [state.subnets]);

  const updateSubnet = (index: number, field: string, value: string | number) => {
    const newSubnets = [...parsedSubnets];
    newSubnets[index] = { ...newSubnets[index], [field]: value };
    setState({ subnets: JSON.stringify(newSubnets) });
  };

  const addSubnet = () => {
    const newSubnets = [...parsedSubnets, { name: `Subnet ${parsedSubnets.length + 1}`, hosts: 10 }];
    setState({ subnets: JSON.stringify(newSubnets) });
  };

  const removeSubnet = (index: number) => {
    const newSubnets = parsedSubnets.filter((_: any, i: number) => i !== index);
    setState({ subnets: JSON.stringify(newSubnets) });
  };

  const isValidIp = validateIp(state.ip);
  const cidrNum = parseInt(state.cidr, 10);
  const isValidCidr = !isNaN(cidrNum) && cidrNum >= 0 && cidrNum <= 32;

  const result = useMemo(() => {
    if (isValidIp && isValidCidr && parsedSubnets.length > 0) {
      return calculateVlsm(state.ip, cidrNum, parsedSubnets);
    }
    return [];
  }, [state.ip, cidrNum, isValidIp, isValidCidr, parsedSubnets]);

  return (
    <ToolLayout 
      title="VLSM Calculator" 
      description="Variable Length Subnet Mask calculator. Split a major network into subnets of different sizes."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <article className="border border-[#1a1a1a] bg-[#050505]">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Major Network</span>
            </header>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ip" className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Major IP Address</Label>
                <Input
                  id="ip"
                  value={state.ip}
                  onChange={(e) => setState({ ip: e.target.value })}
                  className={`font-mono bg-black border-[#1a1a1a] text-zinc-300 rounded-none focus-visible:ring-[#00ff9c] ${!isValidIp && state.ip ? "border-red-500 text-red-400 focus-visible:ring-red-500" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidr" className="text-zinc-500 font-mono text-xs uppercase tracking-wider">CIDR Prefix (/{state.cidr})</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="cidr"
                    type="range"
                    min="0"
                    max="32"
                    value={state.cidr}
                    onChange={(e) => setState({ cidr: e.target.value })}
                    className="flex-1 accent-[#00ff9c] cursor-pointer"
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
            <header className="flex flex-row items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <span className="text-[#00ff9c] text-xs">[REQ]</span>
                <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Subnets</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 border-[#1a1a1a] bg-black text-zinc-400 hover:text-[#00ff9c] hover:border-[#00ff9c] rounded-none transition-colors" onClick={addSubnet}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </header>
            <div className="p-4 space-y-3">
              {parsedSubnets.map((sub: any, i: number) => (
                <div key={i} className="flex items-end gap-2 p-3 bg-black border border-[#1a1a1a]">
                  <div className="space-y-1 flex-1 min-w-0">
                    <Label className="text-[10px] text-zinc-500 uppercase tracking-widest">Name</Label>
                    <Input 
                      value={sub.name} 
                      onChange={(e) => updateSubnet(i, "name", e.target.value)}
                      className="h-7 bg-[#050505] border-[#1a1a1a] text-xs font-mono rounded-none text-zinc-300 focus-visible:ring-[#00ff9c]"
                    />
                  </div>
                  <div className="space-y-1 w-20 shrink-0">
                    <Label className="text-[10px] text-zinc-500 uppercase tracking-widest">Hosts</Label>
                    <Input 
                      type="number"
                      min="1"
                      value={sub.hosts} 
                      onChange={(e) => updateSubnet(i, "hosts", parseInt(e.target.value) || 0)}
                      className="h-7 bg-[#050505] border-[#1a1a1a] text-xs font-mono text-center rounded-none text-zinc-300 focus-visible:ring-[#00ff9c]"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-red-400 hover:bg-red-950/20 rounded-none shrink-0" onClick={() => removeSubnet(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="lg:col-span-2 xl:col-span-3">
          <article className="border border-[#1a1a1a] bg-[#050505] h-full flex flex-col">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center gap-2 uppercase tracking-widest">
                Allocation Plan <span className="cursor-blink">_</span>
              </span>
            </header>
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              {result.length === 0 ? (
                <div className="text-zinc-600 text-sm font-mono p-8 text-center border border-dashed border-[#1a1a1a]">
                  Configure major network and required subnets to see the allocation plan.
                </div>
              ) : (
                <div className="border border-[#1a1a1a] overflow-x-auto">
                  <Table className="w-full text-xs sm:text-sm">
                    <TableHeader className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="text-zinc-500 font-mono py-2 whitespace-nowrap">Name</TableHead>
                        <TableHead className="text-zinc-500 font-mono py-2 whitespace-nowrap">Req/Alloc</TableHead>
                        <TableHead className="text-[#00ff9c] font-mono py-2 whitespace-nowrap">Net / CIDR</TableHead>
                        <TableHead className="text-zinc-500 font-mono py-2 whitespace-nowrap">Range</TableHead>
                        <TableHead className="text-zinc-500 font-mono py-2 whitespace-nowrap">Bcast</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.map((r, i) => (
                        <TableRow key={i} className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors border-none">
                          <TableCell className="font-medium text-zinc-300 py-2 whitespace-nowrap">{r.name}</TableCell>
                          <TableCell className="font-mono text-zinc-500 py-2 whitespace-nowrap">
                            {r.neededHosts} <span className="text-zinc-600">/</span> {r.allocatedHosts}
                          </TableCell>
                          <TableCell className="font-mono text-[#00ff9c] py-2 whitespace-nowrap">
                            {r.error ? (
                               <span className="text-red-500">{r.error}</span>
                            ) : (
                               `${r.network}/${r.cidr}`
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-zinc-400 py-2 whitespace-nowrap">
                            {r.error ? "-" : `${r.firstHost} - ${r.lastHost}`}
                          </TableCell>
                          <TableCell className="font-mono text-zinc-400 py-2 whitespace-nowrap">
                            {r.error ? "-" : r.broadcast}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </ToolLayout>
  );
}

export default function VlsmCalculator() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Initializing...</div>}>
      <VlsmCalculatorContent />
    </Suspense>
  );
}
