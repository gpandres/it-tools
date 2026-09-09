"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check, RefreshCw, Server } from "lucide-react";
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
  "0015C5": "Dell Inc.",
  "001D09": "Dell Inc.",
  "CC46D6": "Cisco Systems, Inc",
  "F40F24": "Apple, Inc.",
  "DCA904": "Apple, Inc.",
  "E0ACCB": "Apple, Inc."
};

export default function MacFormatter() {
  const [input, setInput] = useState("");
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

  const handleInput = (val: string) => {
    setInput(val);
  };

  const generateRandom = () => {
    const hexChars = "0123456789ABCDEF";
    let mac = "";
    for (let i = 0; i < 12; i++) {
      mac += hexChars[Math.floor(Math.random() * 16)];
    }
    setInput(mac.match(/.{1,2}/g)?.join("-") || "");
  };

  const cleanMac = input.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  const isValid = cleanMac.length === 12;
  
  const oui = isValid ? cleanMac.substring(0, 6) : "";
  const vendor = oui ? (COMMON_VENDORS[oui] || "Unknown (Not in offline DB)") : "";

  const formats = {
    ieee: isValid ? cleanMac.match(/.{1,2}/g)?.join("-") || "" : "",
    unix: isValid ? cleanMac.match(/.{1,2}/g)?.join(":") || "" : "",
    cisco: isValid ? cleanMac.match(/.{1,4}/g)?.join(".") || "" : "",
    bare: isValid ? cleanMac : "",
  };

  return (
    <ToolLayout 
      title="MAC ADDRESS FORMATTER" 
      description="Parse, validate, convert MAC addresses across formats, and detect vendors offline."
    >
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
        
        <ToolPanel>
          <ToolPanelHeader className="flex flex-row items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
            <ToolPanelTitle marker="IN" className="text-sm text-[#ffb000] glow-amber">INPUT MAC</ToolPanelTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost"
                size="sm"
                className="h-7 rounded-none border border-transparent font-mono text-xs text-zinc-400 transition-colors hover:border-[#ffb000]/30 hover:bg-[#ffb000]/10 hover:text-[#ffb000]"
                onClick={generateRandom}
              >
                <RefreshCw className="mr-1 h-3 w-3" /> Random
              </Button>
              {input && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-none font-mono text-xs text-zinc-400 transition-colors hover:bg-red-950/20 hover:text-red-400"
                  onClick={() => setInput("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolField htmlFor="mac-input" label="MAC Address">
              <Input
                id="mac-input"
                type="text"
                value={input}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="e.g. 00:1A:2B:3C:4D:5E or 001a.2b3c.4d5e"
                className={`rounded-none font-mono ${input && !isValid ? 'border-red-500/50 text-red-400 focus-visible:ring-red-500' : 'text-[#00ff9c]'}`}
                spellCheck={false}
              />
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>



        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT" className="text-sm">FORMATS</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ToolField htmlFor="format-ieee" label="IEEE 802 (Windows)">
              <div className="flex gap-2">
                <Input
                  id="format-ieee"
                  value={formats.ieee}
                  readOnly
                  placeholder="00-00-00-00-00-00"
                  className="rounded-none border-[#1a1a1a] bg-[#050505] font-mono text-[#00ff9c] focus-visible:ring-0"
                />
                <Button 
                  type="button"
                  disabled={!formats.ieee}
                  variant="outline" size="icon" 
                  aria-label="Copy IEEE"
                  title="Copy IEEE"
                  onClick={() => copy(formats.ieee, "ieee")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c] disabled:opacity-50"
                >
                  {copiedKey === "ieee" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="format-unix" label="UNIX / Linux">
              <div className="flex gap-2">
                <Input
                  id="format-unix"
                  value={formats.unix}
                  readOnly
                  placeholder="00:00:00:00:00:00"
                  className="rounded-none border-[#1a1a1a] bg-[#050505] font-mono text-[#00ff9c] focus-visible:ring-0"
                />
                <Button 
                  type="button"
                  disabled={!formats.unix}
                  variant="outline" size="icon" 
                  aria-label="Copy UNIX"
                  title="Copy UNIX"
                  onClick={() => copy(formats.unix, "unix")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c] disabled:opacity-50"
                >
                  {copiedKey === "unix" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="format-cisco" label="Cisco">
              <div className="flex gap-2">
                <Input
                  id="format-cisco"
                  value={formats.cisco}
                  readOnly
                  placeholder="0000.0000.0000"
                  className="rounded-none border-[#1a1a1a] bg-[#050505] font-mono text-[#00ff9c] focus-visible:ring-0"
                />
                <Button 
                  type="button"
                  disabled={!formats.cisco}
                  variant="outline" size="icon" 
                  aria-label="Copy Cisco"
                  title="Copy Cisco"
                  onClick={() => copy(formats.cisco, "cisco")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c] disabled:opacity-50"
                >
                  {copiedKey === "cisco" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>

            <ToolField htmlFor="format-bare" label="Bare / Raw">
              <div className="flex gap-2">
                <Input
                  id="format-bare"
                  value={formats.bare}
                  readOnly
                  placeholder="000000000000"
                  className="rounded-none border-[#1a1a1a] bg-[#050505] font-mono text-[#00ff9c] focus-visible:ring-0"
                />
                <Button 
                  type="button"
                  disabled={!formats.bare}
                  variant="outline" size="icon" 
                  aria-label="Copy Bare"
                  title="Copy Bare"
                  onClick={() => copy(formats.bare, "bare")}
                  className="shrink-0 rounded-none border-[#1a1a1a] bg-black text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c] disabled:opacity-50"
                >
                  {copiedKey === "bare" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>

        {input && (
          <div className="animate-crt-on origin-center">
            {!isValid ? (
              <ToolStatus tone="error">
                <div className="font-mono">Invalid MAC address length. Found {cleanMac.length} hex digits, expected 12.</div>
              </ToolStatus>
            ) : (
              <ToolStatus tone="success">
                <div className="flex flex-col gap-1 font-mono w-full">
                  <span>Valid MAC Address detected</span>
                  <span className="text-purple-400 font-bold">Vendor: {vendor}</span>
                </div>
              </ToolStatus>
            )}
          </div>
        )}

      </div>
    </ToolLayout>
  );
}
