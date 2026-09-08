import assert from "node:assert/strict";
import { test } from "node:test";
import { createEvidenceBundle, investigationFromEvidenceBundle, parseEvidenceBundle } from "../src/lib/evidence-bundle.ts";

test("evidence bundles round-trip into an investigation case", () => {
  const bundle = createEvidenceBundle({
    source: "pcap",
    title: "Suspicious capture",
    description: "Locally exported network evidence.",
    iocs: [{ type: "ip", value: "192.0.2.10", tag: "unknown" }],
    timeline: [{ timestamp: "2026-09-08T10:00:00.000Z", description: "Packet observed", source: "sample.pcap" }],
    findings: "## Capture Summary\nOne suspicious source.",
    artifacts: [{ name: "Capture metadata", detail: "Ethernet" }]
  });
  const parsed = parseEvidenceBundle(JSON.parse(JSON.stringify(bundle)));
  assert.ok(parsed);
  const investigation = investigationFromEvidenceBundle(parsed, "case-1", 1000);
  assert.equal(investigation.title, "Suspicious capture");
  assert.equal(investigation.iocs[0]?.value, "192.0.2.10");
  assert.match(investigation.findings, /Capture metadata/);
});

test("evidence bundle validation rejects duplicate indicators and unknown sources", () => {
  const base = createEvidenceBundle({ source: "investigation", title: "Case", description: "", iocs: [], timeline: [] });
  assert.equal(parseEvidenceBundle({ ...base, source: "remote" }), null);
  assert.equal(parseEvidenceBundle({
    ...base,
    iocs: [
      { type: "domain", value: "example.test", tag: "unknown" },
      { type: "domain", value: "EXAMPLE.TEST", tag: "unknown" }
    ]
  }), null);
});
