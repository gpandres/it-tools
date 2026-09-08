import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type RuleKey = "tier0" | "genericAll" | "genericWrite" | "writeDacl" | "dcsync" | "delegation" | "adminCount" | "remoteAdmin";

const ruleDefinitions = {
  tier0: { id: "tier0-target", label: "Tier 0 target exposed", severity: "high", explanation: "A recognized relationship points toward a domain administrator or other Tier 0 target.", fix: "Review the shortest path to Tier 0, remove unnecessary rights and monitor privileged group changes." },
  genericAll: { id: "generic-all", label: "GenericAll relationship", severity: "high", explanation: "GenericAll grants broad control over the target object.", fix: "Replace broad ACLs with minimum required rights and review inheritance." },
  genericWrite: { id: "generic-write", label: "GenericWrite relationship", severity: "high", explanation: "GenericWrite allows modification of important object attributes and can enable privilege escalation.", fix: "Restrict the delegated rights and review the object ACL and inheritance." },
  writeDacl: { id: "write-dacl-owner", label: "ACL or owner control", severity: "high", explanation: "WriteDacl or WriteOwner can allow an identity to alter control of the target object.", fix: "Remove unnecessary delegation and protect privileged object ACLs." },
  dcsync: { id: "dcsync", label: "DCSync replication privilege", severity: "high", explanation: "Replication rights can expose credential material from a domain controller.", fix: "Audit principals with replication rights and restrict them to approved domain controllers." },
  delegation: { id: "delegation", label: "Unconstrained delegation", severity: "high", explanation: "Unconstrained delegation increases the risk of credential forwarding to a compromised host.", fix: "Migrate to constrained or resource-based delegation where possible." },
  adminCount: { id: "admin-count", label: "Protected admin object", severity: "medium", explanation: "adminCount=1 indicates an object protected by AdminSDHolder and deserves privileged-path review.", fix: "Confirm the account still needs privileged membership and monitor changes." },
  remoteAdmin: { id: "remote-admin", label: "Remote administration path", severity: "medium", explanation: "A recognized remote administration relationship can provide lateral movement into the target host.", fix: "Restrict remote administration rights and require tiering, MFA and monitored access." },
} satisfies Record<RuleKey, Omit<AuditRule, "pattern">>;

function finding(input: string, key: RuleKey, suffix: string, index: number, detail?: string): AuditFinding {
  const rule = ruleDefinitions[key];
  return { ...rule, pattern: /$^/, id: `${rule.id}:${suffix}`, ...sourcePositionAt(input, index), excerpt: sourceExcerptAt(input, index), ...(detail ? { explanation: `${rule.explanation} ${detail}` } : {}) } as AuditFinding;
}

function relationFromLine(line: string) {
  return /(?:relationship|relation|edge|right|permission)\s*[:=]\s*["']?([A-Za-z][A-Za-z ]+)["']?/i.exec(line)?.[1]?.trim().toLowerCase() ?? null;
}

function targetFromLine(line: string) {
  return /(?:target|object|destination|to)\s*[:=]\s*["']?([^"']+)["']?/i.exec(line)?.[1]?.trim() ?? null;
}

function auditRelations(input: string, text: string, baseIndex = 0): AuditFinding[] {
  const findings: AuditFinding[] = [];
  let pendingRelation: { value: string; index: number } | undefined;
  let offset = baseIndex;
  for (const line of text.split(/\r?\n/)) {
    const relation = relationFromLine(line);
    const target = targetFromLine(line);
    if (relation) {
      const index = input.indexOf(line, offset);
      const sourceIndex = index >= 0 ? index : offset;
      if (/genericall/i.test(relation)) findings.push(finding(input, "genericAll", `${sourceIndex}`, sourceIndex));
      else if (/genericwrite/i.test(relation)) findings.push(finding(input, "genericWrite", `${sourceIndex}`, sourceIndex));
      else if (/(?:writedacl|writeowner)/i.test(relation)) findings.push(finding(input, "writeDacl", `${sourceIndex}`, sourceIndex));
      else if (/(?:dcsync|replication-get-changes)/i.test(relation)) findings.push(finding(input, "dcsync", `${sourceIndex}`, sourceIndex));
      else if (/(?:unconstraineddelegation|unconstrained delegation)/i.test(relation)) findings.push(finding(input, "delegation", `${sourceIndex}`, sourceIndex));
      else if (/(?:canrdp|canpsremote|adminsto|sqladmin)/i.test(relation)) findings.push(finding(input, "remoteAdmin", `${sourceIndex}`, sourceIndex));
      pendingRelation = { value: relation, index: sourceIndex };
      if (target && /(?:domain admins|enterprise admins|domain controllers|tier\s*0)/i.test(target)) findings.push(finding(input, "tier0", `${sourceIndex}:target`, sourceIndex, `${relation} points to ${target}.`));
      offset = Math.max(offset, sourceIndex + line.length);
    }
    if (!relation && target && pendingRelation && /(?:domain admins|enterprise admins|domain controllers|tier\s*0)/i.test(target)) findings.push(finding(input, "tier0", `${pendingRelation.index}:target`, pendingRelation.index, `${pendingRelation.value} points to ${target}.`));
    if (/\badminCount\s*[:=]\s*1\b/i.test(line)) {
      const index = input.indexOf(line, offset);
      findings.push(finding(input, "adminCount", `${index}`, index >= 0 ? index : offset));
    }
    offset += line.length + 1;
  }
  return findings;
}

function walkJson(value: unknown, input: string, findings: AuditFinding[], seen: Set<unknown>) {
  if (typeof value !== "object" || value === null || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, input, findings, seen);
    return;
  }
  const record = value as Record<string, unknown>;
  const relation = Object.entries(record).find(([key, item]) => /relationship|relation|edge|right|permission/i.test(key) && typeof item === "string")?.[1];
  const target = Object.entries(record).find(([key, item]) => /target|object|destination|to|name/i.test(key) && typeof item === "string")?.[1];
  if (typeof relation === "string") {
    const synthetic = `Relationship: ${relation}${typeof target === "string" ? `\nTarget: ${target}` : ""}`;
    findings.push(...auditRelations(input, synthetic));
  }
  for (const child of Object.values(record)) walkJson(child, input, findings, seen);
}

export function analyzeAdPath(input: string): AuditFinding[] {
  if (!input.trim()) return [];
  const trimmed = input.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const findings: AuditFinding[] = [];
      walkJson(parsed, input, findings, new Set());
      return findings;
    } catch {
      return auditRelations(input, input).filter(finding => finding.id.startsWith("generic-") || finding.id.startsWith("dcsync"));
    }
  }
  return auditRelations(input, input);
}
