"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Copy } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { useNotification } from "@/components/notification-provider";
import { Input } from "@/components/ui/input";
import {
  ToolActionButton,
  ToolField,
  ToolPanel,
  ToolPanelBody,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolStatus,
} from "@/components/tool-design";
import { calculateSubnet, validateIp } from "@/lib/network";

export default function SubnetCalculator() {
  const [state, setState] = useState({ ip: "192.168.1.0", cidr: "24" });
  const { notify } = useNotification();

  const ip = state.ip.trim();
  const cidrText = state.cidr.trim();
  const isValidIp = validateIp(ip);
  const cidrNum = /^(?:0|[1-9]\d*)$/.test(cidrText) ? Number(cidrText) : Number.NaN;
  const isValidCidr = Number.isInteger(cidrNum) && cidrNum >= 0 && cidrNum <= 32;
  const result = useMemo(() => {
    if (!isValidIp || !isValidCidr) return null;
    return calculateSubnet(ip, cidrNum);
  }, [ip, cidrNum, isValidIp, isValidCidr]);

  const ipError = Boolean(ip) && !isValidIp;
  const cidrError = Boolean(cidrText) && !isValidCidr;
  const hasInvalidInput = ipError || cidrError;
  const cidrProgress = isValidCidr ? (cidrNum / 32) * 100 : 0;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the value and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout
      title="Subnetting Calculator"
      description="Calculate network address, broadcast, host range, and wildcard mask from an IP and CIDR."
    >
      <div className="mx-auto grid w-full max-w-7xl min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN">Input config</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-6">
            <ToolField
              htmlFor="ip"
              label="IP address"
              helper="IPv4 address in dotted-decimal notation."
              error={ipError ? "Enter a valid IPv4 address, for example 192.168.1.0." : undefined}
            >
              <Input
                id="ip"
                value={state.ip}
                onChange={event => setState(current => ({ ...current, ip: event.target.value }))}
                aria-invalid={ipError}
                aria-describedby={ipError ? "ip-error" : undefined}
                className="rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300"
                placeholder="192.168.1.0"
                spellCheck={false}
                autoComplete="off"
              />
              {ipError && <span id="ip-error" className="sr-only">Enter a valid IPv4 address.</span>}
            </ToolField>

            <ToolField
              htmlFor="cidr"
              label={`CIDR prefix (/${state.cidr || "?"})`}
              helper="Use the slider or enter a whole prefix from 0 to 32."
              error={cidrError ? "CIDR prefix must be a whole number from 0 to 32." : undefined}
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <input
                  id="cidr-range"
                  type="range"
                  min="0"
                  max="32"
                  value={isValidCidr ? cidrNum : 0}
                  onChange={event => setState(current => ({ ...current, cidr: event.target.value }))}
                  aria-label="CIDR prefix slider"
                  className="tool-range min-w-0 flex-1"
                  style={{ "--tool-range-progress": `${cidrProgress}%` } as CSSProperties}
                />
                <Input
                  id="cidr"
                  type="text"
                  inputMode="numeric"
                  value={state.cidr}
                  onChange={event => setState(current => ({ ...current, cidr: event.target.value }))}
                  aria-invalid={cidrError}
                  aria-describedby={cidrError ? "cidr-error" : undefined}
                  className="w-20 shrink-0 rounded-none border-[#1a1a1a] bg-black! text-center font-mono text-zinc-300"
                  placeholder="24"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              {cidrError && <span id="cidr-error" className="sr-only">Enter a whole number from 0 to 32.</span>}
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Results <span className="cursor-blink">_</span></ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody>
            {result && !result.error ? (
              <div className="min-w-0 space-y-4 font-mono text-sm">
                <div className="space-y-3">
                  <ResultRow label="Network Address" value={result.network} onCopy={() => copyToClipboard(result.network)} />
                  <ResultRow label="Broadcast Address" value={result.broadcast} onCopy={() => copyToClipboard(result.broadcast)} />
                  <ResultRow label="Subnet Mask" value={result.mask} onCopy={() => copyToClipboard(result.mask)} />
                  <ResultRow label="Wildcard Mask" value={result.wildcard} onCopy={() => copyToClipboard(result.wildcard)} />
                </div>
                <div className="space-y-3 border-t border-[#1a1a1a] pt-3">
                  <ResultRow label="First Host" value={result.firstHost} onCopy={() => copyToClipboard(result.firstHost)} />
                  <ResultRow label="Last Host" value={result.lastHost} onCopy={() => copyToClipboard(result.lastHost)} />
                  <ResultRow label="Total Hosts" value={result.totalHosts.toLocaleString()} onCopy={() => copyToClipboard(result.totalHosts.toString())} />
                </div>
              </div>
            ) : hasInvalidInput ? (
              <ToolStatus tone="error" title="Check the subnet input">
                {ipError && cidrError
                  ? "Enter a valid IPv4 address and a whole CIDR prefix from 0 to 32."
                  : ipError
                    ? "Enter a valid IPv4 address to calculate the subnet."
                    : "Enter a whole CIDR prefix from 0 to 32 to calculate the subnet."}
              </ToolStatus>
            ) : (
              <ToolStatus title="Awaiting input">
                Enter both an IPv4 address and a CIDR prefix to calculate the subnet.
              </ToolStatus>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

function ResultRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="shrink-0 text-zinc-400">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <code className="min-w-0 break-all text-right text-zinc-200" title={value}>{value}</code>
        <ToolActionButton
          size="icon-xs"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
          className="h-7 w-7 shrink-0 p-0"
          onClick={onCopy}
        >
          <Copy className="h-3 w-3" aria-hidden="true" />
        </ToolActionButton>
      </div>
    </div>
  );
}
