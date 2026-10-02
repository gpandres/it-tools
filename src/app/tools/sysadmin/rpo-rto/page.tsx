"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolStatGrid, ToolStat, ToolStatus, ToolTimeline, ToolEmptyState } from "@/components/tool-design";

const control = "w-full min-w-0 rounded-none border-[#1a1a1a] bg-black! text-zinc-300";
const hours = (value: number) => value > 0 && value < .001 ? value.toExponential(2) : value.toLocaleString("en-US", { maximumFractionDigits: 3 });

export default function RpoRtoCalculatorTool() {
  const [rpoHours, setRpoHours] = useState("24");
  const [rtoHours, setRtoHours] = useState("4");
  const rpo = Number(rpoHours);
  const rto = Number(rtoHours);
  const rpoInvalid = !rpoHours.trim() || !Number.isFinite(rpo) || rpo < 0;
  const rtoInvalid = !rtoHours.trim() || !Number.isFinite(rto) || rto < 0;
  const invalid = rpoInvalid || rtoInvalid;

  return <ToolLayout title="RPO / RTO Calculator" description="Visualize acceptable data loss and recovery time objectives for your disaster recovery plan.">
    <div className="mx-auto grid w-full max-w-6xl min-w-0 items-start gap-6 lg:grid-cols-3">
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="IN">Recovery objectives</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          {[{ id: "rpo", label: "RPO (hours)", value: rpoHours, set: setRpoHours, invalid: rpoInvalid, helper: "Recovery point objective: maximum acceptable age of recoverable data." }, { id: "rto", label: "RTO (hours)", value: rtoHours, set: setRtoHours, invalid: rtoInvalid, helper: "Recovery time objective: target maximum duration of an interruption." }].map(field => <ToolField key={field.id} htmlFor={field.id} label={field.label}>
            <Input id={field.id} type="number" min="0" step="any" value={field.value} onChange={event => field.set(event.target.value)} className={control} aria-invalid={field.invalid} aria-describedby={field.id + "-help"} />
            <p id={field.id + "-help"} className={"text-xs leading-relaxed " + (field.invalid ? "text-red-400" : "text-zinc-400")}>{field.invalid ? "Enter a finite, non-negative number of hours." : field.helper}</p>
          </ToolField>)}
          {invalid && <ToolStatus tone="error">Correct the inputs to show the recovery objectives.</ToolStatus>}
        </ToolPanelBody>
      </ToolPanel>
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Tolerance targets</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody>
            <ToolStatGrid className="grid-cols-1 sm:grid-cols-2">
              <ToolStat label="Acceptable data loss window" value={invalid ? "—" : hours(rpo) + " h"} context="RPO · target, not a predicted loss" tone="attention" />
              <ToolStat label="Target maximum downtime" value={invalid ? "—" : hours(rto) + " h"} context="RTO · target, not a minimum outage" tone="success" />
            </ToolStatGrid>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="MAP">Recovery scenario</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            {invalid ? <ToolEmptyState title="Scenario unavailable">Enter both recovery objectives.</ToolEmptyState> : <ToolTimeline items={[
              { id: "point", timestamp: rpo === 0 ? "At the incident" : hours(rpo) + " h before incident", severity: "RPO boundary", title: "Oldest acceptable recovery point", detail: rpo === 0 ? "The target allows no loss of committed data." : "Recoverable data should be no older than this boundary.", tone: "attention" },
              { id: "incident", timestamp: "T = 0", severity: "Interruption", title: "Incident occurs", detail: "Recovery actions begin; the actual start and duration depend on the incident.", tone: "error" },
              { id: "restored", timestamp: rto === 0 ? "At the incident" : hours(rto) + " h after incident", severity: "RTO deadline", title: "Target for restoring service", detail: rto === 0 ? "The target allows no interruption to service." : "Service should be restored by this target; recovery can finish earlier.", tone: "success" },
            ]} />}
            <p className="text-xs text-zinc-400">Schematic sequence, not a proportional time scale. Zero objectives can coincide with the incident.</p>
          </ToolPanelBody>
        </ToolPanel>
        <ToolStatus tone="neutral" title="Objectives require validation">RPO and RTO express business requirements. Backup frequency alone does not guarantee an RPO, and an RTO does not predict the actual outage. Validate both with recovery exercises and working backups or replication. Business impact depends on the service, not a universal hours-to-severity scale.</ToolStatus>
      </div>
    </div>
  </ToolLayout>;
}
