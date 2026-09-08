import { validateIp } from "./network.ts";

export type AclRule = {
  id: string;
  action: "permit" | "deny";
  protocol: "ip" | "tcp" | "udp" | "icmp";
  srcIp: string;
  dstIp: string;
  srcPort: string;
  dstPort: string;
  log: boolean;
};

export const MAX_ACL_RULES = 500;

export function createDefaultAclRule(): AclRule {
  return {
    id: crypto.randomUUID(),
    action: "permit",
    protocol: "ip",
    srcIp: "any",
    dstIp: "any",
    srcPort: "any",
    dstPort: "any",
    log: false,
  };
}

function validAddress(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64) return false;
  if (value.toLowerCase() === "any" || validateIp(value)) return true;
  const [ip, prefix] = value.split("/");
  return value.split("/").length === 2 && validateIp(ip) && /^\d{1,2}$/.test(prefix) && Number(prefix) <= 32;
}

function validPort(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.toLowerCase() === "any") return true;
  if (!/^(?:[1-9]\d{0,4})(?:-(?:[1-9]\d{0,4}))?$/.test(value)) return false;
  const ports = value.split("-").map(Number);
  return ports.every((port) => port <= 65535) && (ports.length === 1 || ports[0] <= ports[1]);
}

export function parseAclRules(value: unknown): AclRule[] | null {
  if (!Array.isArray(value) || value.length > MAX_ACL_RULES) return null;
  const rules = value.filter((rule): rule is AclRule => {
    if (!rule || typeof rule !== "object") return false;
    const r = rule as Partial<AclRule>;
    return typeof r.id === "string" && r.id.length <= 128 &&
      (r.action === "permit" || r.action === "deny") &&
      (r.protocol === "ip" || r.protocol === "tcp" || r.protocol === "udp" || r.protocol === "icmp") &&
      validAddress(r.srcIp) && validAddress(r.dstIp) &&
      validPort(r.srcPort) && validPort(r.dstPort) && typeof r.log === "boolean";
  });
  if (rules.length !== value.length) return null;
  const ids = new Set(rules.map((rule) => rule.id));
  return ids.size === rules.length ? rules : null;
}
