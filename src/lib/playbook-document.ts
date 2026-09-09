import type { Runbook } from "../app/tools/sysadmin/runbook/components/types.ts";
import { parseRunbook } from "./runbook-validation.ts";

export const INCIDENT_PHASES = ["Prepare", "Detect", "Contain", "Eradicate", "Recover", "Review"] as const;
export const INCIDENT_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;

export type IncidentPhase = typeof INCIDENT_PHASES[number];
export type IncidentPriority = typeof INCIDENT_PRIORITIES[number];

export type IncidentContext = {
  phase: IncidentPhase;
  priority: IncidentPriority;
  incidentCommander: string;
  technicalLead: string;
  communicationsLead: string;
  escalationCriteria: string;
};

export type PlaybookDocument = {
  version: 1;
  playbook: Runbook;
  incident: IncidentContext;
};

export const defaultIncidentContext = (): IncidentContext => ({
  phase: "Prepare",
  priority: "High",
  incidentCommander: "",
  technicalLead: "",
  communicationsLead: "",
  escalationCriteria: "Escalate when scope, business impact, or regulatory exposure is confirmed.",
});

function boundedText(value: unknown, fallback: string, max = 500): string {
  return typeof value === "string" && value.length <= max ? value : fallback;
}

function parseIncidentContext(value: unknown): IncidentContext {
  if (!value || typeof value !== "object") return defaultIncidentContext();
  const candidate = value as Partial<IncidentContext>;
  const defaults = defaultIncidentContext();
  return {
    phase: INCIDENT_PHASES.includes(candidate.phase as IncidentPhase) ? candidate.phase as IncidentPhase : defaults.phase,
    priority: INCIDENT_PRIORITIES.includes(candidate.priority as IncidentPriority) ? candidate.priority as IncidentPriority : defaults.priority,
    incidentCommander: boundedText(candidate.incidentCommander, defaults.incidentCommander),
    technicalLead: boundedText(candidate.technicalLead, defaults.technicalLead),
    communicationsLead: boundedText(candidate.communicationsLead, defaults.communicationsLead),
    escalationCriteria: boundedText(candidate.escalationCriteria, defaults.escalationCriteria, 2000),
  };
}

export function createPlaybookDocument(playbook: Runbook, incident = defaultIncidentContext()): PlaybookDocument {
  return { version: 1, playbook, incident };
}

// Accept legacy raw Runbook exports so existing drafts and shared links keep working.
export function parsePlaybookDocument(value: unknown): PlaybookDocument | null {
  const rawPlaybook = parseRunbook(value);
  if (rawPlaybook) return createPlaybookDocument(rawPlaybook);
  if (!value || typeof value !== "object") return null;
  const candidate = value as { version?: unknown; playbook?: unknown; incident?: unknown };
  if (candidate.version !== 1) return null;
  const playbook = parseRunbook(candidate.playbook);
  return playbook ? createPlaybookDocument(playbook, parseIncidentContext(candidate.incident)) : null;
}

export function playbookMarkdown(document: PlaybookDocument): string {
  const { incident, playbook } = document;
  const roles = [
    ["Incident commander", incident.incidentCommander],
    ["Technical lead", incident.technicalLead],
    ["Communications lead", incident.communicationsLead],
  ].filter(([, owner]) => owner.trim());
  const variables = playbook.variables.map(variable => `- **${variable.name}**: ${variable.description} (Default: ${variable.defaultValue || "None"})`).join("\n") || "- None";
  const steps = playbook.steps.map((step, index) => {
    const body = step.description || step.content || "";
    const command = step.command ? `\n\n\`\`\`bash\n${step.command}\n\`\`\`` : "";
    const expected = step.expectedResult ? `\n\n**Expected result:** ${step.expectedResult}` : "";
    const checklist = step.items?.length ? `\n\n${step.items.map(item => `- [ ] ${item}`).join("\n")}` : "";
    const decision = step.type === "decision" ? `\n\n**Decision:** ${step.decisionQuestion || ""}\n- **YES** → ${step.decisionTrueNext || "End"}\n- **NO** → ${step.decisionFalseNext || "End"}` : "";
    return `### ${index + 1}. [${step.type.toUpperCase()}] ${step.title}\n${body}${command}${expected}${checklist}${decision}`.trim();
  }).join("\n\n") || "No steps defined.";
  return `# ${playbook.title}\n\n${playbook.description}\n\n## Incident command\n- **Current phase:** ${incident.phase}\n- **Priority:** ${incident.priority}\n${roles.map(([label, owner]) => `- **${label}:** ${owner}`).join("\n")}${incident.escalationCriteria ? `\n- **Escalation criteria:** ${incident.escalationCriteria}` : ""}\n\n## Variables\n${variables}\n\n## Steps\n\n${steps}\n`;
}
