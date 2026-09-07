"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
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

  return (
    <ToolLayout
      title="IPv6 Calculator"
      description="Expand, compress, and calculate IPv6 subnets and ranges."
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="p-4 border border-[#1a1a1a] bg-[#0a0a0a] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">IPv6 Address</label>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                placeholder="2001:db8::1"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">CIDR / Prefix</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">/</span>
                <input
                  type="number"
                  value={cidrInput}
                  onChange={(e) => setCidrInput(e.target.value)}
                  min="0"
                  max="128"
                  className="w-full bg-black border border-[#1a1a1a] p-3 pl-7 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-red-900/50 bg-red-900/10 text-red-500 text-sm font-mono">
            Error: {error}
          </div>
        )}

        {/* Results Section */}
        {!error && expanded && networkInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultCard title="Expanded (Full Uncompressed)" value={expanded} />
              <ResultCard title="Compressed (Shortest Form)" value={compressed} />
            </div>

            <div className="p-4 border border-[#1a1a1a] bg-[#050505] space-y-4">
              <h3 className="text-xs font-bold text-[#00ff9c] uppercase tracking-wider border-b border-[#1a1a1a] pb-2">
                Network Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <ResultRow label="Network Address" value={networkInfo.networkAddress} />
                <ResultRow label="Prefix Length" value={`/${cidrInput}`} />
                <ResultRow label="Address Type" value={networkInfo.type} />
                <ResultRow label="Total IP Addresses" value={networkInfo.totalIps} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 border border-[#1a1a1a] bg-[#050505]">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="font-mono text-[#00ff9c] break-all">{value}</div>
    </div>
  );
}

export default function IPv6Tool() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
      <IPv6ToolContent />
    </Suspense>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#1a1a1a] last:border-0 gap-2 sm:gap-0">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="font-mono text-[#00ff9c] text-sm break-all text-left sm:text-right">{value}</div>
    </div>
  );
}
