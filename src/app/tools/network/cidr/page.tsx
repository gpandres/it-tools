"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cidrToMaskInt, intToIp } from "@/lib/network";

export default function CidrConverter() {
  const [cidr, setCidr] = useState("24");
  const [mask, setMask] = useState("255.255.255.0");
  
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const updateFromCidr = (val: string) => {
    setCidr(val);
    setError(null);
    if (!val) {
      setMask("");
      return;
    }

    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 32) {
      const maskInt = cidrToMaskInt(num);
      setMask(intToIp(maskInt));
    } else {
      setError("Invalid CIDR. Must be between 0 and 32.");
    }
  };

  const updateFromMask = (val: string) => {
    setMask(val);
    setError(null);
    if (!val) {
      setCidr("");
      return;
    }

    const parts = val.split(".");
    if (parts.length === 4 && parts.every(p => /^\d+$/.test(p) && parseInt(p) >= 0 && parseInt(p) <= 255)) {
      const intVal = parts.reduce((acc, part) => (acc << 8) + parseInt(part), 0) >>> 0;
      
      // Calculate CIDR by counting consecutive 1s from the left
      let c = 0;
      let temp = intVal;
      let valid = true;
      for (let i = 31; i >= 0; i--) {
        if ((temp >>> i) & 1) {
          c++;
        } else {
          // Once we hit a 0, the rest must be 0s for a valid mask
          const remaining = temp & ((1 << i) - 1);
          if (remaining !== 0) {
            valid = false;
          }
          break;
        }
      }

      if (valid) {
        setCidr(c.toString());
      } else {
        setError("Invalid Subnet Mask. Not contiguous.");
      }
    } else {
      setError("Invalid IPv4 mask format.");
    }
  };

  // Derived calculations based on valid state
  let wildcard = "";
  let hosts = 0;
  
  const cidrNum = parseInt(cidr, 10);
  if (!error && !isNaN(cidrNum) && cidrNum >= 0 && cidrNum <= 32) {
    const maskInt = cidrToMaskInt(cidrNum);
    const wildcardInt = (~maskInt) >>> 0;
    wildcard = intToIp(wildcardInt);
    
    if (cidrNum === 32) hosts = 1;
    else if (cidrNum === 31) hosts = 2;
    else hosts = Math.pow(2, 32 - cidrNum);
  }

  return (
    <ToolLayout 
      title="CIDR & Subnet Mask Converter" 
      description="Convert bidirectionally between CIDR notation (e.g., /24) and IPv4 Subnet Masks (e.g., 255.255.255.0)."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <BaseInputBox 
          title="CIDR Prefix" 
          value={cidr}
          onChange={updateFromCidr}
          onCopy={() => copy("/" + cidr, "cidr")}
          copied={copiedKey === "cidr"}
          error={error}
          prefix="/"
          placeholder="24"
        />
        <BaseInputBox 
          title="Subnet Mask" 
          value={mask}
          onChange={updateFromMask}
          onCopy={() => copy(mask, "mask")}
          copied={copiedKey === "mask"}
          error={error}
          prefix=""
          placeholder="255.255.255.0"
        />
        <BaseInputBox 
          title="Wildcard Mask" 
          value={wildcard}
          onChange={() => {}}
          onCopy={() => copy(wildcard, "wild")}
          copied={copiedKey === "wild"}
          error={error}
          prefix=""
          placeholder=""
          readOnly
        />
        <BaseInputBox 
          title="Total IPs" 
          value={hosts.toString()}
          onChange={() => {}}
          onCopy={() => copy(hosts.toString(), "hosts")}
          copied={copiedKey === "hosts"}
          error={error}
          prefix=""
          placeholder=""
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
  prefix,
  placeholder,
  readOnly = false
}: { 
  title: string, 
  value: string, 
  onChange: (val: string) => void,
  onCopy: () => void,
  copied: boolean,
  error: string | null,
  prefix: string,
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
        <div className="relative">
          {prefix && value && !error && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 font-mono text-lg pointer-events-none select-none">
              {prefix}
            </div>
          )}
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full font-mono text-lg bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-12 text-zinc-200 ${prefix && value && !error ? 'pl-7' : ''} ${error && value && !readOnly ? 'border-red-500/50 text-red-400 focus-visible:ring-red-500' : ''} ${readOnly ? 'opacity-70 focus-visible:ring-0 cursor-default' : ''}`}
            spellCheck={false}
          />
        </div>
      </div>
    </article>
  );
}
