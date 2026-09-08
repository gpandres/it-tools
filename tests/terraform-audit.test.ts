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

test("Terraform audit distinguishes public databases and covers cloud hardening", () => {
  const findings = analyzeTerraform(`resource "aws_db_instance" "main" {
  publicly_accessible = true
  storage_encrypted = false
  skip_final_snapshot = true
}
resource "aws_instance" "app" {
  associate_public_ip_address = true
  metadata_options { http_tokens = "optional" }
  user_data = <<-EOF
    password = "admin-password-123"
  EOF
}
resource "aws_s3_bucket" "data" { bucket = "example" }
resource "aws_iam_policy" "admin" { Action = "*" Resource = "*" }
secret_key = "long-secret-value"`);

  assert.ok(findings.some(finding => finding.id.startsWith("public-database:")));
  assert.ok(findings.some(finding => finding.id.startsWith("unencrypted:")));
  assert.ok(findings.some(finding => finding.id.startsWith("deletion-protection:")));
  assert.ok(findings.some(finding => finding.id.startsWith("public-instance-ip:")));
  assert.ok(findings.some(finding => finding.id.startsWith("cloud-metadata:")));
  assert.ok(findings.some(finding => finding.id.startsWith("hardcoded-secret:")));
  assert.ok(findings.some(finding => finding.id.startsWith("iam-wildcard:")));
  assert.ok(findings.some(finding => finding.id.startsWith("s3-hardening:")));
  assert.equal(findings.some(finding => finding.id.startsWith("public-storage:") && finding.excerpt.includes("publicly_accessible")), false);
});
