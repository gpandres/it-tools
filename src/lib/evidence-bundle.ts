import type { IOC, IOCTag, IOCType, InvestigationCase, TimelineEvent } from "@/app/tools/security/investigation/components/types";

export const EVIDENCE_BUNDLE_SCHEMA = "it-tools.evidence-bundle";
export const EVIDENCE_BUNDLE_VERSION = 1;

export type EvidenceSource = "incident-report" | "pcap" | "playbook" | "investigation";

export type EvidenceArtifact = {
  name: string;
  detail: string;
};

export type EvidenceBundle = {
  schema: typeof EVIDENCE_BUNDLE_SCHEMA;
  version: typeof EVIDENCE_BUNDLE_VERSION;
  source: EvidenceSource;
  exportedAt: string;
  title: string;
  description: string;
  iocs: Array<{ type: IOCType; value: string; tag: IOCTag; notes?: string }>;
  timeline: Array<{ timestamp: string; description: string; source?: string }>;
  findings?: string;
  artifacts?: EvidenceArtifact[];
};

const IOC_TYPES: readonly IOCType[] = ["ip", "domain", "url", "hash", "email", "other"];
const IOC_TAGS: readonly IOCTag[] = ["malicious", "suspicious", "benign", "unknown"];
const SOURCES: readonly EvidenceSource[] = ["incident-report", "pcap", "playbook", "investigation"];
const isText = (value: unknown, max: number, required = false): value is string =>
  typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);

function parseIoc(value: unknown): EvidenceBundle["iocs"][number] | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<EvidenceBundle["iocs"][number]>;
  if (!IOC_TYPES.includes(item.type as IOCType) || !IOC_TAGS.includes(item.tag as IOCTag) || !isText(item.value, 4096, true)) return null;
  if (item.notes !== undefined && !isText(item.notes, 4096)) return null;
  return { type: item.type as IOCType, value: item.value.trim(), tag: item.tag as IOCTag, ...(item.notes ? { notes: item.notes } : {}) };
}

function parseTimeline(value: unknown): EvidenceBundle["timeline"][number] | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<EvidenceBundle["timeline"][number]>;
  if (!isText(item.timestamp, 128, true) || !isText(item.description, 10000, true)) return null;
  if (item.source !== undefined && !isText(item.source, 500)) return null;
  return { timestamp: item.timestamp, description: item.description, ...(item.source ? { source: item.source } : {}) };
}

export function parseEvidenceBundle(value: unknown): EvidenceBundle | null {
  if (!value || typeof value !== "object") return null;
  const bundle = value as Partial<EvidenceBundle>;
  if (bundle.schema !== EVIDENCE_BUNDLE_SCHEMA || bundle.version !== EVIDENCE_BUNDLE_VERSION) return null;
  if (!SOURCES.includes(bundle.source as EvidenceSource) || !isText(bundle.exportedAt, 64, true) || !isText(bundle.title, 500) || !isText(bundle.description, 5000)) return null;
  if (!Array.isArray(bundle.iocs) || bundle.iocs.length > 500 || !bundle.iocs.every(item => parseIoc(item))) return null;
  if (!Array.isArray(bundle.timeline) || bundle.timeline.length > 1000 || !bundle.timeline.every(item => parseTimeline(item))) return null;
  if (bundle.findings !== undefined && !isText(bundle.findings, 50000)) return null;
  if (bundle.artifacts !== undefined && (!Array.isArray(bundle.artifacts) || bundle.artifacts.length > 100 || !bundle.artifacts.every(item =>
    !!item && typeof item === "object" && isText((item as EvidenceArtifact).name, 200, true) && isText((item as EvidenceArtifact).detail, 5000, true)
  ))) return null;
  const keys = bundle.iocs.map(item => `${item.type}:${item.value.toLowerCase()}`);
  return new Set(keys).size === keys.length ? bundle as EvidenceBundle : null;
}

export function createEvidenceBundle(input: Omit<EvidenceBundle, "schema" | "version" | "exportedAt">): EvidenceBundle {
  return {
    ...input,
    schema: EVIDENCE_BUNDLE_SCHEMA,
    version: EVIDENCE_BUNDLE_VERSION,
    exportedAt: new Date().toISOString()
  };
}

export function investigationFromEvidenceBundle(bundle: EvidenceBundle, id: string, now = Date.now()): InvestigationCase {
  const iocs: IOC[] = bundle.iocs.map(item => ({ ...item, id: crypto.randomUUID(), timestamp: now }));
  const timeline: TimelineEvent[] = bundle.timeline.map(item => ({ ...item, id: crypto.randomUUID() }));
  const artifactNotes = bundle.artifacts?.length
    ? `\n\n## Imported Evidence\n${bundle.artifacts.map(item => `- **${item.name}:** ${item.detail}`).join("\n")}`
    : "";
  return {
    id,
    title: bundle.title || "Imported Investigation",
    description: bundle.description,
    createdAt: now,
    updatedAt: now,
    iocs,
    timeline,
    findings: `${bundle.findings || ""}${artifactNotes}`.trim()
  };
}
