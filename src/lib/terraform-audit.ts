import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type RuleKey = "public" | "databasePublic" | "unencrypted" | "publicBucket" | "iamStar" | "secret" | "deletion" | "mutableModule" | "metadata" | "publicIp" | "s3Hardening" | "parse";

const ruleDefinitions = {
  public: { id: "public-network", label: "Public network exposure", severity: "high", explanation: "A network rule allows traffic from every IPv4 or IPv6 address.", fix: "Restrict source CIDRs to trusted networks and separate administrative access." },
  databasePublic: { id: "public-database", label: "Public database endpoint", severity: "high", explanation: "A database instance is configured to receive a public address.", fix: "Keep databases on private subnets and expose access through approved application or bastion paths." },
  unencrypted: { id: "unencrypted", label: "Encryption disabled", severity: "high", explanation: "A resource explicitly disables encryption or does not enforce an encrypted setting.", fix: "Require provider-managed or customer-managed encryption and verify it with policy checks." },
  publicBucket: { id: "public-storage", label: "Public object storage", severity: "high", explanation: "Object storage settings allow public access or disable a public-access guard.", fix: "Enable public-access blocks and grant access through least-privilege IAM." },
  iamStar: { id: "iam-wildcard", label: "Wildcard IAM permission", severity: "high", explanation: "An IAM action or resource uses a wildcard, granting broader access than necessary.", fix: "Replace wildcards with the smallest required action and resource set." },
  secret: { id: "hardcoded-secret", label: "Credential in HCL", severity: "high", explanation: "A credential-like value is hard-coded in Terraform configuration.", fix: "Use a sensitive variable backed by a secret manager and rotate any real value already exposed." },
  deletion: { id: "deletion-protection", label: "Deletion protection disabled", severity: "medium", explanation: "A resource can be deleted without an additional protection control.", fix: "Enable deletion protection where supported and require reviewed destroy plans." },
  mutableModule: { id: "mutable-module", label: "Mutable module source", severity: "medium", explanation: "A module source references a mutable branch or tag, so its code can change without a lockfile-style review.", fix: "Pin the module to a reviewed version or immutable commit and update it deliberately." },
  metadata: { id: "cloud-metadata", label: "IMDSv2 not enforced", severity: "high", explanation: "The EC2 metadata service allows optional tokens, leaving IMDSv1 reachable for credential theft through SSRF.", fix: "Set metadata_options.http_tokens = \"required\" and review hop limit and endpoint settings." },
  publicIp: { id: "public-instance-ip", label: "Public IP assigned to compute", severity: "high", explanation: "A compute interface receives a public IP directly, expanding its attack surface.", fix: "Place the workload in a private subnet and use a controlled load balancer or egress path." },
  s3Hardening: { id: "s3-hardening", label: "S3 bucket hardening missing", severity: "medium", explanation: "The bucket does not show default encryption, versioning, or access logging controls.", fix: "Add separate encryption, versioning and logging resources according to the data classification and retention policy." },
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
  const blockStack: { kind: string; resourceType?: string; depth: number }[] = [];
  let s3BucketStart: number | null = null;
  let hasS3Encryption = false;
  let hasS3Versioning = false;
  let hasS3Logging = false;

  for (const line of lines) {
    const code = stripInlineComment(line.text).trim();
    const block = /^(resource|data|module|provider|variable|terraform|locals|output)\s+"?([^"\s]+)"?/i.exec(code);
    const delta = countBraces(code);
    const declaredResource = block?.[1].toLowerCase() === "resource" ? block[2] : undefined;
    if (declaredResource === "aws_s3_bucket") s3BucketStart ??= line.start;
    if (declaredResource === "aws_s3_bucket_server_side_encryption_configuration") hasS3Encryption = true;
    if (declaredResource === "aws_s3_bucket_versioning") hasS3Versioning = true;
    if (declaredResource === "aws_s3_bucket_logging") hasS3Logging = true;
    if (block && code.includes("{")) blockStack.push({ kind: block[1].toLowerCase(), resourceType: declaredResource, depth: braceBalance + 1 });
    braceBalance += delta;
    if (braceBalance < 0) {
      findings.push(finding(input, "parse", `line-${line.start}`, line.start, "A closing brace appears before its matching block."));
      braceBalance = 0;
    }
    while (blockStack.length > 0 && blockStack[blockStack.length - 1].depth > braceBalance) blockStack.pop();
    const active = blockStack[blockStack.length - 1];
    const resourceType = declaredResource ?? active?.resourceType;
    const isObjectStorage = /(?:s3|storage|bucket)/i.test(resourceType ?? "");
    const isDatabase = /(?:db_instance|rds|database)/i.test(resourceType ?? "");
    if (isPublicCidr(code)) findings.push(finding(input, "public", `line-${line.start}`, line.start, `The rule appears in ${resourceType ?? block?.[2] ?? "a Terraform block"}.`));
    if (/\b(?:storage_)?(?:encrypted|encryption|encrypt)\s*=\s*false\b/i.test(code)) findings.push(finding(input, "unencrypted", `line-${line.start}`, line.start));
    if (isDatabase && /\bpublicly_accessible\s*=\s*true\b/i.test(code)) findings.push(finding(input, "databasePublic", `line-${line.start}`, line.start));
    if (isObjectStorage && /(?:acl\s*=\s*["']public-read|block_public_(?:acls|policy|bucket|object_ownership)\s*=\s*false|ignore_public_acls\s*=\s*false|restrict_public_buckets\s*=\s*false)/i.test(code)) findings.push(finding(input, "publicBucket", `line-${line.start}`, line.start));
    if (/\b(?:actions?|resources?)\s*=\s*[^\n]*["']\*["']/i.test(code)) findings.push(finding(input, "iamStar", `line-${line.start}`, line.start));
    const secret = /\b(?:password|passwd|token|secret(?:[_-]?key)?|access[_-]?key|private[_-]?key|client[_-]?secret)\s*=\s*["']([^"']+)["']/i.exec(code);
    if (secret?.[1] && !isPlaceholder(secret[1])) findings.push(finding(input, "secret", `line-${line.start}`, line.start));
    if (/\b(?:deletion_protection|skip_final_snapshot)\s*=\s*true|\bdeletion_protection\s*=\s*false\b/i.test(code)) findings.push(finding(input, "deletion", `line-${line.start}`, line.start));
    if (/\bhttp_tokens\s*=\s*["']optional["']/i.test(code)) findings.push(finding(input, "metadata", `line-${line.start}`, line.start));
    if (/\bassociate_public_ip_address\s*=\s*true\b/i.test(code)) findings.push(finding(input, "publicIp", `line-${line.start}`, line.start));
    if (isObjectStorage && /\bserver_side_encryption_configuration\s*\{|\bversioning\s*\{|\blogging\s*\{/i.test(code)) {
      if (/server_side_encryption_configuration/i.test(code)) hasS3Encryption = true;
      if (/\bversioning\s*\{/i.test(code)) hasS3Versioning = true;
      if (/\blogging\s*\{/i.test(code)) hasS3Logging = true;
    }
    const moduleSource = /\bsource\s*=\s*["']([^"']+)["']/i.exec(code);
    if (active?.kind === "module" && moduleSource?.[1] && /\?(?:ref|branch|tag)=?(?:main|master|latest|develop|development)|\/(?:main|master|latest|develop|development)$/i.test(moduleSource[1])) findings.push(finding(input, "mutableModule", `line-${line.start}`, line.start, `The module source ${moduleSource[1]} is mutable.`));
  }
  if (s3BucketStart !== null) {
    if (!hasS3Encryption) findings.push(finding(input, "s3Hardening", "encryption", s3BucketStart, "No default server-side encryption configuration was found for the bucket."));
    if (!hasS3Versioning) findings.push(finding(input, "s3Hardening", "versioning", s3BucketStart, "No enabled versioning configuration was found for the bucket."));
    if (!hasS3Logging) findings.push(finding(input, "s3Hardening", "logging", s3BucketStart, "No access logging configuration was found for the bucket."));
  }
  if (braceBalance !== 0 || blockStack.length !== 0) findings.push(finding(input, "parse", "unbalanced", Math.max(0, input.length - 1), "Terraform block delimiters are not balanced."));
  return findings;
}
