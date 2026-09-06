"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check, RefreshCw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mini local database of common MAC vendors to maintain 100% offline privacy
const COMMON_VENDORS: Record<string, string> = {
  "00000C": "Cisco Systems, Inc",
  "000142": "Cisco Systems, Inc",
  "000143": "Cisco Systems, Inc",
  "001422": "Dell Inc.",
  "001143": "Dell Inc.",
  "001C42": "Parallels, Inc.",
  "005056": "VMware, Inc.",
  "000C29": "VMware, Inc.",
  "000569": "VMware, Inc.",
  "00163E": "Xensource, Inc.",
  "001A11": "Google, Inc.",
  "3C5AB4": "Google, Inc.",
  "F88A5E": "Apple, Inc.",
  "001CD4": "Apple, Inc.",
  "0014EE": "Western Digital",
  "000420": "Intel Corporate",
  "0013E8": "Intel Corporate",
  "001B21": "Intel Corporate",
  "0024E8": "Samsung Electronics Co.,Ltd",
  "000D0B": "Buffalo. Inc",
  "0002B3": "Intel Corporate",
  "001132": "Synology Incorporated",
  "0011D9": "TiVo",
  "001C14": "VMware, Inc.",
  "00226B": "Cisco-Linksys, LLC",
  "0001E6": "Hewlett-Packard Company",
  "0002A5": "Hewlett-Packard Company",
  "000400": "Lexmark International, Inc.",
  "000401": "Osaki Electric Co., Ltd.",
  "000402": "Banyan Systems",
  "000403": "Microcom",
  "000404": "SGI",
  "000405": "ACCNET",
  "000874": "Dell Inc.",
  "001422": "Dell Inc.",
  "0015C5": "Dell Inc.",
  "001D09": "Dell Inc.",
  "CC46D6": "Cisco Systems, Inc",
  "F40F24": "Apple, Inc.",
  "DCA904": "Apple, Inc.",
  "E0ACCB": "Apple, Inc."
};

export default function MacFormatter() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInput = (val: string) => {
    setInput(val);
    setError(null);
  };

  const generateRandom = () => {
    const hexChars = "0123456789ABCDEF";
    let mac = "";
    for (let i = 0; i < 12; i++) {
      mac += hexChars[Math.floor(Math.random() * 16)];
    }
    // Format to IEEE for the input box automatically
    setInput(mac.match(/.{1,2}/g)?.join("-") || "");
  };

  // Clean the MAC address by removing all non-hex characters
  const cleanMac = input.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  const isValid = cleanMac.length === 12;
  
  // Extract OUI (first 6 characters/3 bytes)
  const oui = isValid ? cleanMac.substring(0, 6) : "";
  const vendor = oui ? (COMMON_VENDORS[oui] || "Unknown (Not in offline DB)") : "";

  // Format generators
  const formats = {
    ieee: isValid ? cleanMac.match(/.{1,2}/g)?.join("-") || "" : "",
    unix: isValid ? cleanMac.match(/.{1,2}/g)?.join(":") || "" : "",
    cisco: isValid ? cleanMac.match(/.{1,4}/g)?.join(".") || "" : "",
    bare: isValid ? cleanMac : "",
  };

  return (
    <ToolLayout 
      title="MAC Address Formatter" 
      description="Parse, validate, convert MAC addresses across formats, and detect vendors offline."
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Input Section */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Input MAC</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#ffb000] hover:bg-[#ffb000]/10 transition-colors border border-transparent hover:border-[#ffb000]/30"
                onClick={generateRandom}
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Random
              </Button>
              {input && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  onClick={() => setInput("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </header>
          <div className="p-6">
            <Label htmlFor="mac-input" className="sr-only">MAC Address</Label>
            <Input
              id="mac-input"
              type="text"
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="e.g. 00:1A:2B:3C:4D:5E or 001a.2b3c.4d5e"
              className={`w-full font-mono text-lg bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-14 text-zinc-200 ${input && !isValid ? 'border-red-500/50 focus-visible:ring-red-500 text-red-400' : ''}`}
              spellCheck={false}
            />
            {input && !isValid && (
              <div className="mt-3 text-red-500 font-mono text-xs flex items-center">
                [ERR] Invalid MAC address length. Found {cleanMac.length} hex digits, expected 12.
              </div>
            )}
            {input && isValid && (
              <div className="mt-3 text-[#00ff9c] font-mono text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3" /> Valid MAC Address detected
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <Server className="w-3 h-3" /> Vendor: {vendor}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Outputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormatBox 
            title="IEEE 802 (Windows)" 
            value={formats.ieee}
            onCopy={() => copy(formats.ieee, "ieee")}
            copied={copiedKey === "ieee"}
          />
          <FormatBox 
            title="UNIX / Linux" 
            value={formats.unix}
            onCopy={() => copy(formats.unix, "unix")}
            copied={copiedKey === "unix"}
          />
          <FormatBox 
            title="Cisco" 
            value={formats.cisco}
            onCopy={() => copy(formats.cisco, "cisco")}
            copied={copiedKey === "cisco"}
          />
          <FormatBox 
            title="Bare / Raw" 
            value={formats.bare}
            onCopy={() => copy(formats.bare, "bare")}
            copied={copiedKey === "bare"}
          />
        </div>

      </div>
    </ToolLayout>
  );
}

function FormatBox({ 
  title, 
  value, 
  onCopy, 
  copied
}: { 
  title: string, 
  value: string, 
  onCopy: () => void,
  copied: boolean
}) {
  return (
    <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <span className="text-zinc-600 text-xs">[OUT]</span>
          <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest">{title}</span>
        </div>
        <Button 
          variant="ghost"
          size="sm"
          disabled={!value}
          className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors disabled:opacity-30"
          onClick={onCopy}
        >
          {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
        </Button>
      </header>
      <div className="p-4 flex items-center min-h-[80px]">
        {value ? (
          <span className="font-mono text-lg text-zinc-200 tracking-wider">{value}</span>
        ) : (
          <span className="font-mono text-sm text-zinc-700 select-none">Awaiting valid input...</span>
        )}
      </div>
    </article>
  );
}
