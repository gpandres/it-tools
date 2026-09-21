"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { useNotification } from "@/components/notification-provider";
import { ToolActionButton, ToolConfirmDialog, ToolEmptyState, ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolStatus } from "@/components/tool-design";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();
  const text = input.trim();
  const isValid = /^(?:[0-9a-f]{12}|(?:[0-9a-f]{2}:){5}[0-9a-f]{2}|(?:[0-9a-f]{2}-){5}[0-9a-f]{2}|(?:[0-9a-f]{4}\.){2}[0-9a-f]{4})$/i.test(text);
  const cleanMac = isValid ? text.replace(/[:.-]/g, "").toUpperCase() : "";
  const vendor = isValid ? COMMON_VENDORS[cleanMac.slice(0, 6)] || "Unknown (not in the bundled database)" : "";
  const formats = [
    { id: "ieee", label: "IEEE 802 (Windows)", value: cleanMac.match(/.{2}/g)?.join("-") || "" },
    { id: "unix", label: "UNIX / Linux", value: cleanMac.match(/.{2}/g)?.join(":") || "" },
    { id: "cisco", label: "Cisco", value: cleanMac.match(/.{4}/g)?.join(".") || "" },
    { id: "bare", label: "Bare / Raw", value: cleanMac },
  ];

  const copy = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the address and copy it manually.", "error");
    }
  };

  const generateRandom = () => {
    const hexChars = "0123456789ABCDEF";
    let mac = "";
    for (let i = 0; i < 12; i++) mac += hexChars[Math.floor(Math.random() * 16)];
    setInput(mac.match(/.{2}/g)!.join("-"));
  };

  return (
    <ToolLayout title="MAC Address Formatter" description="Validate and convert 48-bit MAC addresses. Look up known vendor prefixes in the bundled offline database.">
      <div className="space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN">Input MAC</ToolPanelTitle>
            <div className="flex flex-wrap gap-2">
              <ToolActionButton onClick={generateRandom}><RefreshCw aria-hidden="true" />Random</ToolActionButton>
              <ToolConfirmDialog trigger={<ToolActionButton tone="danger" disabled={!input}>Clear</ToolActionButton>}
                title="Clear MAC address?" description="The input, converted formats and vendor result will be removed." confirmLabel="Clear address"
                onConfirm={() => setInput("")} finalFocus={() => input ? true : inputRef.current} />
            </div>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolField htmlFor="mac-input" label="MAC address" helper="Use 12 hex digits, six pairs separated by colons or hyphens, or three groups of four separated by dots.">
              <Input id="mac-input" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} placeholder="00:50:56:12:34:56 or 0050.5612.3456"
                aria-invalid={!!text && !isValid} aria-describedby={text && !isValid ? "mac-error" : undefined}
                className="rounded-none border-[#1a1a1a] bg-black! text-zinc-300" spellCheck={false} />
            </ToolField>
            {text && !isValid && <ToolStatus id="mac-error" tone="error" title="Invalid MAC address">Enter exactly 12 hexadecimal digits in one supported format. Mixed separators and extra characters are not accepted.</ToolStatus>}
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Formats</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody>
            {isValid ? <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
              {formats.map(format => <ToolField key={format.id} htmlFor={`format-${format.id}`} label={format.label}>
                <div className="flex min-w-0 items-center gap-2">
                  <Input id={`format-${format.id}`} readOnly value={format.value} className="min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                  <ToolActionButton aria-label={`Copy ${format.label}`} onClick={() => copy(format.value)}><Copy aria-hidden="true" /></ToolActionButton>
                </div>
              </ToolField>)}
            </div> : <ToolEmptyState title={text ? "Fix the address to continue" : "Awaiting MAC address"}>Enter an address or generate a random example to see its formats.</ToolEmptyState>}
          </ToolPanelBody>
        </ToolPanel>
        {isValid && <ToolStatus tone="success" title="Valid MAC address format">
          <p className="break-words">Vendor prefix: {vendor}</p>
          <p className="mt-2">The offline database contains selected prefixes only. This lookup does not verify a device&apos;s identity.</p>
        </ToolStatus>}
      </div>
    </ToolLayout>
  );
}
