"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IpConverter() {
  const [ipv4, setIpv4] = useState("");
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");
  const [binary, setBinary] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
      title="IP Address Converter" 
      description="Convert IPv4 addresses between dotted-decimal, integer, hex, and binary formats."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <BaseInputBox 
          title="IPv4 Address" 
          value={ipv4}
          onChange={updateFromIpv4}
          onCopy={() => copy(ipv4, "ip")}
          copied={copiedKey === "ip"}
          error={error}
          placeholder="e.g. 192.168.1.1"
        />
        <BaseInputBox 
          title="Integer (Decimal)" 
          value={decimal}
          onChange={updateFromDecimal}
          onCopy={() => copy(decimal, "dec")}
          copied={copiedKey === "dec"}
          error={error}
          placeholder="e.g. 3232235777"
        />
        <BaseInputBox 
          title="Hexadecimal" 
          value={hex}
          onChange={updateFromHex}
          onCopy={() => copy(hex, "hex")}
          copied={copiedKey === "hex"}
          error={error}
          placeholder="e.g. 0xC0A80101"
        />
        <BaseInputBox 
          title="Binary" 
          value={binary}
          onChange={() => {}} // Binary input is read-only for now to simplify dot notation parsing
          onCopy={() => copy(binary, "bin")}
          copied={copiedKey === "bin"}
          error={error}
          placeholder="e.g. 11000000.10101000.00000001.00000001"
          readOnly
        />
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 max-w-4xl mx-auto flex items-center gap-3">
          <span className="bg-red-500 text-white px-2 py-0.5 text-xs font-mono">ERROR</span>
          <span className="text-red-400 font-mono text-sm">{error}</span>
        </div>
      )}
    </ToolLayout>
  );
}

function BaseInputBox({ 
  title, 
  value, 
  onChange, 
  onCopy, 
  copied, 
  error,
  placeholder,
  readOnly = false
}: { 
  title: string, 
  value: string, 
  onChange: (val: string) => void,
  onCopy: () => void,
  copied: boolean,
  error: string | null,
  placeholder: string,
  readOnly?: boolean
}) {
  return (
    <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">{title}</span>
        <Button 
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors"
          onClick={onCopy}
        >
          {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
        </Button>
      </header>
      <div className="p-4 flex flex-col justify-center min-h-[100px]">
        <Label className="sr-only">{title}</Label>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-12 text-zinc-200 ${error && value && !readOnly ? 'border-red-500/50 text-red-400 focus-visible:ring-red-500' : ''} ${readOnly ? 'opacity-70 focus-visible:ring-0 cursor-default' : ''}`}
          spellCheck={false}
        />
      </div>
    </article>
  );
}
