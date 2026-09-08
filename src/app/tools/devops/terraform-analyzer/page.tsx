"use client";

import { ConfigAuditTool } from "@/components/config-audit-tool";
import { analyzeTerraform } from "@/lib/terraform-audit";

export default function TerraformAnalyzerPage() { return <ConfigAuditTool title="Terraform Security Analyzer" description="Inspect Terraform configuration locally for exposed services, weak IAM, secrets and unsafe defaults." placeholder={'resource "aws_security_group_rule" "admin" {\n  cidr_blocks = ["0.0.0.0/0"]\n  from_port   = 22\n  to_port     = 22\n}\n\nvariable "db_password" {\n  default = "replace-me"\n}'} analyzer={analyzeTerraform} />; }
