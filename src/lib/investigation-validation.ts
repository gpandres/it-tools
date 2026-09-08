import type { InvestigationCase, IOC, TimelineEvent } from "@/app/tools/security/investigation/components/types";

const text = (value: unknown, max: number, required = false): value is string =>
  typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);
const IOC_TYPES = ["ip", "domain", "url", "hash", "email", "other"] as const;
const IOC_TAGS = ["malicious", "suspicious", "benign", "unknown"] as const;

function isIOC(value: unknown): value is IOC {
  if (!value || typeof value !== "object") return false;
  const ioc = value as Partial<IOC>;
  return text(ioc.id, 128, true) && IOC_TYPES.includes(ioc.type as typeof IOC_TYPES[number]) &&
    text(ioc.value, 4096, true) && IOC_TAGS.includes(ioc.tag as typeof IOC_TAGS[number]) &&
    (ioc.notes === undefined || text(ioc.notes, 4096)) && typeof ioc.timestamp === "number" && Number.isFinite(ioc.timestamp);
}

function isTimelineEvent(value: unknown): value is TimelineEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<TimelineEvent>;
  return text(event.id, 128, true) && text(event.timestamp, 128, true) && text(event.description, 10000, true) &&
    (event.source === undefined || text(event.source, 500));
}

export function parseInvestigationCase(value: unknown): InvestigationCase | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<InvestigationCase>;
  if (!text(item.id, 128, true) || !text(item.title, 500) || !text(item.description, 5000) || !text(item.findings, 50000)) return null;
  if (!Number.isFinite(item.createdAt) || !Number.isFinite(item.updatedAt)) return null;
  if (!Array.isArray(item.iocs) || item.iocs.length > 500 || !item.iocs.every(isIOC)) return null;
  if (!Array.isArray(item.timeline) || item.timeline.length > 1000 || !item.timeline.every(isTimelineEvent)) return null;
  const ids = [...item.iocs.map((ioc) => ioc.id), ...item.timeline.map((event) => event.id)];
  if (new Set(ids).size !== ids.length) return null;
  return item as InvestigationCase;
}
