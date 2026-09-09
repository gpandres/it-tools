import assert from "node:assert/strict";
import test from "node:test";
import { mergeDnsRecords, normalizeDnsName, parseDnsAnswers, serializeDnsReconMarkdown, type DnsRecord } from "../src/lib/dns-recon.ts";

test("DNS Recon accepts normalized FQDNs only", () => {
  assert.equal(normalizeDnsName(" Example.COM. "), "example.com");
  assert.equal(normalizeDnsName("localhost"), null);
  assert.equal(normalizeDnsName("bad domain.test"), null);
});

test("DNS Recon parses bounded typed responses and deduplicates records", () => {
  const records = parseDnsAnswers({ Answer: [{ name: "example.com.", type: 1, TTL: 300, data: "203.0.113.9" }, { name: 4, data: "invalid" }] }, "A")
    .map((record, index) => ({ ...record, id: String(index) }));
  assert.deepEqual(records, [{ id: "0", domain: "example.com", type: "A", value: "203.0.113.9", source: "Cloudflare DoH", notes: "TTL: 300" }]);
  assert.equal(mergeDnsRecords(records, [{ ...records[0], id: "next" }]).length, 1);
});

test("DNS Recon Markdown export keeps table cells intact", () => {
  const records: DnsRecord[] = [{ id: "1", domain: "example.com", type: "TXT", value: "v=spf1 | ~all", source: "Manual", notes: "first\nline" }];
  const markdown = serializeDnsReconMarkdown(records);
  assert.match(markdown, /v=spf1 \\| ~all/);
  assert.match(markdown, /first<br>line/);
});
