"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INCIDENT_PHASES, INCIDENT_PRIORITIES, type IncidentContext } from "@/lib/playbook-document";

type IncidentCommandPanelProps = {
  incident: IncidentContext;
  onChange: (incident: IncidentContext) => void;
};

export function IncidentCommandPanel({ incident, onChange }: IncidentCommandPanelProps) {
  const update = (changes: Partial<IncidentContext>) => onChange({ ...incident, ...changes });
  return <section aria-labelledby="incident-command-heading" className="border border-[#1a1a1a] bg-[#080808] p-4 sm:p-5">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 id="incident-command-heading" className="text-sm font-bold text-[#ffb000]">Incident command</h2>
        <p className="mt-1 text-xs text-zinc-500">Keep ownership, escalation, and response phase visible while the procedure is built.</p>
      </div>
      <span className="text-[10px] tracking-widest text-[#00ff9c]">LOCAL DRAFT</span>
    </div>
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Incident response phase">
      {INCIDENT_PHASES.map(phase => <button key={phase} type="button" onClick={() => update({ phase })} aria-pressed={incident.phase === phase} className={`border px-2.5 py-1.5 text-[10px] tracking-wider transition-colors ${incident.phase === phase ? "border-[#00ff9c] bg-[#071710] text-[#00ff9c]" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"}`}>{phase.toUpperCase()}</button>)}
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div>
        <Label className="mb-2 block text-xs text-zinc-400">Priority</Label>
        <Select value={incident.priority} onValueChange={priority => update({ priority: priority as IncidentContext["priority"] })}>
          <SelectTrigger className="h-9 border-[#1a1a1a] bg-black text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="border-[#1a1a1a] bg-black">{INCIDENT_PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label htmlFor="incident-commander" className="mb-2 block text-xs text-zinc-400">Incident commander</Label><Input id="incident-commander" value={incident.incidentCommander} onChange={event => update({ incidentCommander: event.target.value })} placeholder="Name or on-call role" className="h-9 border-[#1a1a1a] bg-black text-xs" /></div>
      <div><Label htmlFor="technical-lead" className="mb-2 block text-xs text-zinc-400">Technical lead</Label><Input id="technical-lead" value={incident.technicalLead} onChange={event => update({ technicalLead: event.target.value })} placeholder="Name or team" className="h-9 border-[#1a1a1a] bg-black text-xs" /></div>
      <div><Label htmlFor="communications-lead" className="mb-2 block text-xs text-zinc-400">Communications lead</Label><Input id="communications-lead" value={incident.communicationsLead} onChange={event => update({ communicationsLead: event.target.value })} placeholder="Name or team" className="h-9 border-[#1a1a1a] bg-black text-xs" /></div>
    </div>
    <div className="mt-4"><Label htmlFor="escalation-criteria" className="mb-2 block text-xs text-zinc-400">Escalation criteria</Label><Input id="escalation-criteria" value={incident.escalationCriteria} onChange={event => update({ escalationCriteria: event.target.value })} className="h-9 border-[#1a1a1a] bg-black text-xs" /></div>
  </section>;
}
