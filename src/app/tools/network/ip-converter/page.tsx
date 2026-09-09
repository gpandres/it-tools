"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notification-provider";
import {
  ToolPanel,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolPanelBody,
  ToolField,
  ToolStatus,
} from "@/components/tool-design";

export default function IpConverter() {
  const [ipv4, setIpv4] = useState("");
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");
  const [binary, setBinary] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { notify } = useNotification();

  const copy = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      notify("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      notify("Could not copy to clipboard", "error");
    }
  };

  const updateFromIpv4 = (value: string) => {
    setIpv4(value);
    setError(null);
    if (!value) return clear();

    const parts = value.split(".");
    if (parts.length === 4 && parts.every(p => /^\d+$/.test(p) && parseInt(p) >= 0 && parseInt(p) <= 255)) {
      const intVal = parts.reduce((acc, part) => (acc << 8) + parseInt(part), 0) >>> 0;
      setDecimal(intVal.toString(10));
      setHex("0x" + intVal.toString(16).toUpperCase().padStart(8, '0'));
      setBinary(intVal.toString(2).padStart(32, '0').match(/.{1,8}/g)?.join(".") || "");
    } else {
      setError("Invalid IPv4 address");
    }
  };

  const updateFromDecimal = (value: string) => {
    setDecimal(value);
    setError(null);
    if (!value) return clear();

    if (/^\d+$/.test(value)) {
      const num = parseInt(value, 10);
      if (num >= 0 && num <= 4294967295) {
        setIpv4([
          (num >>> 24) & 255,
          (num >>> 16) & 255,
          (num >>> 8) & 255,
          num & 255
        ].join("."));
        setHex("0x" + num.toString(16).toUpperCase().padStart(8, '0'));
        setBinary(num.toString(2).padStart(32, '0').match(/.{1,8}/g)?.join(".") || "");
        return;
      }
    }
    setError("Invalid Decimal IP (must be 0 to 4294967295)");
  };

  const updateFromHex = (value: string) => {
    setHex(value);
    setError(null);
    if (!value) return clear();

    const cleanVal = value.replace(/^0x/i, "");
    if (/^[0-9a-fA-F]{1,8}$/.test(cleanVal)) {
      const num = parseInt(cleanVal, 16);
      setIpv4([
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join("."));
      setDecimal(num.toString(10));
      setBinary(num.toString(2).padStart(32, '0').match(/.{1,8}/g)?.join(".") || "");
    } else {
      setError("Invalid Hexadecimal IP");
    }
  };

  const clear = () => {
    setIpv4("");
    setDecimal("");
    setHex("");
    setBinary("");
    setError(null);
  };

  return (
    <ToolLayout 
      title="IP ADDRESS CONVERTER" 
      description="Convert IPv4 addresses between dotted-decimal, integer, hex, and binary formats."
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT" className="text-sm text-[#ffb000] glow-amber">CONVERSION</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ToolField htmlFor="ipv4" label="IPv4 Address">
              <div className="flex gap-2">
                <Input
                  id="ipv4"
                  value={ipv4}
                  onChange={(e) => updateFromIpv4(e.target.value)}
                  placeholder="e.g. 192.168.1.1"
                  className={`rounded-none font-mono ${error && ipv4 ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "text-[#00ff9c]"}`}
                />
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy IPv4"
                  title="Copy IPv4"
                  onClick={() => copy(ipv4, "ipv4")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "ipv4" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="decimal" label="Integer (Decimal)">
              <div className="flex gap-2">
                <Input
                  id="decimal"
                  value={decimal}
                  onChange={(e) => updateFromDecimal(e.target.value)}
                  placeholder="e.g. 3232235777"
                  className={`rounded-none font-mono ${error && decimal ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "text-[#00ff9c]"}`}
                />
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy Decimal"
                  title="Copy Decimal"
                  onClick={() => copy(decimal, "decimal")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "decimal" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="hex" label="Hexadecimal">
              <div className="flex gap-2">
                <Input
                  id="hex"
                  value={hex}
                  onChange={(e) => updateFromHex(e.target.value)}
                  placeholder="e.g. 0xC0A80101"
                  className={`rounded-none font-mono ${error && hex ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "text-[#00ff9c]"}`}
                />
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy Hex"
                  title="Copy Hex"
                  onClick={() => copy(hex, "hex")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "hex" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="binary" label="Binary">
              <div className="flex gap-2">
                <Input
                  id="binary"
                  value={binary}
                  readOnly
                  placeholder="e.g. 11000000.10101000.00000001.00000001"
                  className="rounded-none border-[#1a1a1a] bg-[#050505] font-mono text-zinc-300 opacity-80 focus-visible:ring-0"
                />
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy Binary"
                  title="Copy Binary"
                  onClick={() => copy(binary, "binary")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "binary" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>

        {error && (
          <ToolStatus tone="error">
            {error}
          </ToolStatus>
        )}
      </div>
    </ToolLayout>
  );
}
