"use client";

import { useState } from "react";
import { HardDrive } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolStatGrid, ToolStat, ToolStatus, ToolProgress, ToolEmptyState } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const levels = {
  "0": { label: "RAID 0 · Stripe", min: 2, description: "Data is striped across all drives. A single drive failure loses the array." },
  "1": { label: "RAID 1 · Mirror", min: 2, description: "One dataset is mirrored across every drive. Usable capacity equals one drive. Support for more than two mirror members depends on the controller." },
  "5": { label: "RAID 5 · Single parity", min: 3, description: "Data and parity are distributed across all drives. Parity uses the equivalent capacity of one drive." },
  "6": { label: "RAID 6 · Double parity", min: 4, description: "Data and double parity are distributed across all drives. Parity uses the equivalent capacity of two drives." },
  "10": { label: "RAID 10 · Stripe of mirrors", min: 4, description: "Data is striped across two-drive mirror pairs. One drive can fail in each pair; losing both members of any pair loses the array." },
} as const;
type RaidLevel = keyof typeof levels;
const control = "w-full min-w-0 rounded-none border-[#1a1a1a] bg-black! text-zinc-300";
const format = (value: number) => value > 0 && value < .001 ? value.toExponential(3) : value.toLocaleString("en-US", { maximumFractionDigits: 3 });

export default function RaidCalculatorTool() {
  const [level, setLevel] = useState<RaidLevel>("5");
  const [driveCount, setDriveCount] = useState("4");
  const [driveSize, setDriveSize] = useState("4");
  const [unit, setUnit] = useState("TB");
  const count = Number(driveCount);
  const size = Number(driveSize);
  const spec = levels[level];
  const countError = !Number.isInteger(count) || count < spec.min || count > 24 || (level === "10" && count % 2 !== 0)
    ? "Enter " + spec.min + "–24 whole drives" + (level === "10" ? ", in mirrored pairs." : ".") : "";
  const sizeError = !driveSize.trim() || !Number.isFinite(size) || size <= 0 || !Number.isFinite(size * count) ? "Enter a finite capacity greater than zero." : "";
  const valid = !countError && !sizeError;
  const dataDrives = level === "1" ? 1 : level === "10" ? count / 2 : level === "5" ? count - 1 : level === "6" ? count - 2 : count;
  const usable = dataDrives * size;
  const tolerance = level === "0" ? "0 drives" : level === "1" ? (count - 1) + " drives" : level === "5" ? "1 drive" : level === "6" ? "2 drives" : "1 per mirror pair";
  const result = (value: string) => valid ? value : "—";

  return <ToolLayout title="RAID Calculator" description="Compare array capacity, redundancy and idealized performance for equal-sized drives.">
    <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-6 lg:grid-cols-3">
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="IN">Array configuration</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-4">
          <ToolField htmlFor="raid-level" label="RAID level">
            <Select value={level} onValueChange={value => { if (value && value in levels) setLevel(value as RaidLevel); }}>
              <SelectTrigger id="raid-level" className={control}><SelectValue>{spec.label}</SelectValue></SelectTrigger>
              <SelectContent>{(Object.keys(levels) as RaidLevel[]).map(key => <SelectItem key={key} value={key}>{levels[key].label}</SelectItem>)}</SelectContent>
            </Select>
          </ToolField>
          <ToolField htmlFor="raid-count" label="Number of drives">
            <Input id="raid-count" type="number" min={spec.min} max="24" step={level === "10" ? "2" : "1"} value={driveCount} onChange={event => setDriveCount(event.target.value)} className={control} aria-invalid={!!countError} aria-describedby="raid-count-help" />
            <p id="raid-count-help" className={"text-xs " + (countError ? "text-red-400" : "text-zinc-400")}>{countError || "Up to 24 equal-sized drives. No hot spares included."}</p>
          </ToolField>
          <ToolField htmlFor="raid-size" label="Capacity per drive">
            <Input id="raid-size" type="number" min="0" step="any" value={driveSize} onChange={event => setDriveSize(event.target.value)} className={control} aria-invalid={!!sizeError} aria-describedby={sizeError ? "raid-size-error" : undefined} />
            {sizeError && <p id="raid-size-error" className="text-xs text-red-400">{sizeError}</p>}
          </ToolField>
          <ToolField htmlFor="raid-unit" label="Capacity unit">
            <Select value={unit} onValueChange={value => { if (value) setUnit(value); }}>
              <SelectTrigger id="raid-unit" className={control}><SelectValue>{unit}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value="GB">GB</SelectItem><SelectItem value="TB">TB</SelectItem></SelectContent>
            </Select>
          </ToolField>
          {!valid && <ToolStatus tone="error">Correct the inputs to calculate this array.</ToolStatus>}
        </ToolPanelBody>
      </ToolPanel>
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Capacity & resilience</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolStatGrid className="grid-cols-1 sm:grid-cols-2">
              <ToolStat label="Usable capacity" value={result(format(usable) + " " + unit)} tone="success" />
              <ToolStat label="Drive fault tolerance" value={result(tolerance)} />
              <ToolStat label="Raw capacity" value={result(format(count * size) + " " + unit)} />
              <ToolStat label="Redundancy overhead" value={result(format((count - dataDrives) * size) + " " + unit)} tone="attention" />
            </ToolStatGrid>
            {valid && <ToolProgress label="Storage efficiency" value={dataDrives / count * 100} valueLabel={(dataDrives / count * 100).toFixed(1) + "% usable"} />}
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="MAP">Drive roles</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {valid ? <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: count }, (_, index) => <li key={index} className="min-w-0 border border-[#1a1a1a] bg-black p-3">
                <HardDrive className="mb-2 size-5 text-[#00ff9c]" aria-hidden="true" />
                <span className="block text-xs font-bold text-zinc-200">Drive {index + 1}</span>
                <span className="mt-1 block text-xs text-zinc-400">{level === "1" ? "Same mirrored data" : level === "10" ? "Mirror pair " + (Math.floor(index / 2) + 1) : level === "5" || level === "6" ? "Data + parity" : "Striped data"}</span>
              </li>)}
            </ul> : <ToolEmptyState title="Array unavailable">Enter a valid drive count and capacity.</ToolEmptyState>}
            <p className="text-xs leading-relaxed text-zinc-400">{spec.description}</p>
          </ToolPanelBody>
        </ToolPanel>
        <ToolStatus tone="neutral" title="Performance & capacity assumptions">
          {valid && <p className="mb-2">Idealized sequential throughput: reads up to {level === "1" || level === "10" ? count : dataDrives}× one drive; writes {level === "5" || level === "6" ? "depend on parity and workload" : "up to " + dataDrives + "× one drive"}. These are scaling limits, not benchmark predictions.</p>}
          Controller, workload, rebuilds and filesystem overhead affect results. GB and TB are decimal units. RAID redundancy does not replace a backup.
        </ToolStatus>
      </div>
    </div>
  </ToolLayout>;
}
