export const MAX_TIMELINE_INPUT_LENGTH = 5_000_000;
export const MAX_TIMELINE_ENTRIES = 20_000;

export type TimelineEntry = {
  id: number;
  originalText: string;
  timestamp: Date | null;
  timestampStr: string;
};

export type TimelineParseResult = {
  entries: TimelineEntry[];
  total: number;
  withTime: number;
  noTime: number;
  truncated: boolean;
};

type TimestampMatch = { timestamp: Date; text: string };

const TIMESTAMP_PATTERNS = [
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/i,
  /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/i,
  /\d{2}\/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/\d{4}:\d{2}:\d{2}:\d{2}\s+[+-]\d{4}/i,
  /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?/
];

function parseCandidate(value: string, referenceDate: Date): Date | null {
  const syslog = value.match(/^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})$/i);
  if (syslog) {
    const year = referenceDate.getFullYear();
    let parsed = new Date(`${syslog[1]} ${syslog[2]} ${year} ${syslog[3]}`);
    if (Number.isNaN(parsed.getTime())) return null;

    // A log line from the future is normally from the previous year (New Year rollover).
    if (parsed.getTime() > referenceDate.getTime() + 86_400_000) {
      parsed = new Date(`${syslog[1]} ${syslog[2]} ${year - 1} ${syslog[3]}`);
    }
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const apache = value.replace(/(\d{2}\/[A-Za-z]{3}\/\d{4}):/, "$1 ");
  const parsed = new Date(apache);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function extractTimestamp(line: string, referenceDate = new Date()): TimestampMatch | null {
  for (const pattern of TIMESTAMP_PATTERNS) {
    const match = line.match(pattern);
    if (!match) continue;
    const timestamp = parseCandidate(match[0], referenceDate);
    if (timestamp) return { timestamp, text: match[0] };
  }
  return null;
}

export function parseLogTimeline(input: string, referenceDate = new Date()): TimelineParseResult {
  const boundedInput = input.slice(0, MAX_TIMELINE_INPUT_LENGTH);
  const lines = boundedInput.split(/\r?\n/).filter(line => line.trim().length > 0);
  const truncated = input.length > MAX_TIMELINE_INPUT_LENGTH || lines.length > MAX_TIMELINE_ENTRIES;
  const sourceLines = lines.slice(0, MAX_TIMELINE_ENTRIES);
  let withTime = 0;

  const entries = sourceLines.map((line, index) => {
    const match = extractTimestamp(line, referenceDate);
    if (match) withTime += 1;
    return {
      id: index,
      originalText: line,
      timestamp: match?.timestamp ?? null,
      timestampStr: match?.text ?? ""
    };
  });

  entries.sort((a, b) => {
    if (a.timestamp && b.timestamp) return a.timestamp.getTime() - b.timestamp.getTime() || a.id - b.id;
    if (a.timestamp) return -1;
    if (b.timestamp) return 1;
    return a.id - b.id;
  });

  return {
    entries,
    total: lines.length,
    withTime,
    noTime: lines.length - withTime,
    truncated
  };
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function timelineToCsv(entries: TimelineEntry[]): string {
  const rows = entries.map(entry => [
    entry.timestamp?.toISOString() ?? "",
    entry.timestampStr,
    entry.originalText
  ].map(csvCell).join(","));
  return ["timestamp_utc,timestamp_detected,raw_log", ...rows].join("\n");
}
