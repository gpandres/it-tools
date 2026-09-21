"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolActionPanel, ToolBadge, ToolConfirmDialog, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/components/notification-provider";
import { useState, useRef } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from "uuid";
import { ulid } from "ulid";

const formats = [
  { value: "uuid-v4", label: "UUID v4", description: "Random identifiers.", generate: () => uuidv4() },
  { value: "uuid-v7", label: "UUID v7", description: "Time-ordered identifiers with a random component.", generate: () => uuidv7() },
  { value: "ulid", label: "ULID", description: "Time-based identifiers encoded with 26 characters.", generate: () => ulid() },
  { value: "uuid-v1", label: "UUID v1", description: "Legacy time-based identifiers.", generate: () => uuidv1() },
] as const;

export default function UuidGenerator() {
  const [quantity, setQuantity] = useState("1");
  const [type, setType] = useState<string>("uuid-v4");
  const [result, setResult] = useState<{ text: string; label: string; count: number } | null>(null);
  const [error, setError] = useState("");
  const quantityRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();
  const selectedFormat = formats.find(format => format.value === type)!;
  const count = Number(quantity);
  const validQuantity = /^\d+$/.test(quantity) && count >= 1 && count <= 1000;

  const generate = () => {
    if (!validQuantity) return;
    try {
      const ids = Array.from({ length: count }, () => selectedFormat.generate());
      setResult({ text: ids.join("\n"), label: selectedFormat.label, count });
      setError("");
    } catch {
      setError("Could not generate identifiers. Check that your browser supports secure random generation and try again.");
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the identifiers and copy them manually.", "error");
    }
  };

  return (
    <ToolLayout title="UUID & ULID Generator" description="Generate UUID v1, v4, v7 or ULID identifiers locally, one at a time or in batches.">
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN">Configuration</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            <ToolActionPanel label="FORMAT">
              {formats.map(format => <ToolActionButton key={format.value} aria-pressed={type === format.value} tone={type === format.value ? "accent" : "neutral"} onClick={() => { setType(format.value); setError(""); }}>{format.label}</ToolActionButton>)}
            </ToolActionPanel>
            <p className="text-xs text-zinc-400">{selectedFormat.description}</p>
            <ToolField htmlFor="uuid-quantity" label="Quantity" helper="Enter a whole number between 1 and 1,000.">
              <Input id="uuid-quantity" ref={quantityRef} type="number" min={1} max={1000} step={1} value={quantity}
                onChange={event => { setQuantity(event.target.value); setError(""); }} aria-invalid={!validQuantity} aria-describedby={!validQuantity ? "uuid-quantity-error" : undefined}
                className="rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
            </ToolField>
            {!validQuantity && <ToolStatus id="uuid-quantity-error" tone="error" title="Invalid quantity">Use a whole number from 1 to 1,000.</ToolStatus>}
            {error && <ToolStatus tone="error" title="Generation failed">{error}</ToolStatus>}
            <ToolActionButton tone="accent" disabled={!validQuantity} onClick={generate}><RefreshCw aria-hidden="true" />Generate</ToolActionButton>
            <p className="text-xs leading-relaxed text-zinc-400">Generate replaces the previous batch. Changing settings keeps existing identifiers until you generate again.</p>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Generated IDs</ToolPanelTitle>
            <div className="flex flex-wrap gap-2">
              <ToolActionButton disabled={!result} onClick={copy}><Copy aria-hidden="true" />Copy</ToolActionButton>
              <ToolConfirmDialog trigger={<ToolActionButton tone="danger" disabled={!result}>Clear</ToolActionButton>}
                title="Clear generated IDs?" description="The generated batch will be removed. Copy it first if you need to keep it." confirmLabel="Clear IDs"
                onConfirm={() => setResult(null)} finalFocus={() => result ? true : quantityRef.current} />
            </div>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {result ? <>
              <ToolBadge>{result.label} · {result.count} {result.count === 1 ? "ID" : "IDs"}</ToolBadge>
              <ToolField htmlFor="uuid-output" label="Output IDs" helper="One identifier per line. Copy includes the complete batch.">
                <Textarea id="uuid-output" readOnly value={result.text} wrap="off" spellCheck={false}
                  className="h-96 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
              </ToolField>
            </> : <ToolEmptyState title="Awaiting identifiers">Choose a format and quantity, then select Generate.</ToolEmptyState>}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
