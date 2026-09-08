export type SecretSeverity = "high" | "medium" | "low";

export type SecretFinding = {
  id: string;
  detector: string;
  severity: SecretSeverity;
  line: number;
  column: number;
  maskedValue: string;
  entropy: number | null;
  context: string;
  remediation: string;
};

type Detector = {
  id: string;
  name: string;
  severity: SecretSeverity;
  pattern: RegExp;
  remediation: string;
};

const PLACEHOLDERS = /^(?:change(?:me|_me)|replace(?:-me|_me)|your[-_\w]*|example|dummy|test|sample|secret|password|null|undefined|xxx+)$/i;

const DETECTORS: Detector[] = [
  { id: "aws-access-key", name: "AWS access key ID", severity: "high", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, remediation: "Revoke/rotate the credential and replace long-lived keys with workload identity." },
  { id: "github-token", name: "GitHub token", severity: "high", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, remediation: "Revoke the token, inspect its scope and replace it with a short-lived least-privilege token." },
  { id: "gitlab-token", name: "GitLab token", severity: "high", pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/g, remediation: "Revoke the token, review its scope and replace it with a short-lived token." },
  { id: "slack-token", name: "Slack token", severity: "high", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g, remediation: "Revoke the Slack token and review messages/actions made with it." },
  { id: "stripe-key", name: "Stripe API key", severity: "high", pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g, remediation: "Revoke live keys immediately; keep test keys out of production configuration." },
  { id: "google-api-key", name: "Google API key", severity: "high", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g, remediation: "Restrict, rotate or revoke the key and review API usage." },
  { id: "npm-token", name: "npm access token", severity: "high", pattern: /\bnpm_[A-Za-z0-9]{30,}\b/g, remediation: "Revoke the token and use a narrowly scoped automation token." },
  { id: "pypi-token", name: "PyPI token", severity: "high", pattern: /\bpypi-[A-Za-z0-9_-]{20,}\b/g, remediation: "Revoke the token and replace it with a scoped token or trusted publisher." },
  { id: "openai-key", name: "OpenAI API key", severity: "high", pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g, remediation: "Revoke the key and create a replacement with usage limits." },
  { id: "digitalocean-token", name: "DigitalOcean token", severity: "high", pattern: /\bdop_v1_[A-Za-z0-9]{30,}\b/g, remediation: "Revoke the token and replace it with a narrowly scoped token." },
  { id: "sendgrid-key", name: "SendGrid API key", severity: "high", pattern: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, remediation: "Revoke the key, review mail activity and issue a restricted replacement." },
  { id: "databricks-token", name: "Databricks token", severity: "high", pattern: /\bdapi[0-9a-f]{32}\b/gi, remediation: "Revoke the token and replace it with a short-lived, scoped credential." },
  { id: "azure-storage-key", name: "Azure storage connection string", severity: "high", pattern: /\bDefaultEndpointsProtocol=[^\n;]+;[^\n]*AccountKey=[A-Za-z0-9+/=]{32,}/gi, remediation: "Rotate the storage account key and use managed identity or a secret manager." },
  { id: "private-key", name: "Private key material", severity: "high", pattern: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z ]+ )?PRIVATE KEY-----/g, remediation: "Remove and rotate the key; store it in a protected secret manager." },
  { id: "jwt", name: "JWT bearer token", severity: "medium", pattern: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, remediation: "Revoke/rotate the token and remove it from logs, source and tickets." },
];

const ASSIGNMENT = /(?:^|[\s"'`])((?:[A-Z0-9]+[_-])*?(?:PASSWORD|PASSWD|SECRET|TOKEN|AUTH(?:ORIZATION)?|API[_-]?KEY|PRIVATE[_-]?KEY|CLIENT[_-]?SECRET)(?:[_-][A-Z0-9]+)*)\s*[:=]\s*["'`]?([A-Za-z0-9+/_=:.!@#$%^&*~-]{12,})["'`]?/g;

function shannonEntropy(value: string) {
  if (!value) return 0;
  const counts = new Map<string, number>();
  for (const char of value) counts.set(char, (counts.get(char) ?? 0) + 1);
  return [...counts.values()].reduce((total, count) => { const probability = count / value.length; return total - probability * Math.log2(probability); }, 0);
}

function mask(value: string) {
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}${"•".repeat(Math.min(12, Math.max(4, value.length - 8)))}${value.slice(-4)}`;
}

function isPlaceholder(value: string) { return PLACEHOLDERS.test(value.replace(/["'`]/g, "").trim()); }
function decodeBase64(value: string) {
  try {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return null;
    return atob(value);
  } catch {
    return null;
  }
}
function isWeakDecodedCredential(value: string) {
  return /^(?:basic\s+)?[^\s:]{1,64}:(?:admin|password|passw(?:o)?rd|changeme|test|default|secret|123456)/i.test(value.trim());
}
function lineNumber(text: string, index: number) { return text.slice(0, index).split("\n").length; }
function columnNumber(text: string, index: number) { return index - text.lastIndexOf("\n", index - 1); }
function contextFor(line: string, value?: string) {
  const redacted = value ? line.split(value).join("[REDACTED]") : line;
  return redacted.trim().replace(/([=:]\s*["'`]?)[^\s"'`,}]+/g, "$1[REDACTED]").slice(0, 180);
}

export function scanSecrets(input: string): SecretFinding[] {
const findings: SecretFinding[] = [];
  for (const detector of DETECTORS) {
    const pattern = new RegExp(detector.pattern.source, detector.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(input))) {
      const value = match[0];
      const line = lineNumber(input, match.index);
      const sourceLine = input.split(/\r?\n/)[line - 1] ?? "";
      if (/gitleaks:allow|secret-scanner:ignore/i.test(sourceLine)) continue;
      findings.push({ id: `${detector.id}:${line}:${match.index}`, detector: detector.name, severity: detector.severity, line, column: columnNumber(input, match.index), maskedValue: mask(value), entropy: Number(shannonEntropy(value).toFixed(2)), context: contextFor(sourceLine, value), remediation: detector.remediation });
    }
  }
  for (const match of input.matchAll(ASSIGNMENT)) {
    const name = match[1]; const value = match[2]; const index = (match.index ?? 0) + match[0].indexOf(name); const sourceLine = input.split(/\r?\n/)[lineNumber(input, index) - 1] ?? "";
    const decoded = decodeBase64(value);
    const weakDecoded = decoded !== null && isWeakDecodedCredential(decoded);
    if (/gitleaks:allow|secret-scanner:ignore/i.test(sourceLine)) continue;
    if (isPlaceholder(value) && !weakDecoded) continue;
    const entropy = shannonEntropy(value);
    if (entropy < 2.8 && value.length < 20 && !weakDecoded) continue;
    const line = lineNumber(input, index);
    findings.push({ id: `generic:${name}:${line}:${index}`, detector: weakDecoded ? `Decoded credential assignment (${name})` : `Generic secret assignment (${name})`, severity: weakDecoded || entropy >= 3.5 || value.length >= 32 ? "high" : "medium", line, column: columnNumber(input, index), maskedValue: mask(value), entropy: Number(entropy.toFixed(2)), context: contextFor(sourceLine, value), remediation: "Move the value to a secret manager, remove it from history and rotate it if it was real." });
  }
  const unique = new Map<string, SecretFinding>();
  for (const finding of findings) {
    const key = `${finding.line}:${finding.maskedValue}`;
    if (!unique.has(key)) unique.set(key, finding);
  }
  return [...unique.values()].sort((a, b) => a.line - b.line || a.detector.localeCompare(b.detector));
}
