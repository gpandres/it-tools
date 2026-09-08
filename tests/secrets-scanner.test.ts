import assert from "node:assert/strict";
import { test } from "node:test";
import { scanSecrets } from "../src/lib/secrets-scanner.ts";

test("detects provider tokens with line and redacted context", () => {
  const findings = scanSecrets("safe=true\nTOKEN=ghp_123456789012345678901234567890\n");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 2);
  assert.equal(findings[0].column, 7);
  assert.equal(findings[0].detector, "GitHub token");
  assert.match(findings[0].maskedValue, /•/);
  assert.doesNotMatch(findings[0].context, /123456789012345678901234567890/);
});

test("uses entropy for generic assignments and ignores placeholders", () => {
  assert.equal(scanSecrets("API_TOKEN=replace-me").length, 0);
  assert.equal(scanSecrets("API_TOKEN=K8s-3f9a-8Qv2-pL7x-1Nw6").length, 1);
});

test("supports intentional finding suppression", () => {
  assert.equal(scanSecrets("TOKEN=ghp_123456789012345678901234567890 # gitleaks:allow").length, 0);
});

test("detects common CI and cloud provider credentials", () => {
  const findings = scanSecrets("GITLAB_TOKEN=glpat-12345678901234567890\nDO_TOKEN=dop_v1_12345678901234567890123456789012\nSENDGRID=SG.1234567890123456.1234567890123456");
  assert.equal(findings.length, 3);
  assert.deepEqual(findings.map(finding => finding.detector), ["GitLab token", "DigitalOcean token", "SendGrid API key"]);
});

test("decodes low-entropy Basic Auth values in assignments", () => {
  const findings = scanSecrets('data:\n  BASIC_AUTH: "YWRtaW46YWRtaW4xMjM="');
  assert.equal(findings.length, 1);
  assert.match(findings[0].detector, /Decoded credential/);
});
