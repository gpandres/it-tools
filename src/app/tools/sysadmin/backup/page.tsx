"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolStatGrid, ToolStat, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateBackupMetrics, type BackupSizeUnit, type BackupSpeedUnit } from "@/lib/backup-calculations";

const fields = [
  { key: "size", label: "Total data size", min: 0, step: "any", helper: "Decimal units: 1 TB = 1,000 GB." },
  { key: "change", label: "Daily change rate (%)", min: 0, max: 100, step: "any", helper: "Percentage of the full dataset copied each day." },
  { key: "speed", label: "Transfer speed", min: 0, step: "any", helper: "Must be greater than zero." },
  { key: "efficiency", label: "Effective throughput (%)", min: 1, max: 100, step: "any", helper: "Accounts for protocol overhead, storage speed and congestion." },
  { key: "retention", label: "Daily incrementals to retain", min: 0, step: "1", helper: "Kept alongside one full backup." },
  { key: "overhead", label: "Storage overhead (%)", min: 0, max: 100, step: "any", helper: "Extra capacity for metadata and operational headroom." },
] as const;
type FieldKey = typeof fields[number]["key"];
const control = "w-full min-w-0 rounded-none border-[#1a1a1a] bg-black! text-zinc-300";
function formatTime(seconds: number) {
  if (seconds === 0) return "0s";
  if (seconds < 1) return "<1s";
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) return Math.floor(hours / 24) + "d " + hours % 24 + "h " + minutes % 60 + "m";
  if (hours) return hours + "h " + minutes % 60 + "m";
  return minutes ? minutes + "m " + Math.floor(seconds % 60) + "s" : Math.floor(seconds) + "s";
}
const formatCapacity = (value: number) => value > 0 && value < .01 ? value.toExponential(3) : value.toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function BackupCalculatorTool() {
  const [values, setValues] = useState<Record<FieldKey, string>>({ size: "5", change: "5", speed: "1", efficiency: "80", retention: "30", overhead: "20" });
  const [sizeUnit, setSizeUnit] = useState<BackupSizeUnit>("TB");
  const [speedUnit, setSpeedUnit] = useState<BackupSpeedUnit>("Gbps");
  const errors = Object.fromEntries(fields.map(field => {
    const value = Number(values[field.key]);
    const max = "max" in field ? field.max : Infinity;
    const invalid = !values[field.key].trim() || !Number.isFinite(value) || value < field.min || value > max || (field.key === "speed" && value === 0) || (field.key === "retention" && !Number.isSafeInteger(value));
    return [field.key, invalid ? (field.key === "speed" ? "Enter a finite speed greater than zero." : field.key === "retention" ? "Enter a non-negative whole number." : "Enter a finite value of at least " + field.min + (Number.isFinite(max) ? " and at most " + max : "") + ".") : ""];
  })) as Record<FieldKey, string>;
  const metrics = calculateBackupMetrics({ size: Number(values.size), sizeUnit, changeRatePercent: Number(values.change), transferSpeed: Number(values.speed), speedUnit, retentionDays: Number(values.retention), efficiencyPercent: Number(values.efficiency), overheadPercent: Number(values.overhead) });
  const invalid = Object.values(errors).some(Boolean);
  const overflow = !Object.values(metrics).every(Number.isFinite);
  const unavailable = invalid || overflow;
  const result = (value: string) => unavailable ? "—" : value;

  return <ToolLayout title="Backup Window Calculator" description="Estimate full and incremental backup times and storage for one full backup plus daily changes.">
    <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-6 lg:grid-cols-2">
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="IN">Backup assumptions</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ToolField htmlFor="backup-size-unit" label="Data unit">
              <Select value={sizeUnit} onValueChange={value => { if (value === "GB" || value === "TB") setSizeUnit(value); }}>
                <SelectTrigger id="backup-size-unit" className={control}><SelectValue>{sizeUnit}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value="GB">GB</SelectItem><SelectItem value="TB">TB</SelectItem></SelectContent>
              </Select>
            </ToolField>
            <ToolField htmlFor="backup-speed-unit" label="Speed unit">
              <Select value={speedUnit} onValueChange={value => { if (value === "Gbps" || value === "MB/s") setSpeedUnit(value); }}>
                <SelectTrigger id="backup-speed-unit" className={control}><SelectValue>{speedUnit}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value="Gbps">Gbps</SelectItem><SelectItem value="MB/s">MB/s</SelectItem></SelectContent>
              </Select>
            </ToolField>
            {fields.map(field => <ToolField key={field.key} htmlFor={"backup-" + field.key} label={field.label}>
              <Input id={"backup-" + field.key} type="number" min={field.min} max={"max" in field ? field.max : undefined} step={field.step} value={values[field.key]} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))} className={control} aria-invalid={!!errors[field.key]} aria-describedby={"backup-" + field.key + "-help"} />
              <p id={"backup-" + field.key + "-help"} className={"text-xs leading-relaxed " + (errors[field.key] ? "text-red-400" : "text-zinc-400")}>{errors[field.key] || field.helper}</p>
            </ToolField>)}
          </div>
          {unavailable && <ToolStatus tone="error">{invalid ? "Correct the highlighted inputs to calculate the backup estimate." : "These values are too large to calculate. Reduce the dataset, retention or transfer duration."}</ToolStatus>}
        </ToolPanelBody>
      </ToolPanel>
      <div className="min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Time & capacity</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolStatGrid className="grid-cols-1 sm:grid-cols-2">
              <ToolStat label="Full backup time" value={result(formatTime(metrics.fullTimeSeconds))} context="At the selected effective throughput" />
              <ToolStat label="Daily incremental time" value={result(formatTime(metrics.incrementalTimeSeconds))} tone="success" context={unavailable ? undefined : formatCapacity(metrics.incrementalMB / 1000) + " GB per day"} />
              <ToolStat label="Destination storage" value={result(formatCapacity(metrics.storageNeededTB) + " TB")} context="One full backup + retained incrementals" />
              <ToolStat label="Recommended capacity" value={result(formatCapacity(metrics.recommendedStorageTB) + " TB")} tone="attention" context={unavailable ? undefined : "Includes " + values.overhead + "% extra capacity"} />
            </ToolStatGrid>
            <p className="text-xs leading-relaxed text-zinc-400">All sizes use decimal units. 1 Gbps = 125 MB/s before the effective-throughput adjustment. Zero daily changes require no incremental transfer.</p>
          </ToolPanelBody>
        </ToolPanel>
        <ToolStatus tone="neutral" title="Planning estimate">Assumes one full backup and the selected number of daily incrementals. Compression, deduplication, concurrent jobs and additional full backups are not included. Check these assumptions against your backup policy.</ToolStatus>
      </div>
    </div>
  </ToolLayout>;
}
