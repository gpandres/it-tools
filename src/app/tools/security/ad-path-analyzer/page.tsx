"use client";

import { ConfigAuditTool, type AuditRule } from "@/components/config-audit-tool";

const rules: AuditRule[] = [
  { id: "domainadmin", label: "Domain Admin privilege", severity: "high", pattern: /Domain Admins|DOMAIN ADMINS/i, explanation: "The data contains a path or principal associated with Domain Admins.", fix: "Review shortest paths to Tier 0 and remove unnecessary group memberships." },
  { id: "genericall", label: "GenericAll relationship", severity: "high", pattern: /GenericAll/i, explanation: "GenericAll grants broad control over the target object.", fix: "Replace broad ACLs with the minimum required rights and review inheritance." },
  { id: "dcsync", label: "DCSync privilege", severity: "high", pattern: /DS-Replication-Get-Changes(?:-All)?|DCSync/i, explanation: "Replication rights can enable credential material access from a domain controller.", fix: "Audit principals with replication rights and restrict them to approved domain controllers." },
  { id: "unconstrained", label: "Unconstrained delegation", severity: "high", pattern: /UnconstrainedDelegation|unconstrained delegation/i, explanation: "Unconstrained delegation increases credential forwarding exposure.", fix: "Migrate to constrained or resource-based delegation where possible." },
  { id: "admincount", label: "Protected admin object", severity: "medium", pattern: /adminCount[:=]\s*1/i, explanation: "The object is or was protected by AdminSDHolder and deserves privileged-path review.", fix: "Confirm the account still needs privileged membership and monitor changes." },
];

export default function AdPathAnalyzerPage() { return <ConfigAuditTool title="Active Directory Attack Path Analyzer" description="Review pasted BloodHound-style paths or relationship exports locally and prioritize Tier 0 exposure." placeholder={'User: analyst\nMemberOf: Helpdesk\nRelationship: GenericAll\nTarget: Domain Admins\nadminCount: 1'} rules={rules} />; }
