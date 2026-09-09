"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cidrToMaskInt, intToIp } from "@/lib/network";
import { useNotification } from "@/components/notification-provider";
import {
  ToolPanel,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolPanelBody,
  ToolField,
  ToolStatus,
} from "@/components/tool-design";

export default function CidrConverter() {
  const [cidr, setCidr] = useState("24");
  const [mask, setMask] = useState("255.255.255.0");
  
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

  const updateFromCidr = (val: string) => {
    setCidr(val);
    setError(null);
    if (!val) {
      setMask("");
      return;
    }

    const num = /^(?:0|[1-9]\d*)$/.test(val) ? Number(val) : NaN;
    if (Number.isInteger(num) && num >= 0 && num <= 32) {
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
      
      let c = 0;
      let temp = intVal;
      let valid = true;
      for (let i = 31; i >= 0; i--) {
        if ((temp >>> i) & 1) {
          c++;
        } else {
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

  let wildcard = "";
  let hosts = 0;
  
  const cidrNum = /^(?:0|[1-9]\d*)$/.test(cidr) ? Number(cidr) : NaN;
  if (!error && Number.isInteger(cidrNum) && cidrNum >= 0 && cidrNum <= 32) {
    const maskInt = cidrToMaskInt(cidrNum);
    const wildcardInt = (~maskInt) >>> 0;
    wildcard = intToIp(wildcardInt);
    
    if (cidrNum === 32) hosts = 1;
    else if (cidrNum === 31) hosts = 2;
    else hosts = Math.pow(2, 32 - cidrNum);
  }

  return (
    <ToolLayout 
      title="CIDR & SUBNET MASK CONVERTER" 
      description="Convert bidirectionally between CIDR notation (e.g., /24) and IPv4 Subnet Masks (e.g., 255.255.255.0)."
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT" className="text-sm text-[#ffb000] glow-amber">CONVERSION</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ToolField htmlFor="cidr" label="CIDR Prefix">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-500">/</span>
                  <Input
                    id="cidr"
                    value={cidr}
                    onChange={(e) => updateFromCidr(e.target.value)}
                    placeholder="24"
                    className={`rounded-none pl-7 font-mono ${error && cidr ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "text-[#00ff9c]"}`}
                  />
                </div>
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy CIDR"
                  title="Copy CIDR"
                  onClick={() => copy("/" + cidr, "cidr")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "cidr" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="mask" label="Subnet Mask">
              <div className="flex gap-2">
                <Input
                  id="mask"
                  value={mask}
                  onChange={(e) => updateFromMask(e.target.value)}
                  placeholder="255.255.255.0"
                  className={`rounded-none font-mono ${error && mask ? "border-red-500 text-red-400 focus-visible:ring-red-500" : "text-[#00ff9c]"}`}
                />
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy Mask"
                  title="Copy Mask"
                  onClick={() => copy(mask, "mask")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "mask" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="wildcard" label="Wildcard Mask">
              <div className="flex gap-2">
                <Input
                  id="wildcard"
                  value={wildcard}
                  readOnly
                  placeholder="0.0.0.255"
                  className="rounded-none border-[#1a1a1a] bg-[#050505] font-mono text-zinc-300 opacity-80 focus-visible:ring-0"
                />
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy Wildcard"
                  title="Copy Wildcard"
                  onClick={() => copy(wildcard, "wildcard")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "wildcard" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="hosts" label="Total IPs">
              <div className="flex gap-2">
                <Input
                  id="hosts"
                  value={hosts ? hosts.toString() : ""}
                  readOnly
                  placeholder="256"
                  className="rounded-none border-[#1a1a1a] bg-[#050505] font-mono text-zinc-300 opacity-80 focus-visible:ring-0"
                />
                <Button 
                  type="button"
                  variant="outline" size="icon" 
                  aria-label="Copy IPs"
                  title="Copy IPs"
                  onClick={() => copy(hosts.toString(), "hosts")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
                >
                  {copiedKey === "hosts" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
