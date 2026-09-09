"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INCIDENT_PHASES, INCIDENT_PRIORITIES, type IncidentContext } from "@/lib/playbook-document";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolBadge } from "@/components/tool-design";

type IncidentCommandPanelProps = {
  incident: IncidentContext;
  onChange: (incident: IncidentContext) => void;
};

export function IncidentCommandPanel({ incident, onChange }: IncidentCommandPanelProps) {
  const update = (changes: Partial<IncidentContext>) => onChange({ ...incident, ...changes });
  return (
    <ToolPanel>
      <ToolPanelHeader className="flex-col items-stretch gap-4">
        <div className="flex items-start justify-between gap-3 w-full">
          <div>
            <ToolPanelTitle marker="IN" className="text-sm text-[#ffb000] glow-amber">Incident command</ToolPanelTitle>
            <p className="mt-1 text-xs text-zinc-500">Keep ownership, escalation, and response phase visible while the procedure is built.</p>
          </div>
          <ToolBadge tone="success">LOCAL DRAFT</ToolBadge>
        </div>
      </ToolPanelHeader>
      <ToolPanelBody>
        <ToolField htmlFor="incident-phase" label="RESPONSE PHASE">
          <div className="flex flex-wrap gap-2" id="incident-phase">
            {INCIDENT_PHASES.map(phase => (
              <button 
                key={phase} 
                type="button" 
                onClick={() => update({ phase })} 
                aria-pressed={incident.phase === phase} 
                className={`border px-2.5 py-1.5 text-[10px] tracking-wider transition-colors ${incident.phase === phase ? "border-[#00ff9c] bg-[#071710] text-[#00ff9c]" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"}`}
              >
                {phase.toUpperCase()}
              </button>
            ))}
          </div>
        </ToolField>
        
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ToolField htmlFor="incident-priority" label="PRIORITY">
            <Select value={incident.priority} onValueChange={priority => update({ priority: priority as IncidentContext["priority"] })}>
              <SelectTrigger id="incident-priority" className="rounded-none border-[#1a1a1a] bg-black font-mono focus:ring-[#00ff9c]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#1a1a1a] bg-black">
                {INCIDENT_PRIORITIES.map(priority => (
                  <SelectItem key={priority} value={priority} className="font-mono text-sm focus:bg-[#1a1a1a]">{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ToolField>
          
          <ToolField htmlFor="incident-commander" label="INCIDENT COMMANDER">
            <Input 
              id="incident-commander" 
              value={incident.incidentCommander} 
              onChange={event => update({ incidentCommander: event.target.value })} 
              placeholder="Name or on-call role" 
              className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
            />
          </ToolField>
          
          <ToolField htmlFor="technical-lead" label="TECHNICAL LEAD">
            <Input 
              id="technical-lead" 
              value={incident.technicalLead} 
              onChange={event => update({ technicalLead: event.target.value })} 
              placeholder="Name or team" 
              className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
            />
          </ToolField>
          
          <ToolField htmlFor="communications-lead" label="COMMUNICATIONS LEAD">
            <Input 
              id="communications-lead" 
              value={incident.communicationsLead} 
              onChange={event => update({ communicationsLead: event.target.value })} 
              placeholder="Name or team" 
              className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
            />
          </ToolField>
        </div>
        
        <div className="mt-4">
          <ToolField htmlFor="escalation-criteria" label="ESCALATION CRITERIA">
            <Input 
              id="escalation-criteria" 
              value={incident.escalationCriteria} 
              onChange={event => update({ escalationCriteria: event.target.value })} 
              className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
            />
          </ToolField>
        </div>
      </ToolPanelBody>
    </ToolPanel>
  );
}
