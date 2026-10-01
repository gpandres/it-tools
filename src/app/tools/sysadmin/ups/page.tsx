"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolStatGrid, ToolStat, ToolStatus, ToolDisclosure, ToolActionButton } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UPS_PRESETS } from "@/lib/ups-presets";

const fields = [
  { key: "voltage", label: "Voltage per battery (V)", helper: "Nominal voltage of one battery.", max: Infinity },
  { key: "capacity", label: "Capacity per battery (Ah)", helper: "Amp-hour rating of one battery.", max: Infinity },
  { key: "count", label: "Number of batteries", helper: "1–40 identical batteries.", max: 40 },
  { key: "load", label: "Total load (W)", helper: "Actual power consumed by the connected equipment.", max: Infinity },
  { key: "efficiency", label: "Inverter efficiency (%)", helper: "Percentage of battery power delivered to the load.", max: 100 },
  { key: "derating", label: "Usable battery capacity (%)", helper: "Capacity remaining after age, temperature and discharge-rate losses.", max: 100 },
] as const;
type FieldKey = typeof fields[number]["key"];
const control = "w-full min-w-0 rounded-none border-[#1a1a1a] bg-black! text-zinc-300";
const format = (value: number) => value > 0 && value < .1 ? value.toExponential(2) : value.toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function UpsCalculatorTool() {
  const [values, setValues] = useState<Record<FieldKey, string>>({ voltage: "12", capacity: "9", count: "2", load: "300", efficiency: "85", derating: "80" });
  const [topology, setTopology] = useState<"parallel" | "series">("parallel");
  const [appliedPreset, setAppliedPreset] = useState("");
  const errors = Object.fromEntries(fields.map(field => {
    const value = Number(values[field.key]);
    const invalid = !values[field.key].trim() || !Number.isFinite(value) || value <= 0 || value > field.max || (field.key === "count" && !Number.isInteger(value));
    return [field.key, invalid ? field.key === "count" ? "Enter 1–40 whole batteries." : "Enter a finite value greater than zero" + (Number.isFinite(field.max) ? " and at most " + field.max : "") + "." : ""];
  })) as Record<FieldKey, string>;
  const voltage = Number(values.voltage);
  const capacity = Number(values.capacity);
  const count = Number(values.count);
  const efficiency = Number(values.efficiency) / 100;
  const totalWh = voltage * capacity * count;
  const usableWh = totalWh * efficiency * Number(values.derating) / 100;
  const runtime = usableWh / Number(values.load) * 60;
  const draw = Number(values.load) / efficiency;
  const bankVoltage = topology === "series" ? voltage * count : voltage;
  const bankAh = topology === "parallel" ? capacity * count : capacity;
  const current = draw / bankVoltage;
  const invalid = Object.values(errors).some(Boolean);
  const overflow = ![totalWh, usableWh, runtime, draw, bankVoltage, bankAh, current].every(Number.isFinite);
  const unavailable = invalid || overflow;
  const result = (value: number, unit: string) => unavailable ? "—" : format(value) + " " + unit;

  return <ToolLayout title="UPS Runtime Calculator" description="Estimate backup time from battery capacity, load and inverter efficiency.">
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN">Battery & load</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map(field => <ToolField key={field.key} htmlFor={"ups-" + field.key} label={field.label}>
                <Input id={"ups-" + field.key} type="number" min={field.key === "count" ? 1 : 0} max={Number.isFinite(field.max) ? field.max : undefined} step={field.key === "count" ? "1" : "any"} value={values[field.key]} onChange={event => { setValues(previous => ({ ...previous, [field.key]: event.target.value })); setAppliedPreset(""); }} className={control} aria-invalid={!!errors[field.key]} aria-describedby={"ups-" + field.key + "-help"} />
                <p id={"ups-" + field.key + "-help"} className={"text-xs leading-relaxed " + (errors[field.key] ? "text-red-400" : "text-zinc-400")}>{errors[field.key] || field.helper}</p>
              </ToolField>)}
            </div>
            <ToolField htmlFor="ups-topology" label="Battery bank topology">
              <Select value={topology} onValueChange={value => { if (value === "parallel" || value === "series") { setTopology(value); setAppliedPreset(""); } }}>
                <SelectTrigger id="ups-topology" className={control}><SelectValue>{topology === "parallel" ? "Parallel · same voltage, more Ah" : "Series · higher voltage, same Ah"}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value="parallel">Parallel · same voltage, more Ah</SelectItem><SelectItem value="series">Series · higher voltage, same Ah</SelectItem></SelectContent>
              </Select>
            </ToolField>
            {unavailable && <ToolStatus tone="error">{invalid ? "Correct the highlighted inputs to estimate runtime." : "These values exceed the calculation range. Reduce the battery capacity or load range."}</ToolStatus>}
            {appliedPreset && <ToolStatus tone="success">Applied {appliedPreset}. Load and efficiency assumptions are unchanged.</ToolStatus>}
          </ToolPanelBody>
        </ToolPanel>
        <div className="min-w-0 space-y-6">
          <ToolPanel>
            <ToolPanelHeader><ToolPanelTitle marker="OUT">Estimated runtime</ToolPanelTitle></ToolPanelHeader>
            <ToolPanelBody className="space-y-4">
              <ToolStat label="Battery backup time" value={result(runtime, "min")} tone="success" context={unavailable ? undefined : format(runtime / 60) + " hours · energy-based estimate"} />
              <ToolStatGrid className="grid-cols-1 sm:grid-cols-2">
                <ToolStat label="Nominal energy" value={result(totalWh, "Wh")} />
                <ToolStat label="Energy delivered" value={result(usableWh, "Wh")} />
                <ToolStat label="Battery draw" value={result(draw, "W")} tone="attention" />
                <ToolStat label="Bank current" value={result(current, "A")} />
                <ToolStat label="Bank voltage" value={result(bankVoltage, "V")} />
                <ToolStat label="Bank capacity" value={result(bankAh, "Ah")} />
              </ToolStatGrid>
              <p className="text-xs leading-relaxed text-zinc-400">For the same batteries, series and parallel configurations have the same nominal energy. Bank voltage and current differ.</p>
            </ToolPanelBody>
          </ToolPanel>
          <ToolStatus tone="neutral" title="Estimate, not a runtime curve">This model includes inverter efficiency and usable capacity, but not discharge curves, low-voltage cutoff or inverter idle consumption. Compare the result with the manufacturer&apos;s load curve and output power rating. Short runtimes can be optimistic.</ToolStatus>
        </div>
      </div>
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="SET">Battery presets</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody>
          <ToolDisclosure title="Model battery profiles">
            <p className="mb-4 text-xs leading-relaxed text-zinc-400">Starting values for common models. Confirm the battery specification for your regional SKU. Applying a profile changes only the battery values and topology.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {UPS_PRESETS.map(preset => <ToolActionButton key={preset.id} className="h-auto min-w-0 flex-col items-start gap-2 whitespace-normal p-4 text-left" onClick={() => {
                setValues(previous => ({ ...previous, voltage: String(preset.voltage), capacity: String(preset.capacityAh), count: String(preset.batteries) }));
                setTopology(preset.topology);
                setAppliedPreset(preset.vendor + " " + preset.model);
              }}>
                <span>{preset.vendor} · {preset.model}</span>
                <span className="text-xs font-normal normal-case tracking-normal text-zinc-300">{preset.rating} · {preset.battery}</span>
                <span className="text-xs font-normal normal-case tracking-normal text-zinc-400">{preset.note}</span>
              </ToolActionButton>)}
            </div>
          </ToolDisclosure>
        </ToolPanelBody>
      </ToolPanel>
    </div>
  </ToolLayout>;
}
