import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTerraform } from "../src/lib/terraform-audit.ts";

test("Terraform audit evaluates HCL assignments without treating placeholders as secrets", () => {
  const findings = analyzeTerraform(`resource "aws_security_group_rule" "admin" {
  cidr_blocks = ["0.0.0.0/0"]
  encrypted = false
  actions = ["*"]
  password = "real-password"
  deletion_protection = false
}`);

  assert.ok(findings.some(finding => finding.id.startsWith("public-network:")));
  assert.ok(findings.some(finding => finding.id.startsWith("unencrypted:")));
  assert.ok(findings.some(finding => finding.id.startsWith("iam-wildcard:")));
  assert.ok(findings.some(finding => finding.id.startsWith("hardcoded-secret:")));
  assert.ok(findings.some(finding => finding.id.startsWith("deletion-protection:")));
  assert.ok(findings.every(finding => finding.line > 0));
  assert.equal(analyzeTerraform('variable "db_password" { default = "replace-me" }').some(finding => finding.id.startsWith("hardcoded-secret:")), false);
});

test("Terraform audit reports unbalanced HCL without throwing", () => {
  const findings = analyzeTerraform('resource "aws_s3_bucket" "logs" {\n  bucket = "logs"');
  assert.ok(findings.some(finding => finding.id.startsWith("parse-error:")));
});
