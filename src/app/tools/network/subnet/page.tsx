"use client";

import { ToolLayout } from "@/components/tool-layout";
import { useNotification } from "@/components/notification-provider";
import { ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { calculateSubnet, validateIp } from "@/lib/network";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";

function SubnetCalculatorContent() {
  const [state, _setState] = useState({ ip: "192.168.1.0", cidr: "24" });
  const setState = (u: Partial<typeof state>) => _setState(s => ({ ...s, ...u }));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { notify } = useNotification();

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      notify("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      notify("Unable to copy this value", "error");
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

  const cidrProgress = isValidCidr ? (cidrNum / 32) * 100 : 0;
  return (
    <ToolLayout 
      title="Subnetting Calculator" 
      description="Calculate network address, broadcast, host range, and wildcard mask from an IP and CIDR."
    >
      <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-6 md:grid-cols-2">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN" className="text-[#ffb000] glow-amber">Input config</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-6">
            <ToolField
              htmlFor="ip"
              label="IP address"
              helper="IPv4 address in dotted-decimal notation."
              error={!isValidIp && state.ip ? "Enter a valid IPv4 address, for example 192.168.1.0." : undefined}
            >
              <Input
                id="ip"
                value={state.ip}
                onChange={(e) => setState({ ip: e.target.value })}
                aria-invalid={!isValidIp && Boolean(state.ip)}
                className={`bg-black font-mono text-zinc-300 rounded-none focus-visible:ring-[#00ff9c] ${!isValidIp && state.ip ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "border-[#1a1a1a]"}`}
                placeholder="192.168.1.0"
              />
            </ToolField>

            <ToolField
              htmlFor="cidr"
              label={`CIDR prefix (/${state.cidr || "?"})`}
              helper="Use the slider or enter a prefix from 0 to 32."
              error={!isValidCidr ? "CIDR prefix must be a whole number from 0 to 32." : undefined}
            >
              <div className="flex items-center gap-4">
                <input
                  id="cidr"
                  type="range"
                  min="0"
                  max="32"
                  value={state.cidr}
                  onChange={(e) => setState({ cidr: e.target.value })}
                  className="tool-range flex-1"
                  style={{ "--tool-range-progress": `${cidrProgress}%` } as React.CSSProperties}
                />
                <Input
                  type="number"
                  min="0"
                  max="32"
                  value={state.cidr}
                  onChange={(e) => setState({ cidr: e.target.value })}
                  aria-invalid={!isValidCidr}
                  className={`w-20 bg-black text-center font-mono text-zinc-300 rounded-none focus-visible:ring-[#00ff9c] ${!isValidCidr ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "border-[#1a1a1a]"}`}
                />
              </div>
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Results <span className="cursor-blink">_</span></ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody>
            {!result || result.error ? (
              <ToolStatus tone="error" title="Awaiting valid input">{result?.error || "Provide a valid IP address and CIDR prefix to calculate the subnet."}</ToolStatus>
            ) : (
              <div className="space-y-4 font-mono text-sm">
                <div className="space-y-3">
                <ResultRow label="Network Address" value={result.network!} onCopy={() => copyToClipboard(result.network!, "net")} copied={copiedKey === "net"} />
                <ResultRow label="Broadcast Address" value={result.broadcast!} onCopy={() => copyToClipboard(result.broadcast!, "bcast")} copied={copiedKey === "bcast"} />
                <ResultRow label="Subnet Mask" value={result.mask!} onCopy={() => copyToClipboard(result.mask!, "mask")} copied={copiedKey === "mask"} />
                <ResultRow label="Wildcard Mask" value={result.wildcard!} onCopy={() => copyToClipboard(result.wildcard!, "wild")} copied={copiedKey === "wild"} />
                </div>
                <div className="border-t border-[#1a1a1a] pt-3">
                <ResultRow label="First Host" value={result.firstHost!} onCopy={() => copyToClipboard(result.firstHost!, "first")} copied={copiedKey === "first"} />
                <ResultRow label="Last Host" value={result.lastHost!} onCopy={() => copyToClipboard(result.lastHost!, "last")} copied={copiedKey === "last"} />
                <ResultRow label="Total Hosts" value={result.totalHosts.toLocaleString()} onCopy={() => copyToClipboard(result.totalHosts.toString(), "hosts")} copied={copiedKey === "hosts"} />
                </div>
                </div>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

export default function SubnetCalculator() {
  return (
    <SubnetCalculatorContent />
  );
}

function ResultRow({ label, value, onCopy, copied }: { label: string, value: string, onCopy: () => void, copied: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-400">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <code className="truncate text-zinc-200" title={value}>{value}</code>
        <Button 
          variant="ghost" 
          size="icon-xs"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
          className="shrink-0 rounded-none text-zinc-500 hover:bg-zinc-900 hover:text-[var(--phosphor)]"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3 w-3 text-[var(--phosphor)]" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}
