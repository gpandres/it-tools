import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type RuleKey = "spf" | "dkim" | "dmarc" | "arc" | "missingAuth" | "replyTo" | "external" | "returnPath";
type HeaderLine = { name: string; value: string; start: number };

const ruleDefinitions = {
  spf: { id: "spf-failure", label: "SPF did not pass", severity: "medium", explanation: "The Authentication-Results header reports an SPF result other than pass.", fix: "Review the authorized sender and SPF policy; SPF alone does not prove message identity." },
  dkim: { id: "dkim-failure", label: "DKIM did not pass", severity: "high", explanation: "The message signature is missing, invalid, or could not be evaluated.", fix: "Verify the signing domain and selector, then preserve the message for forensic review." },
  dmarc: { id: "dmarc-failure", label: "DMARC did not pass", severity: "high", explanation: "The message does not have a passing DMARC result or has no usable DMARC result.", fix: "Check From-domain alignment with SPF/DKIM and confirm the sender through an independent channel." },
  arc: { id: "arc-failure", label: "ARC did not pass", severity: "medium", explanation: "Authenticated Received Chain validation failed or returned an error.", fix: "Treat forwarded authentication claims cautiously and inspect the complete ARC chain." },
  missingAuth: { id: "missing-authentication", label: "Authentication results missing", severity: "low", explanation: "No Authentication-Results header was provided, so sender authentication cannot be assessed from this input.", fix: "Export the complete original message headers from the mail client or gateway." },
  replyTo: { id: "reply-to-mismatch", label: "Reply-To domain mismatch", severity: "medium", explanation: "The Reply-To address uses a different domain from the visible From address.", fix: "Confirm the expected sender out of band before replying or opening links." },
  external: { id: "consumer-sender", label: "Consumer sender domain", severity: "low", explanation: "The visible sender uses a common consumer mailbox domain rather than an organizational domain.", fix: "Validate the business context and inspect authentication and the full Received chain." },
  returnPath: { id: "return-path-mismatch", label: "Return-Path domain mismatch", severity: "low", explanation: "The envelope return path differs from the visible From domain; this is common in legitimate bulk mail but deserves alignment review.", fix: "Check DMARC alignment and confirm that the sending service is authorized by the organization." },
} satisfies Record<RuleKey, Omit<AuditRule, "pattern">>;

function finding(input: string, key: RuleKey, suffix: string, index: number, detail?: string): AuditFinding {
  const rule = ruleDefinitions[key];
  return { ...rule, pattern: /$^/, id: `${rule.id}:${suffix}`, ...sourcePositionAt(input, index), excerpt: sourceExcerptAt(input, index), ...(detail ? { explanation: `${rule.explanation} ${detail}` } : {}) } as AuditFinding;
}

function unfoldHeaders(input: string): HeaderLine[] {
  const headers: HeaderLine[] = [];
  let offset = 0;
  let current: HeaderLine | undefined;
  for (const line of input.split(/\r?\n/)) {
    if (/^\s/.test(line) && current) current.value += ` ${line.trim()}`;
    else {
      const match = /^([!#$%&'*+.^_`|~0-9A-Za-z-]+):\s*(.*)$/.exec(line);
      if (match) {
        current = { name: match[1].toLowerCase(), value: match[2].trim(), start: offset };
        headers.push(current);
      } else current = undefined;
    }
    offset += line.length + 1;
  }
  return headers;
}

function domainFromAddress(value: string) {
  const address = /<([^>]+)>/.exec(value)?.[1] ?? /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Z0-9-]+(?:\.[A-Z0-9-]+)+)/i.exec(value)?.[0];
  const match = address ? /@([^\s>]+)$/i.exec(address.replace(/[<>]/g, "")) : null;
  return match?.[1]?.toLowerCase().replace(/[.)]+$/, "") ?? null;
}

const consumerDomains = new Set(["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "proton.me", "protonmail.com", "yahoo.com", "icloud.com"]);

export function analyzeEmailHeaders(input: string): AuditFinding[] {
  if (!input.trim()) return [];
  const headers = unfoldHeaders(input);
  const findings: AuditFinding[] = [];
  const first = (name: string) => headers.find(header => header.name === name);
  const authentication = headers.filter(header => header.name === "authentication-results");
  const from = first("from");
  const replyTo = first("reply-to");
  const returnPath = first("return-path");
  const fromDomain = from ? domainFromAddress(from.value) : null;
  const replyDomain = replyTo ? domainFromAddress(replyTo.value) : null;
  const returnDomain = returnPath ? domainFromAddress(returnPath.value) : null;

  if (!authentication.length) findings.push(finding(input, "missingAuth", "headers", from?.start ?? 0));
  for (const [index, header] of authentication.entries()) {
    const result = (name: string) => new RegExp(`\\b${name}=(pass|fail|softfail|neutral|none|temperror|permerror)\\b`, "i").exec(header.value)?.[1]?.toLowerCase();
    const spf = result("spf");
    const dkim = result("dkim");
    const dmarc = result("dmarc");
    const arc = result("arc");
    if (spf && spf !== "pass") findings.push(finding(input, "spf", `${index}`, header.start, `${spf.toUpperCase()} was reported.`));
    if (dkim && dkim !== "pass") findings.push(finding(input, "dkim", `${index}`, header.start, `${dkim.toUpperCase()} was reported.`));
    if (dmarc && dmarc !== "pass") findings.push(finding(input, "dmarc", `${index}`, header.start, `${dmarc.toUpperCase()} was reported.`));
    if (arc && arc !== "pass") findings.push(finding(input, "arc", `${index}`, header.start, `${arc.toUpperCase()} was reported.`));
  }
  if (fromDomain && replyDomain && fromDomain !== replyDomain) findings.push(finding(input, "replyTo", "domain", replyTo?.start ?? 0, `${fromDomain} is shown in From and ${replyDomain} is used by Reply-To.`));
  if (fromDomain && consumerDomains.has(fromDomain)) findings.push(finding(input, "external", "domain", from?.start ?? 0, `${fromDomain} is a consumer mailbox domain.`));
  if (fromDomain && returnDomain && fromDomain !== returnDomain) findings.push(finding(input, "returnPath", "domain", returnPath?.start ?? 0, `${fromDomain} is shown in From and ${returnDomain} is used by Return-Path.`));
  return findings;
}
