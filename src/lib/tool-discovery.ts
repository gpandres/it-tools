import Fuse from "fuse.js";
import { toolsRegistry, type ToolDefinition } from "./tools.ts";

const searchIndex = new Fuse(toolsRegistry, {
  keys: [
    { name: "name", weight: 3 }, { name: "aliases", weight: 2 },
    { name: "keywords", weight: 1.5 }, { name: "category", weight: 1 },
    { name: "vendors", weight: 1 }, { name: "technologies", weight: 1 },
  ],
  threshold: 0.3, ignoreLocation: true,
});

export function searchTools(query: string): ToolDefinition[] {
  return query.trim() ? searchIndex.search(query.trim()).map(result => result.item) : toolsRegistry;
}

export const workflows = [
  { id: "investigate", name: "Investigate an incident", description: "Inspect logs, build a timeline, consult ATT&CK and document your response.", toolIds: ["log-parser", "log-timeline", "mitre-reference", "incident-playbook", "incident-report"] },
  { id: "network", name: "Plan a network change", description: "Size the network, build access rules, simulate traffic and prepare a runbook.", toolIds: ["subnet-calculator", "vlsm-calculator", "acl-builder", "acl-simulator", "runbook-builder"] },
  { id: "recovery", name: "Plan recovery", description: "Set recovery targets, estimate storage and backup windows, then document the procedure.", toolIds: ["rpo-rto-calculator", "storage-calculator", "backup-calculator", "runbook-builder"] },
] as const;

// Curated entry points for people who are seeing the catalogue for the first time.
// Keep these IDs in the registry so the home page can retain one source of truth for tool metadata.
export const featuredWorkspaces = [
  {
    id: "network-diagram",
    eyebrow: "DESIGN",
    summary: "Map infrastructure visually, shape a topology, and export a network plan.",
  },
  {
    id: "runbook-builder",
    eyebrow: "OPERATE",
    summary: "Turn repeatable operational work into an executable, documented runbook.",
  },
  {
    id: "investigation-workspace",
    eyebrow: "INVESTIGATE",
    summary: "Collect evidence, indicators, findings, and timelines in one local case workspace.",
  },
  {
    id: "incident-playbook",
    eyebrow: "RESPOND",
    summary: "Build a clear incident-response process around roles, decisions, and actions.",
  },
  {
    id: "sigma-builder",
    eyebrow: "DETECT",
    summary: "Create portable detection rules for SIEM and EDR workflows without sending logs away.",
  },
  {
    id: "kubernetes-auditor",
    eyebrow: "HARDEN",
    summary: "Audit Kubernetes manifests for privilege, RBAC, secrets, and workload-hardening issues.",
  },
  {
    id: "acl-builder",
    eyebrow: "PROTECT",
    summary: "Design reusable, cross-vendor access rules and test traffic decisions before rollout.",
  },
  {
    id: "terraform-analyzer",
    eyebrow: "REVIEW",
    summary: "Inspect infrastructure-as-code for public exposure, weak IAM, and risky defaults.",
  },
] as const;

export const roleRecommendations = [
  {
    id: "blue-team",
    name: "Blue Team",
    description: "Investigate incidents, build detections, and document the response.",
    toolIds: ["investigation-workspace", "log-parser", "sigma-builder"],
  },
  {
    id: "devops",
    name: "DevOps",
    description: "Review code and infrastructure before they reach production.",
    toolIds: ["secrets-scanner", "kubernetes-auditor", "github-actions-auditor"],
  },
  {
    id: "sysadmin",
    name: "Sysadmin",
    description: "Plan change, recovery, and day-to-day infrastructure operations.",
    toolIds: ["runbook-builder", "backup-calculator", "rpo-rto-calculator"],
  },
  {
    id: "network-engineer",
    name: "Network Engineer",
    description: "Design, size, and protect network infrastructure.",
    toolIds: ["network-diagram", "vlsm-calculator", "acl-builder"],
  },
] as const;

export function relatedToolsFor(id: string): ToolDefinition[] {
  const current = toolsRegistry.find(tool => tool.id === id);
  if (!current) return [];
  const linked = workflows.filter(flow => (flow.toolIds as readonly string[]).includes(id)).flatMap(flow => [...flow.toolIds]);
  const candidates = [...new Set([...linked, ...toolsRegistry.filter(tool => tool.category === current.category).map(tool => tool.id)])];
  return candidates.filter(candidate => candidate !== id).slice(0, 4).flatMap(candidate => {
    const tool = toolsRegistry.find(tool => tool.id === candidate);
    return tool ? [tool] : [];
  });
}

export function toolDataFlow(tool: ToolDefinition): { label: string; description: string } {
  if (tool.dataFlow === "network" || tool.id === "headers-scorecard") {
    return { label: "Network request", description: "This tool sends the value you submit to a network service. Review the destination and response before using it with sensitive data." };
  }
  if (tool.dataFlow === "mixed") {
    return { label: "Local processing · external service", description: "Most processing happens in your browser, but part of this tool uses an external service when you request it. Do not submit sensitive data unless you trust that service." };
  }
  return { label: "Local processing", description: "This tool processes your input in your browser." };
}
