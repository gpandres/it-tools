"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const decimal = ["KB", "MB", "GB", "TB", "PB"];
const binary = ["KiB", "MiB", "GiB", "TiB", "PiB"];
const multipliers: Record<string, number> = { B: 1, ...Object.fromEntries(decimal.map((unit, i) => [unit, 1000 ** (i + 1)])), ...Object.fromEntries(binary.map((unit, i) => [unit, 1024 ** (i + 1)])) };
const control = "w-full min-w-0 rounded-none border-[#1a1a1a] bg-black! text-zinc-300";
const format = (value: number) => value !== 0 && (value < .0001 || value >= 1e15) ? value.toExponential(6) : value.toLocaleString("en-US", { maximumFractionDigits: 6 });

export default function StorageCalculatorTool() {
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState("TB");
  const bytes = Number(value) * multipliers[unit];
  const error = !value.trim() ? "Enter a capacity to convert." : !Number.isFinite(bytes) || Number(value) < 0 ? "Enter a finite, non-negative capacity." : "";

  return <ToolLayout title="Storage Capacity Calculator" description="Compare decimal (GB, TB) and binary (GiB, TiB) storage units.">
    <div className="mx-auto grid w-full max-w-5xl min-w-0 gap-6 lg:grid-cols-5">
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN">Capacity</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolField htmlFor="storage-value" label="Value to convert">
              <Input id="storage-value" type="number" min="0" step="any" value={value} onChange={event => setValue(event.target.value)} className={control} aria-invalid={!!error} aria-describedby={error ? "storage-error" : undefined} />
            </ToolField>
            <ToolField htmlFor="storage-unit" label="Input unit">
              <Select value={unit} onValueChange={value => { if (value) setUnit(value); }}>
                <SelectTrigger id="storage-unit" className={control}><SelectValue>{unit === "B" ? "Bytes (B)" : unit + " · " + (decimal.includes(unit) ? "decimal" : "binary")}</SelectValue></SelectTrigger>
                <SelectContent>{["B", ...decimal, ...binary].map(unit => <SelectItem key={unit} value={unit}>{unit === "B" ? "Bytes (B)" : unit + " · " + (decimal.includes(unit) ? "decimal" : "binary")}</SelectItem>)}</SelectContent>
              </Select>
            </ToolField>
            <div role="group" aria-label="Capacity presets" className="flex flex-wrap gap-2">
              {[["1", "TB"], ["500", "GB"], ["1", "TiB"]].map(([amount, presetUnit]) => <ToolActionButton key={presetUnit} onClick={() => { setValue(amount); setUnit(presetUnit); }}>{amount} {presetUnit}</ToolActionButton>)}
            </div>
            {error && <ToolStatus id="storage-error" tone="error">{error}</ToolStatus>}
          </ToolPanelBody>
        </ToolPanel>
        <ToolStatus tone="neutral" title="Why does a 1 TB disk show about 931 GiB?">Decimal units use powers of 1,000; binary units use powers of 1,024. A 1 TB disk contains 1,000,000,000,000 bytes, about 931.323 GiB or 0.909 TiB. Some systems display a GB label for a binary value. Formatting and reserved space can reduce available capacity further.</ToolStatus>
      </div>
      <ToolPanel className="lg:col-span-3">
        <ToolPanelHeader><ToolPanelTitle marker="OUT">Conversions</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2">
            {[{ title: "Decimal · SI", units: decimal }, { title: "Binary · IEC", units: binary }].map(group => <div key={group.title} className="min-w-0 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{group.title}</h3>
              <dl className="space-y-4">{group.units.map(target => <div key={target} className="space-y-1">
                <dt className="text-xs text-zinc-400">{target}</dt><dd className="break-all text-sm text-zinc-200">{error ? "—" : format(bytes / multipliers[target])}</dd>
              </div>)}</dl>
            </div>)}
          </div>
          <dl className="border-t border-[#1a1a1a] pt-4"><dt className="text-xs text-zinc-400">Bytes</dt><dd className="mt-1 break-all text-sm text-[#00ff9c]">{error ? "—" : format(bytes)}</dd></dl>
          <p className="text-xs leading-relaxed text-zinc-400">Results are approximate. Very small or large values use scientific notation.</p>
        </ToolPanelBody>
      </ToolPanel>
    </div>
  </ToolLayout>;
}
