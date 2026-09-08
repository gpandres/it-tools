import type { Runbook, RunbookEdge, RunbookStep, RunbookVariable, StepType } from "@/app/tools/sysadmin/runbook/components/types";

const STEP_TYPES: readonly StepType[] = ["checklist", "command", "information", "decision", "verification", "warning"];
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;

function isVariable(value: unknown): value is RunbookVariable {
  if (!value || typeof value !== "object") return false;
  const variable = value as Partial<RunbookVariable>;
  return text(variable.name, 100) && text(variable.description, 2000) &&
    (variable.defaultValue === undefined || text(variable.defaultValue, 2000)) &&
    (variable.value === undefined || text(variable.value, 2000));
}

function isStep(value: unknown): value is RunbookStep {
  if (!value || typeof value !== "object") return false;
  const step = value as Partial<RunbookStep>;
  if (!text(step.id, 128) || !STEP_TYPES.includes(step.type as StepType) || !text(step.title, 500)) return false;
  if (step.description !== undefined && !text(step.description, 5000)) return false;
  if (step.content !== undefined && !text(step.content, 20000)) return false;
  if (step.command !== undefined && !text(step.command, 20000)) return false;
  if (step.expectedResult !== undefined && !text(step.expectedResult, 5000)) return false;
  if (step.decisionQuestion !== undefined && !text(step.decisionQuestion, 2000)) return false;
  if (step.decisionTrueNext !== undefined && !text(step.decisionTrueNext, 128)) return false;
  if (step.decisionFalseNext !== undefined && !text(step.decisionFalseNext, 128)) return false;
  if (step.items !== undefined && (!Array.isArray(step.items) || step.items.length > 100 || !step.items.every((item) => text(item, 2000)))) return false;
  if (step.uiPosition !== undefined && (!step.uiPosition || !Number.isFinite(step.uiPosition.x) || !Number.isFinite(step.uiPosition.y))) return false;
  return true;
}

function isEdge(value: unknown): value is RunbookEdge {
  if (!value || typeof value !== "object") return false;
  const edge = value as Partial<RunbookEdge>;
  return text(edge.id, 256) && text(edge.source, 128) && text(edge.target, 128) &&
    (edge.sourceHandle === undefined || text(edge.sourceHandle, 64)) &&
    (edge.label === undefined || text(edge.label, 100));
}

export function parseRunbook(value: unknown): Runbook | null {
  if (!value || typeof value !== "object") return null;
  const runbook = value as Partial<Runbook>;
  if (!text(runbook.id, 128) || !text(runbook.title, 500) || !text(runbook.description, 5000)) return null;
  if (!Array.isArray(runbook.variables) || runbook.variables.length > 100 || !runbook.variables.every(isVariable)) return null;
  if (!Array.isArray(runbook.steps) || runbook.steps.length > 500 || !runbook.steps.every(isStep)) return null;
  if (runbook.edges !== undefined && (!Array.isArray(runbook.edges) || runbook.edges.length > 1000 || !runbook.edges.every(isEdge))) return null;
  if (runbook.hiddenEdges !== undefined && (!Array.isArray(runbook.hiddenEdges) || runbook.hiddenEdges.length > 1000 || !runbook.hiddenEdges.every(edge => text(edge, 256)))) return null;
  const ids = new Set(runbook.steps.map((step) => step.id));
  return runbook.steps.every((step) =>
    (!step.decisionTrueNext || ids.has(step.decisionTrueNext)) &&
    (!step.decisionFalseNext || ids.has(step.decisionFalseNext)) &&
    !(step.decisionTrueNext && step.decisionTrueNext === step.decisionFalseNext)
  ) && (runbook.edges || []).every(edge => ids.has(edge.source) && ids.has(edge.target)) ? runbook as Runbook : null;
}
