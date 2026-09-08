import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type RuleKey = "public" | "unencrypted" | "publicBucket" | "iamStar" | "secret" | "deletion" | "mutableModule" | "parse";

const ruleDefinitions = {
  public: { id: "public-network", label: "Public network exposure", severity: "high", explanation: "A network rule allows traffic from every IPv4 or IPv6 address.", fix: "Restrict source CIDRs to trusted networks and separate administrative access." },
  unencrypted: { id: "unencrypted", label: "Encryption disabled", severity: "high", explanation: "A resource explicitly disables encryption or does not enforce an encrypted setting.", fix: "Require provider-managed or customer-managed encryption and verify it with policy checks." },
  publicBucket: { id: "public-storage", label: "Public object storage", severity: "high", explanation: "Object storage settings allow public access or disable a public-access guard.", fix: "Enable public-access blocks and grant access through least-privilege IAM." },
  iamStar: { id: "iam-wildcard", label: "Wildcard IAM permission", severity: "high", explanation: "An IAM action or resource uses a wildcard, granting broader access than necessary.", fix: "Replace wildcards with the smallest required action and resource set." },
  secret: { id: "hardcoded-secret", label: "Credential in HCL", severity: "high", explanation: "A credential-like value is hard-coded in Terraform configuration.", fix: "Use a sensitive variable backed by a secret manager and rotate any real value already exposed." },
  deletion: { id: "deletion-protection", label: "Deletion protection disabled", severity: "medium", explanation: "A resource can be deleted without an additional protection control.", fix: "Enable deletion protection where supported and require reviewed destroy plans." },
  mutableModule: { id: "mutable-module", label: "Mutable module source", severity: "medium", explanation: "A module source references a mutable branch or tag, so its code can change without a lockfile-style review.", fix: "Pin the module to a reviewed version or immutable commit and update it deliberately." },
  parse: { id: "parse-error", label: "Invalid Terraform syntax", severity: "high", explanation: "The input has unbalanced Terraform block delimiters, so the security checks cannot be trusted completely.", fix: "Run terraform fmt and terraform validate after correcting the HCL syntax." },
} satisfies Record<RuleKey, Omit<AuditRule, "pattern">>;

type HclLine = { text: string; start: number };

function sourceFor(input: string, index: number) {
  return { ...sourcePositionAt(input, index), excerpt: sourceExcerptAt(input, index) };
}

function finding(input: string, key: RuleKey, suffix: string, index: number, detail?: string): AuditFinding {
  const rule = ruleDefinitions[key];
  return { ...rule, pattern: /$^/, id: `${rule.id}:${suffix}`, ...sourceFor(input, index), ...(detail ? { explanation: `${rule.explanation} ${detail}` } : {}) } as AuditFinding;
}

function linesOf(input: string): HclLine[] {
  const lines: HclLine[] = [];
  let start = 0;
  for (const line of input.split(/\r?\n/)) {
    if (line.trim() && !line.trimStart().startsWith("#") && !line.trimStart().startsWith("//")) lines.push({ text: line, start });
    start += line.length + 1;
  }
  return lines;
}

function stripInlineComment(value: string) {
  let quote: string | undefined;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "\\") {
      index += 1;
      continue;
    }
    if ((character === '"' || character === "'") && quote === undefined) quote = character;
    else if (character === quote) quote = undefined;
    else if (quote === undefined && (character === "#" || value.slice(index, index + 2) === "//")) return value.slice(0, index);
  }
  return value;
}

function countBraces(value: string) {
  const code = stripInlineComment(value);
  let quote: string | undefined;
  let balance = 0;
  for (let index = 0; index < code.length; index += 1) {
    const character = code[index];
    if (character === "\\") {
      index += 1;
      continue;
    }
    if ((character === '"' || character === "'") && quote === undefined) quote = character;
    else if (character === quote) quote = undefined;
    else if (quote === undefined && character === "{") balance += 1;
    else if (quote === undefined && character === "}") balance -= 1;
  }
  return balance;
}

function isPlaceholder(value: string) {
  return /^(?:replace[-_ ]?me|changeme|example|dummy|test|your[-_ ]?value|<[^>]+>)$/i.test(value);
}

function isPublicCidr(value: string) {
  return /(?:^|["'\s])(?:0\.0\.0\.0\/0|::\/0)(?:["'\s]|$)/.test(value);
}

export function analyzeTerraform(input: string): AuditFinding[] {
  if (!input.trim()) return [];
  const findings: AuditFinding[] = [];
  const lines = linesOf(input);
  let braceBalance = 0;
  const blockStack: { type: string; depth: number }[] = [];

  for (const line of lines) {
    const code = stripInlineComment(line.text).trim();
    const block = /^(resource|data|module|provider|variable|terraform|locals|output)\s+"?([^"\s]+)"?/i.exec(code);
    const delta = countBraces(code);
    if (block && code.includes("{")) blockStack.push({ type: block[1].toLowerCase(), depth: braceBalance + 1 });
    braceBalance += delta;
    if (braceBalance < 0) {
      findings.push(finding(input, "parse", `line-${line.start}`, line.start, "A closing brace appears before its matching block."));
      braceBalance = 0;
    }
    while (blockStack.length > 0 && blockStack[blockStack.length - 1].depth > braceBalance) blockStack.pop();
    if (isPublicCidr(code)) findings.push(finding(input, "public", `line-${line.start}`, line.start, `The rule appears in ${block?.[2] ?? "a Terraform block"}.`));
    if (/\b(?:encrypted|encryption|encrypt)\s*=\s*false\b/i.test(code)) findings.push(finding(input, "unencrypted", `line-${line.start}`, line.start));
    if (/(?:acl\s*=\s*["']public-read|publicly_accessible\s*=\s*true|block_public_(?:acls|policy|bucket|object_ownership)\s*=\s*false)/i.test(code)) findings.push(finding(input, "publicBucket", `line-${line.start}`, line.start));
    if (/\b(?:actions|resources)\s*=\s*[^\n]*["']\*["']/i.test(code)) findings.push(finding(input, "iamStar", `line-${line.start}`, line.start));
    const secret = /\b(?:password|passwd|token|secret|access[_-]?key|private[_-]?key)\s*=\s*["']([^"']+)["']/i.exec(code);
    if (secret?.[1] && !isPlaceholder(secret[1])) findings.push(finding(input, "secret", `line-${line.start}`, line.start));
    if (/\bdeletion_protection\s*=\s*false\b/i.test(code)) findings.push(finding(input, "deletion", `line-${line.start}`, line.start));
    const moduleSource = /\bsource\s*=\s*["']([^"']+)["']/i.exec(code);
    if (blockStack[blockStack.length - 1]?.type === "module" && moduleSource?.[1] && /\?(?:ref|branch|tag)=?(?:main|master|latest|develop|development)|\/(?:main|master|latest|develop|development)$/i.test(moduleSource[1])) findings.push(finding(input, "mutableModule", `line-${line.start}`, line.start, `The module source ${moduleSource[1]} is mutable.`));
  }
  if (braceBalance !== 0 || blockStack.length !== 0) findings.push(finding(input, "parse", "unbalanced", Math.max(0, input.length - 1), "Terraform block delimiters are not balanced."));
  return findings;
}
