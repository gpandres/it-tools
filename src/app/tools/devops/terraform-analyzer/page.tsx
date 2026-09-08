"use client";

import { ConfigAuditTool, type AuditRule } from "@/components/config-audit-tool";

const rules: AuditRule[] = [
  { id: "public", label: "Public network exposure", severity: "high", pattern: /0\.0\.0\.0\/0|::\/0/i, explanation: "A rule allows traffic from every IPv4 or IPv6 address.", fix: "Restrict source CIDRs to trusted networks and separate administrative access." },
  { id: "unencrypted", label: "Encryption disabled", severity: "high", pattern: /(?:encrypted|encryption)\s*=\s*false|server_side_encryption_configuration\s*\{\s*$/im, explanation: "The configuration may create storage without an explicit encryption guarantee.", fix: "Require provider-managed or customer-managed encryption and verify it with policy checks." },
  { id: "publicbucket", label: "Public object storage", severity: "high", pattern: /(?:acl|public_access_block)[^\n]*(?:public-read|false)/i, explanation: "Object storage access controls appear to allow public access.", fix: "Enable all public-access blocks and grant access through least-privilege IAM." },
  { id: "iamstar", label: "Wildcard IAM permission", severity: "high", pattern: /(?:actions|resources)\s*=\s*\[\s*["']\*["']/i, explanation: "IAM permissions use a wildcard action or resource.", fix: "Replace wildcards with the smallest required action/resource set." },
  { id: "secret", label: "Credential in HCL", severity: "high", pattern: /(?:password|token|secret|access[_-]?key)\s*=\s*["'][^"']+["']/i, explanation: "A hard-coded credential-like value appears in the configuration.", fix: "Use variables backed by a secret manager and rotate any exposed value." },
  { id: "deletion", label: "Deletion protection disabled", severity: "medium", pattern: /deletion_protection\s*=\s*false/i, explanation: "A critical resource may be deleted without an additional safeguard.", fix: "Enable deletion protection where supported and require reviewed destroy plans." },
];

export default function TerraformAnalyzerPage() { return <ConfigAuditTool title="Terraform Security Analyzer" description="Inspect Terraform configuration locally for exposed services, weak IAM, secrets and unsafe defaults." placeholder={'resource "aws_security_group_rule" "admin" {\n  cidr_blocks = ["0.0.0.0/0"]\n  from_port   = 22\n  to_port     = 22\n}\n\nvariable "db_password" {\n  default = "replace-me"\n}'} rules={rules} />; }
