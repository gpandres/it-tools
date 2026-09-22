"use client";

import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { cidrToMaskInt, intToIp, ipToInt } from "@/lib/network";
import { useNotification } from "@/components/notification-provider";
import {
  ToolActionButton, ToolConfirmDialog, ToolPanel, ToolPanelHeader,
  ToolPanelTitle, ToolPanelBody, ToolField, ToolStatus,
} from "@/components/tool-design";

const fields = [
  { id: "cidr", label: "CIDR prefix", helper: "Whole number from 0 to 32, without the slash.", placeholder: "24" },
  { id: "mask", label: "Subnet mask", helper: "Four decimal octets with contiguous leading 1 bits.", placeholder: "255.255.255.0" },
  { id: "wildcard", label: "Wildcard mask", helper: "Read-only inverse of the subnet mask.", placeholder: "0.0.0.255" },
  { id: "total", label: "Total IPs", helper: "All addresses in the block, including network and broadcast addresses.", placeholder: "256" },
] as const;

type Source = "cidr" | "mask";
function parsePrefix(source: Source, text: string): number | null {
  if (source === "cidr") return /^(?:0|[1-9]\d*)$/.test(text) && Number(text) <= 32 ? Number(text) : null;
  try {
    const mask = ipToInt(text);
    for (let prefix = 0; prefix <= 32; prefix++) {
      if (cidrToMaskInt(prefix) === mask) return prefix;
    }
  } catch { /* Invalid dotted-decimal mask. */ }
  return null;
}

export default function CidrConverter() {
  const [input, setInput] = useState({ source: "cidr" as Source, value: "24" });
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();
  const text = input.value.trim();
  const prefix = text ? parsePrefix(input.source, text) : null;
  const invalid = !!text && prefix === null;
  const mask = prefix === null ? null : cidrToMaskInt(prefix);
  const values = prefix === null || mask === null ? { cidr: "", mask: "", wildcard: "", total: "" } : {
    cidr: String(prefix), mask: intToIp(mask), wildcard: intToIp((~mask) >>> 0), total: String(2 ** (32 - prefix)),
  };
  const copy = async (value: string) => {
    if (prefix === null) return;
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the value and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="CIDR & Subnet Mask Converter" description="Convert between IPv4 prefix lengths and subnet masks, with wildcard masks and total address counts.">
      <div className="space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT">Conversion</ToolPanelTitle>
            <ToolConfirmDialog trigger={<ToolActionButton tone="danger" disabled={!input.value}>Clear</ToolActionButton>}
              title="Clear subnet values?" description="The input and all converted values will be removed." confirmLabel="Clear values"
              onConfirm={() => setInput({ source: "cidr", value: "" })} finalFocus={() => input.value ? true : inputRef.current} />
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            <p className="text-xs leading-relaxed text-zinc-400">Edit the prefix or subnet mask to update all values. Copying a prefix includes its leading slash.</p>
            <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
              {fields.map(field => <ToolField key={field.id} htmlFor={field.id} label={field.label} helper={field.helper}>
                <div className="flex min-w-0 items-center gap-2">
                  <Input id={field.id} ref={field.id === "cidr" ? inputRef : undefined}
                    value={field.id === input.source ? input.value : values[field.id]} readOnly={field.id === "wildcard" || field.id === "total"}
                    onChange={event => { if (field.id === "cidr" || field.id === "mask") setInput({ source: field.id, value: event.target.value }); }}
                    placeholder={field.placeholder} spellCheck={false} autoComplete="off"
                    aria-invalid={invalid && field.id === input.source}
                    aria-describedby={invalid && field.id === input.source ? "cidr-error" : undefined}
                    className="min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                  <ToolActionButton aria-label={`Copy ${field.label}`} disabled={prefix === null} onClick={() => copy(field.id === "cidr" ? `/${values.cidr}` : values[field.id])}><Copy aria-hidden="true" /></ToolActionButton>
                </div>
              </ToolField>)}
            </div>
            {invalid && <ToolStatus id="cidr-error" tone="error" title="Invalid subnet value">{input.source === "cidr" ? "Enter a whole number from 0 to 32." : "Enter a valid IPv4 mask with contiguous leading 1 bits, such as 255.255.255.0."} Correct the input to restore converted values.</ToolStatus>}
            {!text && <ToolStatus title="Awaiting subnet">Enter a CIDR prefix or subnet mask to begin.</ToolStatus>}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
