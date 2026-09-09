"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useNotification } from "@/components/notification-provider";
import { ToolActionButton, ToolActionPanel } from "@/components/tool-action-panel";
import { ToolTerminalOutput } from "@/components/tool-design";

export type VendorOutput = {
  id: string;
  label: string;
  code: string;
};

type MultiVendorOutputProps = {
  outputs: VendorOutput[];
  activeId: string;
  onActiveChange: (id: string) => void;
  label?: string;
};

export function MultiVendorOutput({ outputs, activeId, onActiveChange, label = "OUTPUT" }: MultiVendorOutputProps) {
  const { notify } = useNotification();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeOutput = outputs.find(output => output.id === activeId) ?? outputs[0];

  if (!activeOutput) return null;

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(activeOutput.code);
      setCopiedId(activeOutput.id);
      notify(`${activeOutput.label} configuration copied.`);
      window.setTimeout(() => setCopiedId(current => current === activeOutput.id ? null : current), 1800);
    } catch {
      notify("Clipboard access is unavailable in this browser.", "error");
    }
  };

  return (
    <section className="overflow-hidden border border-[#1a1a1a] bg-[#050505]">
      <ToolActionPanel label={label} className="rounded-none border-0 bg-[#0a0a0a]">
        <div role="tablist" aria-label="Vendor output" className="flex min-w-0 flex-1 flex-wrap gap-1">
          {outputs.map(output => (
            <button
              key={output.id}
              type="button"
              role="tab"
              aria-selected={activeOutput.id === output.id}
              onClick={() => onActiveChange(output.id)}
              className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeOutput.id === output.id
                  ? "border-[#00ff9c]/60 bg-[#00ff9c]/10 text-[#00ff9c]"
                  : "border-[#1a1a1a] bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {output.label}
            </button>
          ))}
        </div>
        <ToolActionButton type="button" onClick={copyOutput} aria-label={`Copy ${activeOutput.label} configuration`}>
          {copiedId === activeOutput.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copiedId === activeOutput.id ? "Copied" : "Copy"}
        </ToolActionButton>
      </ToolActionPanel>
      <div role="tabpanel" aria-label={`${activeOutput.label} configuration`} className="min-w-0">
        <ToolTerminalOutput
          title={`${activeOutput.label} configuration`}
          status="read only"
          className="border-0 border-t border-[#1a1a1a]"
          lines={activeOutput.code.split("\n").map((line, i) => ({
            id: `line-${i}`,
            content: line || " ",
            tone: "success",
          }))}
        />
      </div>
    </section>
  );
}
