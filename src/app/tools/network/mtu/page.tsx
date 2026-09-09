"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStat, ToolStatGrid, ToolStatus } from "@/components/tool-design";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function MtuToolContent() {
  const [baseMtuStr, setBaseMtuStr] = useState("1500");
  const [ipVer, setIpVer] = useState("ipv4");
  
  // Encap checkboxes
  const [hasVlan, setHasVlan] = useState("false");
  const [hasPppoe, setHasPppoe] = useState("false");
  const [hasGre, setHasGre] = useState("false");
  const [hasIpsec, setHasIpsec] = useState("false"); // Approx 50-70 bytes, we'll use 56 bytes avg for ESP/Tunnel

  const parsedMtu = Number(baseMtuStr);
  const baseMtu = Number.isInteger(parsedMtu) ? parsedMtu : 0;
  const isValidMtu = baseMtu >= 68 && baseMtu <= 9216;

  let encapOverhead = 0;
  if (hasVlan === "true") encapOverhead += 4;
  if (hasPppoe === "true") encapOverhead += 8;
  if (hasGre === "true") encapOverhead += 24; // 20 IP + 4 GRE
  if (hasIpsec === "true") encapOverhead += 56; // Typical ESP + New IP header

  const effectiveMtu = isValidMtu ? Math.max(0, baseMtu - encapOverhead) : 0;
  
  const ipHeader = ipVer === "ipv6" ? 40 : 20;
  const tcpHeader = 20;
  const mss = effectiveMtu > (ipHeader + tcpHeader) ? effectiveMtu - ipHeader - tcpHeader : 0;
  const minimumIpMtu = ipVer === "ipv6" ? 1280 : 68;
  const hasInsufficientIpMtu = isValidMtu && effectiveMtu < minimumIpMtu;

  return (
    <ToolLayout
      title="MTU & MSS Calculator"
      description="Calculate Effective MTU and TCP MSS based on network encapsulation."
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN" className="text-[#ffb000] glow-amber">Input config</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <ToolField
                  htmlFor="base-mtu"
                  label="Base link MTU (bytes)"
                  helper="Standard Ethernet is 1500; jumbo frames are commonly up to 9000."
                  error={!isValidMtu ? "Enter a whole-number MTU from 68 to 9216 bytes." : undefined}
                >
                  <Input
                    id="base-mtu"
                  type="number"
                  value={baseMtuStr}
                  onChange={(e) => setBaseMtuStr(e.target.value)}
                  min="68"
                  max="9216"
                  step="1"
                    aria-invalid={!isValidMtu}
                    className={`h-10 bg-black font-mono text-[#00ff9c] rounded-none focus-visible:ring-[#00ff9c] ${isValidMtu ? "border-[#1a1a1a]" : "border-red-500 text-red-400 focus-visible:ring-red-500"}`}
                />
                </ToolField>

                <ToolField htmlFor="ip-version" label="IP version" helper="Select the IP header used for the MSS calculation.">
                  <Tabs value={ipVer} onValueChange={setIpVer}>
                    <TabsList id="ip-version" variant="line" className="grid h-auto w-full grid-cols-2 gap-0 border border-[#1a1a1a] bg-black p-0">
                      <TabsTrigger value="ipv4" className="h-9 rounded-none border-0 text-[10px] font-bold uppercase tracking-wider data-active:bg-[#00ff9c]/10 data-active:text-[#00ff9c] data-active:after:hidden">IPv4 · 20 B</TabsTrigger>
                      <TabsTrigger value="ipv6" className="h-9 rounded-none border-0 border-l border-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider data-active:bg-[#00ff9c]/10 data-active:text-[#00ff9c] data-active:after:hidden">IPv6 · 40 B</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </ToolField>
              </div>

              <ToolField htmlFor="vlan-encapsulation" label="L2 / VPN encapsulation" helper="Enable every overhead layer present on the path.">
                <div className="space-y-1 border border-[#1a1a1a] bg-black p-3">
                <Toggle
                  id="vlan-encapsulation"
                  label="802.1Q VLAN Tag (+4 Bytes)"
                  checked={hasVlan === "true"}
                  onChange={(c) => setHasVlan(c ? "true" : "false")}
                />
                <Toggle
                  id="pppoe-encapsulation"
                  label="PPPoE (+8 Bytes)"
                  checked={hasPppoe === "true"}
                  onChange={(c) => setHasPppoe(c ? "true" : "false")}
                />
                <Toggle
                  id="gre-encapsulation"
                  label="GRE Tunnel (+24 Bytes)"
                  checked={hasGre === "true"}
                  onChange={(c) => setHasGre(c ? "true" : "false")}
                />
                <Toggle
                  id="ipsec-encapsulation"
                  label="IPsec ESP Tunnel (~56 Bytes)"
                  checked={hasIpsec === "true"}
                  onChange={(c) => setHasIpsec(c ? "true" : "false")}
                />
                </div>
              </ToolField>
            </div>
          </ToolPanelBody>
        </ToolPanel>

        {(!isValidMtu || hasInsufficientIpMtu) && (
          <ToolStatus tone="attention" title={!isValidMtu ? "Invalid base MTU" : "Effective MTU below protocol minimum"}>
            {!isValidMtu
              ? "Enter an integer MTU between 68 and 9216 bytes."
              : `Effective MTU is below the ${ipVer === "ipv6" ? "IPv6" : "IPv4"} minimum of ${minimumIpMtu} bytes for this configuration.`}
          </ToolStatus>
        )}

        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Results <span className="cursor-blink">_</span></ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody>
            <ToolStatGrid className="sm:grid-cols-2">
              <ToolStat label="Effective MTU" value={effectiveMtu} context="Bytes usable for IP packet" tone="info" />
              <ToolStat label="TCP MSS" value={mss} context="Bytes usable for TCP payload" tone="success" />
            </ToolStatGrid>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle>Packet structure</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody>
          <div className="flex h-12 w-full overflow-hidden border border-[#1a1a1a] text-xs font-bold text-black">
            {encapOverhead > 0 && (
              <div 
                className="bg-zinc-600 flex items-center justify-center border-r border-black" 
                style={{ width: `${Math.min(100, (encapOverhead / Math.max(baseMtu, 1)) * 100)}%`, minWidth: '40px' }}
                title={`Encap: ${encapOverhead} Bytes`}
              >
                ENC
              </div>
            )}
            <div 
              className="flex items-center justify-center border-r border-black bg-sky-400"
              style={{ width: `${Math.min(100, (ipHeader / Math.max(baseMtu, 1)) * 100)}%`, minWidth: '40px' }}
              title={`IP Header: ${ipHeader} Bytes`}
            >
              IP
            </div>
            <div 
              className="flex items-center justify-center border-r border-black bg-[#fbbf24]"
              style={{ width: `${Math.min(100, (tcpHeader / Math.max(baseMtu, 1)) * 100)}%`, minWidth: '40px' }}
              title="TCP Header: 20 Bytes"
            >
              TCP
            </div>
            <div 
              className="bg-[#00ff9c] flex items-center justify-center"
              style={{ width: `${Math.min(100, (mss / Math.max(baseMtu, 1)) * 100)}%` }}
              title={`TCP Payload (MSS): ${mss} Bytes`}
            >
              PAYLOAD (MSS: {mss})
            </div>
          </div>
          
          <div className="mt-4 space-y-1 font-mono text-xs text-zinc-400">
            <div>Link MTU: {baseMtu}</div>
            <div>- Encapsulation Overhead: {encapOverhead}</div>
            <div>= Effective MTU: {effectiveMtu}</div>
            <div>- IP Header ({ipVer}): {ipHeader}</div>
            <div>- TCP Header: {tcpHeader}</div>
            <div className="text-[#00ff9c]">= MSS: {mss}</div>
          </div>
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

export default function MtuTool() {
  return <MtuToolContent />;
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-10 cursor-pointer items-center gap-3 text-xs text-zinc-300">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <span>{label}</span>
    </label>
  );
}
