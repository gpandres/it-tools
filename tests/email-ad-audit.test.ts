import assert from "node:assert/strict";
import test from "node:test";
import { analyzeAdPath } from "../src/lib/ad-path-audit.ts";
import { analyzeEmailHeaders } from "../src/lib/email-audit.ts";

test("email audit unfolds headers and evaluates authentication alignment", () => {
  const findings = analyzeEmailHeaders(`Authentication-Results: mx.example; spf=fail; dkim=pass;\n dmarc=fail
From: Finance <finance@example.com>
Reply-To: finance@external.example
Return-Path: <bounce@mailer.example.net>`);
  assert.ok(findings.some(finding => finding.id.startsWith("spf-failure:")));
  assert.ok(findings.some(finding => finding.id.startsWith("dmarc-failure:")));
  assert.ok(findings.some(finding => finding.id.startsWith("reply-to-mismatch:")));
  assert.ok(findings.some(finding => finding.id.startsWith("return-path-mismatch:")));
});

test("AD audit only treats recognized relationship fields as evidence", () => {
  const findings = analyzeAdPath("User: analyst\nRelationship: GenericAll\nTarget: Domain Admins\nadminCount: 1");
  assert.ok(findings.some(finding => finding.id.startsWith("generic-all:")));
  assert.ok(findings.some(finding => finding.id.startsWith("tier0-target:")));
  assert.ok(findings.some(finding => finding.id.startsWith("admin-count:")));
  assert.equal(analyzeAdPath("A user mentioned GenericAll in a note").length, 0);
});
