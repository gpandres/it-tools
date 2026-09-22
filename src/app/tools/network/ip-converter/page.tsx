"use client";

import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/components/notification-provider";
import {
  ToolActionButton, ToolConfirmDialog, ToolPanel, ToolPanelHeader,
  ToolPanelTitle, ToolPanelBody, ToolField, ToolStatus,
} from "@/components/tool-design";

type Source = "ipv4" | "decimal" | "hex";
const fields = [
  { id: "ipv4", label: "IPv4 address", helper: "Four decimal octets from 0 to 255. Leading zeros are decimal.", placeholder: "192.168.1.1" },
  { id: "decimal", label: "Integer (Decimal)", helper: "An unsigned integer from 0 to 4294967295.", placeholder: "3232235777" },
  { id: "hex", label: "Hexadecimal", helper: "One to eight hex digits, with an optional 0x prefix.", placeholder: "0xC0A80101" },
  { id: "binary", label: "Binary", helper: "Read-only result, grouped into four 8-bit octets.", placeholder: "11000000.10101000.00000001.00000001" },
] as const;

function parseAddress(source: Source, text: string): number | null {
  if (source === "ipv4") {
    const parts = text.split(".");
    return parts.length === 4 && parts.every(part => /^\d+$/.test(part) && Number(part) <= 255)
      ? parts.reduce((value, part) => value * 256 + Number(part), 0) : null;
  }
  if (source === "decimal") {
    const value = Number(text);
    return /^\d+$/.test(text) && value <= 4294967295 ? value : null;
  }
  return /^(?:0x)?[0-9a-f]{1,8}$/i.test(text) ? parseInt(text.replace(/^0x/i, ""), 16) : null;
}

export default function IpConverter() {
  const [input, setInput] = useState({ source: "ipv4" as Source, value: "" });
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();
  const text = input.value.trim();
  const number = text ? parseAddress(input.source, text) : null;
  const invalid = !!text && number === null;
  const values = number === null ? { ipv4: "", decimal: "", hex: "", binary: "" } : {
    ipv4: [24, 16, 8, 0].map(shift => (number >>> shift) & 255).join("."),
    decimal: number.toString(10),
    hex: "0x" + number.toString(16).toUpperCase().padStart(8, "0"),
    binary: number.toString(2).padStart(32, "0").match(/.{8}/g)!.join("."),
  };

  const copy = async (value: string) => {
    if (number === null) return;
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the value and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="IP Address Converter" description="Convert IPv4 addresses between dotted-decimal, integer, hexadecimal and binary formats locally.">
      <div className="space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT">Conversion</ToolPanelTitle>
            <ToolConfirmDialog trigger={<ToolActionButton tone="danger" disabled={!input.value}>Clear</ToolActionButton>}
              title="Clear IP address?" description="The input and all converted formats will be removed." confirmLabel="Clear address"
              onConfirm={() => setInput({ source: "ipv4", value: "" })} finalFocus={() => input.value ? true : inputRef.current} />
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            <p className="text-xs leading-relaxed text-zinc-400">Edit IPv4, decimal or hexadecimal to update all formats. Copy buttons use the normalized values.</p>
            <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
              {fields.map(field => <ToolField key={field.id} htmlFor={field.id} label={field.label} helper={field.helper}>
                <div className="flex min-w-0 items-center gap-2">
                  <Input id={field.id} ref={field.id === "ipv4" ? inputRef : undefined}
                    value={field.id === input.source ? input.value : values[field.id]} readOnly={field.id === "binary"}
                    onChange={event => { if (field.id !== "binary") setInput({ source: field.id, value: event.target.value }); }}
                    placeholder={field.placeholder} spellCheck={false} autoComplete="off"
                    aria-invalid={invalid && field.id === input.source}
                    aria-describedby={invalid && field.id === input.source ? "ip-error" : undefined}
                    className="min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                  <ToolActionButton aria-label={`Copy ${field.label}`} disabled={number === null} onClick={() => copy(values[field.id])}><Copy aria-hidden="true" /></ToolActionButton>
                </div>
              </ToolField>)}
            </div>
            {invalid && <ToolStatus id="ip-error" tone="error" title="Invalid IP value">{fields.find(field => field.id === input.source)?.helper} Correct the input to restore converted values.</ToolStatus>}
            {!text && <ToolStatus title="Awaiting IP address">Enter an IPv4 address, decimal integer or hexadecimal value to begin.</ToolStatus>}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
