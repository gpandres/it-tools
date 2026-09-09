export const DNS_RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA"] as const;
export type DnsRecordType = typeof DNS_RECORD_TYPES[number];
export type DnsRecordSource = "Manual" | "Cloudflare DoH";

export type DnsRecord = {
  id: string;
  domain: string;
  type: DnsRecordType;
  value: string;
  source: DnsRecordSource;
  notes: string;
};

type DnsAnswer = { name?: unknown; type?: unknown; TTL?: unknown; data?: unknown };

const TYPE_BY_CODE: Record<number, DnsRecordType> = {
  1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 257: "CAA",
};

export function normalizeDnsName(value: string): string | null {
  const name = value.trim().toLowerCase().replace(/\.$/, "");
  if (name.length > 253 || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(name)) return null;
  return name;
}

export function parseDnsAnswers(payload: unknown, requestedType: DnsRecordType): Omit<DnsRecord, "id">[] {
  if (!payload || typeof payload !== "object") return [];
  const answers = (payload as { Answer?: unknown }).Answer;
  if (!Array.isArray(answers)) return [];

  return answers.slice(0, 100).flatMap((answer): Omit<DnsRecord, "id">[] => {
    if (!answer || typeof answer !== "object") return [];
    const item = answer as DnsAnswer;
    const domain = typeof item.name === "string" ? normalizeDnsName(item.name) : null;
    const value = typeof item.data === "string" ? item.data.trim().slice(0, 4096) : "";
    const type = typeof item.type === "number" ? TYPE_BY_CODE[item.type] : requestedType;
    if (!domain || !value || !type) return [];
    const ttl = typeof item.TTL === "number" && Number.isFinite(item.TTL) && item.TTL >= 0 ? Math.floor(item.TTL) : null;
    return [{ domain, type, value, source: "Cloudflare DoH", notes: ttl === null ? "" : `TTL: ${ttl}` }];
  });
}

export function mergeDnsRecords(existing: DnsRecord[], incoming: DnsRecord[]): DnsRecord[] {
  const keys = new Set(existing.map(record => `${record.source}\u0000${record.domain}\u0000${record.type}\u0000${record.value}`));
  return [...existing, ...incoming.filter(record => {
    const key = `${record.source}\u0000${record.domain}\u0000${record.type}\u0000${record.value}`;
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  })];
}

function markdownCell(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

export function serializeDnsReconMarkdown(records: DnsRecord[]): string {
  const rows = records.map(record => [record.domain, record.type, record.value, record.source, record.notes]
    .map(markdownCell).join(" | "));
  return ["# DNS Recon Results", "", "| Domain | Type | Value | Source | Notes |", "|---|---|---|---|---|", ...rows.map(row => `| ${row} |`), ""].join("\n");
}
