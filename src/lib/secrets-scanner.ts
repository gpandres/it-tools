export type SecretSeverity = "high" | "medium" | "low";

export type SecretFinding = {
  id: string;
  detector: string;
  severity: SecretSeverity;
  line: number;
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
  { id: "slack-token", name: "Slack token", severity: "high", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g, remediation: "Revoke the Slack token and review messages/actions made with it." },
  { id: "stripe-key", name: "Stripe API key", severity: "high", pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g, remediation: "Revoke live keys immediately; keep test keys out of production configuration." },
  { id: "google-api-key", name: "Google API key", severity: "high", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g, remediation: "Restrict, rotate or revoke the key and review API usage." },
  { id: "npm-token", name: "npm access token", severity: "high", pattern: /\bnpm_[A-Za-z0-9]{30,}\b/g, remediation: "Revoke the token and use a narrowly scoped automation token." },
  { id: "pypi-token", name: "PyPI token", severity: "high", pattern: /\bpypi-[A-Za-z0-9_-]{20,}\b/g, remediation: "Revoke the token and replace it with a scoped token or trusted publisher." },
  { id: "openai-key", name: "OpenAI API key", severity: "high", pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g, remediation: "Revoke the key and create a replacement with usage limits." },
  { id: "private-key", name: "Private key material", severity: "high", pattern: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z ]+ )?PRIVATE KEY-----/g, remediation: "Remove and rotate the key; store it in a protected secret manager." },
  { id: "jwt", name: "JWT bearer token", severity: "medium", pattern: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, remediation: "Revoke/rotate the token and remove it from logs, source and tickets." },
];

const ASSIGNMENT = /(?:^|[\s"'`])((?:[A-Z0-9]+[_-])*?(?:PASSWORD|PASSWD|SECRET|TOKEN|API[_-]?KEY|PRIVATE[_-]?KEY|CLIENT[_-]?SECRET)(?:[_-][A-Z0-9]+)*)\s*[:=]\s*["'`]?([A-Za-z0-9+/_=:.!@#$%^&*~-]{12,})["'`]?/g;

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
function lineNumber(text: string, index: number) { return text.slice(0, index).split("\n").length; }
function contextFor(line: string) { return line.trim().replace(/([=:]\s*["'`]?)[^\s"'`,}]+/, "$1[REDACTED]").slice(0, 180); }

export function scanSecrets(input: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  for (const detector of DETECTORS) {
    detector.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = detector.pattern.exec(input))) {
      const value = match[0];
      const line = lineNumber(input, match.index);
      const sourceLine = input.split(/\r?\n/)[line - 1] ?? "";
      if (/gitleaks:allow|secret-scanner:ignore/i.test(sourceLine)) continue;
      findings.push({ id: `${detector.id}:${line}:${match.index}`, detector: detector.name, severity: detector.severity, line, maskedValue: mask(value), entropy: Number(shannonEntropy(value).toFixed(2)), context: contextFor(sourceLine), remediation: detector.remediation });
    }
  }
  for (const match of input.matchAll(ASSIGNMENT)) {
    const name = match[1]; const value = match[2]; const index = (match.index ?? 0) + match[0].indexOf(name); const sourceLine = input.split(/\r?\n/)[lineNumber(input, index) - 1] ?? "";
    if (isPlaceholder(value) || /gitleaks:allow|secret-scanner:ignore/i.test(sourceLine)) continue;
    const entropy = shannonEntropy(value);
    if (entropy < 2.8 && value.length < 20) continue;
    const line = lineNumber(input, index);
    findings.push({ id: `generic:${name}:${line}:${index}`, detector: `Generic secret assignment (${name})`, severity: entropy >= 3.5 || value.length >= 32 ? "high" : "medium", line, maskedValue: mask(value), entropy: Number(entropy.toFixed(2)), context: contextFor(sourceLine), remediation: "Move the value to a secret manager, remove it from history and rotate it if it was real." });
  }
  const unique = new Map<string, SecretFinding>();
  for (const finding of findings) {
    const key = `${finding.line}:${finding.maskedValue}`;
    if (!unique.has(key)) unique.set(key, finding);
  }
  return [...unique.values()].sort((a, b) => a.line - b.line || a.detector.localeCompare(b.detector));
}
