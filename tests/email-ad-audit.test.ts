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

test("email audit covers attachment, header and infrastructure indicators", () => {
  const findings = analyzeEmailHeaders(`Date: Thu, 01 Jan 1970 00:00:00 +0000
From: CEO <ceo@corp.example>
Sender: attacker@evil.example
X-Internal-Server-Auth: Basic YWRtaW46cGFzc3dvcmQxMjM=
DKIM-Signature: v=1; a=rsa-sha1; d=corp.example;
X-Mailer: PHPMailer 5.2.1
Received: from [10.0.4.15]
Content-Type: application/x-msdownload
Content-Disposition: attachment; filename="invoice.pdf.exe"
<a href="http://evil.example/factura.exe">download</a>`);

  assert.ok(findings.some(finding => finding.id.startsWith("sender-from-mismatch:")));
  assert.ok(findings.some(finding => finding.id.startsWith("header-credential:")));
  assert.ok(findings.some(finding => finding.id.startsWith("weak-dkim-algorithm:")));
  assert.ok(findings.some(finding => finding.id.startsWith("suspicious-attachment:")));
  assert.ok(findings.some(finding => finding.id.startsWith("dangerous-mime:")));
  assert.ok(findings.some(finding => finding.id.startsWith("http-executable-link:")));
  assert.ok(findings.some(finding => finding.id.startsWith("suspicious-date:")));
  assert.ok(findings.some(finding => finding.id.startsWith("private-ip-disclosure:")));
  assert.ok(findings.some(finding => finding.id.startsWith("outdated-mailer:")));
});
