import assert from "node:assert/strict";
import { test } from "node:test";
import { extractTimestamp, parseLogTimeline, timelineToCsv } from "../src/lib/log-timeline.ts";

test("extracts ISO, Apache and syslog timestamps", () => {
  const reference = new Date("2026-09-08T12:00:00Z");
  assert.equal(extractTimestamp("2026-09-08T10:00:00Z ssh login", reference)?.timestamp.toISOString(), "2026-09-08T10:00:00.000Z");
  assert.equal(extractTimestamp('10/Sep/2023:10:00:00 +0000 GET /', reference)?.timestamp.toISOString(), "2023-09-10T10:00:00.000Z");
  assert.equal(extractTimestamp("Sep 08 11:00:00 host sshd", reference)?.timestamp.getFullYear(), 2026);
});

test("sorts timestamped entries while preserving untimestamped order", () => {
  const result = parseLogTimeline([
    "no timestamp A",
    "2026-09-08T12:00:00Z later",
    "2026-09-08T11:00:00Z earlier",
    "no timestamp B"
  ].join("\n"), new Date("2026-09-08T13:00:00Z"));

  assert.deepEqual(result.entries.map(entry => entry.originalText), [
    "2026-09-08T11:00:00Z earlier",
    "2026-09-08T12:00:00Z later",
    "no timestamp A",
    "no timestamp B"
  ]);
  assert.deepEqual({ total: result.total, withTime: result.withTime, noTime: result.noTime }, { total: 4, withTime: 2, noTime: 2 });
});

test("exports CSV cells safely", () => {
  const result = parseLogTimeline('2026-09-08T11:00:00Z message, with "quotes"');
  const csv = timelineToCsv(result.entries);
  assert.match(csv, /timestamp_utc,timestamp_detected,raw_log/);
  assert.match(csv, /"2026-09-08T11:00:00Z message, with ""quotes"""/);
});
