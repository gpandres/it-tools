"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NumberBaseConverter() {
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");
  const [binary, setBinary] = useState("");
  const [octal, setOctal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const updateAll = (value: string, base: number) => {
    setError(null);
    
    const cleanVal = value.replace(/\s+/g, "").toLowerCase();
    
    // Strict input filtering to prevent typing invalid characters entirely
    if (base === 10 && !/^-?\d*$/.test(cleanVal)) return;
    if (base === 16 && !/^-?[0-9a-f]*$/.test(cleanVal)) return;
    if (base === 2 && !/^-?[01]*$/.test(cleanVal)) return;
    if (base === 8 && !/^-?[0-7]*$/.test(cleanVal)) return;
    
    if (cleanVal === "" || cleanVal === "-") {
      setDecimal(value);
      setHex(value === "-" ? "-" : "");
      setBinary(value === "-" ? "-" : "");
      setOctal(value === "-" ? "-" : "");
      return;
    }

    try {

      // Use BigInt to support arbitrarily large numbers
      let isNegative = false;
      let parseVal = cleanVal;
      if (parseVal.startsWith("-")) {
        isNegative = true;
        parseVal = parseVal.substring(1);
      }

      // Parse to BigInt
      let bigNum: bigint;
      if (base === 10) {
        bigNum = BigInt(parseVal);
      } else if (base === 16) {
        bigNum = BigInt("0x" + parseVal);
      } else if (base === 2) {
        bigNum = BigInt("0b" + parseVal);
      } else if (base === 8) {
        bigNum = BigInt("0o" + parseVal);
      } else {
        throw new Error("Unknown base");
      }

      if (isNegative) {
        bigNum = -bigNum;
      }

      if (base !== 10) setDecimal(bigNum.toString(10));
      else setDecimal(value);

      if (base !== 16) setHex((isNegative ? "-" : "") + (bigNum < 0n ? -bigNum : bigNum).toString(16).toUpperCase());
      else setHex(value.toUpperCase());

      if (base !== 2) setBinary((isNegative ? "-" : "") + (bigNum < 0n ? -bigNum : bigNum).toString(2));
      else setBinary(value);

      if (base !== 8) setOctal((isNegative ? "-" : "") + (bigNum < 0n ? -bigNum : bigNum).toString(8));
      else setOctal(value);

    } catch (e) {
      setError((e as Error).message);
      // We still update the specific input so the user can fix their typo
      if (base === 10) setDecimal(value);
      if (base === 16) setHex(value.toUpperCase());
      if (base === 2) setBinary(value);
      if (base === 8) setOctal(value);
    }
  };

  return (
    <ToolLayout 
      title="Number Base Converter" 
      description="Convert numbers between Decimal, Hexadecimal, Binary, and Octal formats instantly. Supports arbitrarily large numbers."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <BaseInputBox 
          title="Decimal (Base 10)" 
          value={decimal}
          onChange={(val) => updateAll(val, 10)}
          onCopy={() => copy(decimal, "dec")}
          copied={copiedKey === "dec"}
          error={error}
          prefix=""
        />
        <BaseInputBox 
          title="Hexadecimal (Base 16)" 
          value={hex}
          onChange={(val) => updateAll(val, 16)}
          onCopy={() => copy(hex, "hex")}
          copied={copiedKey === "hex"}
          error={error}
          prefix="0x"
        />
        <BaseInputBox 
          title="Binary (Base 2)" 
          value={binary}
          onChange={(val) => updateAll(val, 2)}
          onCopy={() => copy(binary, "bin")}
          copied={copiedKey === "bin"}
          error={error}
          prefix="0b"
        />
        <BaseInputBox 
          title="Octal (Base 8)" 
          value={octal}
          onChange={(val) => updateAll(val, 8)}
          onCopy={() => copy(octal, "oct")}
          copied={copiedKey === "oct"}
          error={error}
          prefix="0o"
        />
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 max-w-5xl mx-auto flex items-center gap-3">
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
  prefix
}: { 
  title: string, 
  value: string, 
  onChange: (val: string) => void,
  onCopy: () => void,
  copied: boolean,
  error: string | null,
  prefix: string
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
      <div className="p-4 flex flex-col justify-center min-h-[120px]">
        <div className="relative">
          {prefix && value && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 font-mono text-sm pointer-events-none select-none">
              {prefix}
            </div>
          )}
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${title.split(' ')[0].toLowerCase()}...`}
            className={`w-full font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-12 text-zinc-200 ${prefix && value ? 'pl-9' : ''} ${error && value ? 'border-red-500/50 text-red-400' : ''}`}
            spellCheck={false}
          />
        </div>
      </div>
    </article>
  );
}
