"use client";

import { ToolLayout } from "@/components/tool-layout";
import { calculateVlsm, validateIp } from "@/lib/network";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Inbox, Plus, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import {
  ToolPanel,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolPanelBody,
  ToolField,
  ToolEmptyState,
} from "@/components/tool-design";

function VlsmCalculatorContent() {
  const [state, _setState] = useState({ 
    ip: "192.168.1.0", 
    cidr: "24",
    subnets: JSON.stringify([{ name: "Subnet 1", hosts: 50 }, { name: "Subnet 2", hosts: 20 }]) 
  });
  const setState = (u: Partial<typeof state>) => _setState(s => ({ ...s, ...u }));
  
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
  const cidrNum = /^(?:0|[1-9]\d*)$/.test(state.cidr) ? Number(state.cidr) : NaN;
  const isValidCidr = Number.isInteger(cidrNum) && cidrNum >= 0 && cidrNum <= 32;

  const result = useMemo(() => {
    if (isValidIp && isValidCidr && parsedSubnets.length > 0) {
      return calculateVlsm(state.ip, cidrNum, parsedSubnets);
    }
    return [];
  }, [state.ip, cidrNum, isValidIp, isValidCidr, parsedSubnets]);

  const toolRangeProgress = `${(cidrNum / 32) * 100}%`;

  return (
    <ToolLayout 
      title="VLSM CALCULATOR" 
      description="Variable Length Subnet Mask calculator. Split a major network into subnets of different sizes."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="IN" className="text-sm text-[#ffb000] glow-amber">MAJOR NETWORK</ToolPanelTitle>
            </ToolPanelHeader>
            <ToolPanelBody className="space-y-4">
              <ToolField htmlFor="ip" label="Major IP Address">
                <Input
                  id="ip"
                  value={state.ip}
                  onChange={(e) => setState({ ip: e.target.value })}
                  className={`rounded-none font-mono ${!isValidIp && state.ip ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "text-[#00ff9c]"}`}
                />
              </ToolField>
              <ToolField htmlFor="cidr" label={`CIDR Prefix (/${state.cidr})`}>
                <div className="flex items-center gap-4">
                  <input
                    id="cidr"
                    type="range"
                    min="0"
                    max="32"
                    value={state.cidr}
                    onChange={(e) => setState({ cidr: e.target.value })}
                    className="tool-range flex-1"
                    style={{ "--tool-range-progress": isValidCidr ? toolRangeProgress : "0%" } as React.CSSProperties}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="32"
                    value={state.cidr}
                    onChange={(e) => setState({ cidr: e.target.value })}
                    className={`w-20 rounded-none text-center font-mono ${!isValidCidr ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "text-[#00ff9c]"}`}
                  />
                </div>
              </ToolField>
            </ToolPanelBody>
          </ToolPanel>

          <ToolPanel>
            <ToolPanelHeader className="flex flex-row items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
              <ToolPanelTitle marker="REQ" className="text-sm text-[#ffb000] glow-amber">SUBNETS</ToolPanelTitle>
              <Button size="sm" variant="outline" className="h-7 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]" onClick={addSubnet}>
                <Plus className="mr-1 h-3 w-3" /> Add
              </Button>
            </ToolPanelHeader>
            <ToolPanelBody className="space-y-3">
              {parsedSubnets.map((sub: any, i: number) => (
                <div key={i} className="flex items-end gap-2 border border-[#1a1a1a] bg-black p-3">
                  <div className="min-w-0 flex-1">
                    <ToolField htmlFor={`sub-name-${i}`} label="Name">
                      <Input 
                        id={`sub-name-${i}`}
                        value={sub.name} 
                        onChange={(e) => updateSubnet(i, "name", e.target.value)}
                        className="h-7 rounded-none font-mono text-xs text-[#00ff9c]"
                      />
                    </ToolField>
                  </div>
                  <div className="w-20 shrink-0">
                    <ToolField htmlFor={`sub-hosts-${i}`} label="Hosts">
                      <Input 
                        id={`sub-hosts-${i}`}
                        type="number"
                        min="1"
                        value={sub.hosts} 
                        onChange={(e) => {
                          const hosts = e.target.value === "" ? 0 : Number(e.target.value);
                          updateSubnet(i, "hosts", Number.isInteger(hosts) ? hosts : 0);
                        }}
                        className="h-7 rounded-none text-center font-mono text-xs text-[#00ff9c]"
                      />
                    </ToolField>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-none text-zinc-600 hover:bg-red-950/20 hover:text-red-400" onClick={() => removeSubnet(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </ToolPanelBody>
          </ToolPanel>
        </div>

        <div className="lg:col-span-2 xl:col-span-3">
          <ToolPanel className="flex h-full flex-col">
            <ToolPanelHeader>
              <ToolPanelTitle marker="OUT" className="text-sm">
                ALLOCATION PLAN <span className="cursor-blink">_</span>
              </ToolPanelTitle>
            </ToolPanelHeader>
            <ToolPanelBody className="flex-1 overflow-hidden p-4">
              {result.length === 0 ? (
                <ToolEmptyState icon={Inbox} title="No results">
                  Configure major network and required subnets to see the allocation plan.
                </ToolEmptyState>
              ) : (
                <div role="region" aria-label="Allocation plan data table" tabIndex={0} className="overflow-x-auto border border-[#1a1a1a]">
                  <table className="w-full min-w-[28rem] text-left text-[10px]">
                    <thead className="border-b border-[#1a1a1a] text-zinc-400">
                      <tr>
                        <th className="px-3 py-2 uppercase tracking-widest">Name</th>
                        <th className="px-3 py-2 uppercase tracking-widest">Req/Alloc</th>
                        <th className="px-3 py-2 uppercase tracking-widest">Net / CIDR</th>
                        <th className="px-3 py-2 uppercase tracking-widest">Range</th>
                        <th className="px-3 py-2 uppercase tracking-widest">Bcast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.map((r, i) => (
                        <tr key={i} className="border-b border-[#1a1a1a] text-zinc-300 transition-colors hover:bg-[#0a0a0a] last:border-0">
                          <td className="px-3 py-2 font-medium">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-zinc-500">
                            {r.neededHosts} <span className="text-zinc-600">/</span> {r.allocatedHosts}
                          </td>
                          <td className="px-3 py-2 font-mono text-[#00ff9c]">
                            {r.error ? (
                               <span className="text-red-500">{r.error}</span>
                            ) : (
                               `${r.network}/${r.cidr}`
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-zinc-400">
                            {r.error ? "-" : `${r.firstHost} - ${r.lastHost}`}
                          </td>
                          <td className="px-3 py-2 font-mono text-zinc-400">
                            {r.error ? "-" : r.broadcast}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ToolPanelBody>
          </ToolPanel>
        </div>
      </div>
    </ToolLayout>
  );
}

export default function VlsmCalculator() {
  return (
    <VlsmCalculatorContent />
  );
}
