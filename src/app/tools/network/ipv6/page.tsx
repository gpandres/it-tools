"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { expandIPv6, compressIPv6, getIPv6NetworkInfo } from "@/lib/ipv6";

function IPv6ToolContent() {
  const [ipInput, setIpInput] = useState("2001:db8::1");
  const [cidrInput, setCidrInput] = useState("64");

  const { expanded, compressed, networkInfo, error } = useMemo(() => {
    try {
      const parsedCidr = parseInt(cidrInput, 10);
      if (isNaN(parsedCidr) || parsedCidr < 0 || parsedCidr > 128) {
        return { expanded: "", compressed: "", networkInfo: null, error: "CIDR must be between 0 and 128" };
      }

      const exp = expandIPv6(ipInput);
      if (!exp) {
        return { expanded: "", compressed: "", networkInfo: null, error: "Invalid IPv6 Address" };
      }

      const comp = compressIPv6(exp) || "";
      const net = getIPv6NetworkInfo(exp, parsedCidr);

      return { expanded: exp, compressed: comp, networkInfo: net, error: "" };
    } catch {
      return { expanded: "", compressed: "", networkInfo: null, error: "Calculation error" };
    }
  }, [ipInput, cidrInput]);

  const cidrNumber = parseInt(cidrInput, 10);
  const hasInvalidCidr = Number.isNaN(cidrNumber) || cidrNumber < 0 || cidrNumber > 128;
  const hasInvalidIp = error === "Invalid IPv6 Address";

  return (
    <ToolLayout
      title="IPv6 Calculator"
      description="Expand, compress, and calculate IPv6 subnets and ranges."
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN" className="text-[#ffb000] glow-amber">Input config</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody>
            <div className="grid gap-4 md:grid-cols-4">
              <ToolField
                htmlFor="ipv6-address"
                label="IPv6 address"
                helper="Use a valid IPv6 address in compressed or full notation."
                error={hasInvalidIp ? "Enter a valid IPv6 address, for example 2001:db8::1." : undefined}
                className="md:col-span-3"
              >
                <Input
                  id="ipv6-address"
                  type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                  aria-invalid={hasInvalidIp}
                  className={`h-10 bg-black font-mono text-[#00ff9c] rounded-none focus-visible:ring-[#00ff9c] ${hasInvalidIp ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "border-[#1a1a1a]"}`}
                placeholder="2001:db8::1"
                spellCheck={false}
              />
              </ToolField>
              <ToolField
                htmlFor="ipv6-cidr"
                label="CIDR / prefix"
                helper="Whole-number prefix from 0 to 128."
                error={hasInvalidCidr ? "CIDR prefix must be a whole number from 0 to 128." : undefined}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-zinc-500" aria-hidden="true">/</span>
                  <Input
                    id="ipv6-cidr"
                  type="number"
                  value={cidrInput}
                  onChange={(e) => setCidrInput(e.target.value)}
                  min="0"
                  max="128"
                    aria-invalid={hasInvalidCidr}
                    className={`h-10 bg-black pl-7 font-mono text-[#00ff9c] rounded-none focus-visible:ring-[#00ff9c] ${hasInvalidCidr ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "border-[#1a1a1a]"}`}
                />
                </div>
              </ToolField>
            </div>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Results <span className="cursor-blink">_</span></ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody>
            {error ? (
              <ToolStatus tone="error" title="Awaiting valid input">{error}</ToolStatus>
            ) : expanded && networkInfo && (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <ResultBlock title="Expanded address" value={expanded} />
                  <ResultBlock title="Compressed address" value={compressed} />
                </div>
                <div className="border-t border-[#1a1a1a] pt-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Network information</h3>
                  <div className="mt-4 space-y-3">
                    <ResultRow label="Network Address" value={networkInfo.networkAddress} />
                    <ResultRow label="Prefix Length" value={`/${cidrInput}`} />
                    <ResultRow label="Address Type" value={networkInfo.type} />
                    <ResultRow label="Total IP Addresses" value={networkInfo.totalIps} />
                  </div>
                </div>
              </div>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

function ResultBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="border border-[#1a1a1a] bg-black p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{title}</div>
      <code className="mt-3 block break-all text-sm text-[#00ff9c]">{value}</code>
    </div>
  );
}

export default function IPv6Tool() {
  return <IPv6ToolContent />;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
      <div className="text-xs text-zinc-400">{label}</div>
      <code className="break-all text-left text-sm text-[#00ff9c] sm:text-right">{value}</code>
    </div>
  );
}
