import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type RuleKey = "spf" | "dkim" | "dmarc" | "arc" | "missingAuth" | "replyTo" | "external" | "returnPath" | "sender" | "attachment" | "mime" | "httpExecutable" | "credential" | "weakDkim" | "date" | "privateIp" | "software";
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
  sender: { id: "sender-from-mismatch", label: "Sender and From mismatch", severity: "high", explanation: "The Sender address differs from the visible From address, which can indicate delegated sending or spoofing.", fix: "Validate the sender through the mail gateway and an independent channel before trusting the message." },
  attachment: { id: "suspicious-attachment", label: "Suspicious executable attachment", severity: "high", explanation: "The message contains a double-extension or executable attachment name commonly used to disguise malware.", fix: "Do not open the attachment; detonate it in a sandbox and preserve the original message for analysis." },
  mime: { id: "dangerous-mime", label: "Dangerous attachment MIME type", severity: "high", explanation: "The message declares an executable MIME type or contains a Base64 signature consistent with a Windows PE file.", fix: "Quarantine the message and inspect the decoded attachment with endpoint and sandbox controls." },
  httpExecutable: { id: "http-executable-link", label: "HTTP link to executable", severity: "high", explanation: "The body contains a cleartext HTTP link ending in an executable extension.", fix: "Do not open the link; verify the sender and retrieve software only from a trusted, authenticated channel." },
  credential: { id: "header-credential", label: "Basic credential in header", severity: "high", explanation: "A header contains a Base64-encoded Basic credential, which is not encryption and can expose account access.", fix: "Treat the credential as exposed, rotate it and remove custom authentication headers from mail flow." },
  weakDkim: { id: "weak-dkim-algorithm", label: "Obsolete DKIM algorithm", severity: "high", explanation: "The DKIM signature uses rsa-sha1, an obsolete signing algorithm vulnerable to collision attacks.", fix: "Require DKIM rsa-sha256 or stronger and rotate obsolete signing keys." },
  date: { id: "suspicious-date", label: "Suspicious message date", severity: "medium", explanation: "The Date header is an epoch-era or otherwise implausibly old timestamp.", fix: "Inspect the complete Received chain and gateway timestamps for header manipulation." },
  privateIp: { id: "private-ip-disclosure", label: "Private infrastructure IP disclosed", severity: "low", explanation: "The headers disclose RFC1918 private addresses, revealing internal mail topology.", fix: "Review gateway header rewriting and remove internal Received details from messages leaving the organization." },
  software: { id: "outdated-mailer", label: "Outdated mail software disclosed", severity: "medium", explanation: "The X-Mailer header identifies an old mail library version that may have known security issues.", fix: "Upgrade the mail library, remove version disclosure and review the sending host for compromise." },
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

function decodeBase64(value: string) {
  try {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return null;
    return atob(value);
  } catch {
    return null;
  }
}

export function analyzeEmailHeaders(input: string): AuditFinding[] {
  if (!input.trim()) return [];
  const headers = unfoldHeaders(input);
  const findings: AuditFinding[] = [];
  const first = (name: string) => headers.find(header => header.name === name);
  const authentication = headers.filter(header => header.name === "authentication-results");
  const from = first("from");
  const sender = first("sender");
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
  const senderDomain = sender ? domainFromAddress(sender.value) : null;
  if (fromDomain && senderDomain && fromDomain !== senderDomain) findings.push(finding(input, "sender", "domain", sender?.start ?? 0, `${fromDomain} is shown in From and ${senderDomain} is used by Sender.`));

  const dkimSignature = first("dkim-signature");
  if (dkimSignature && /(?:^|\s)a\s*=\s*rsa-sha1(?:\s|;|$)/i.test(dkimSignature.value)) findings.push(finding(input, "weakDkim", "algorithm", dkimSignature.start));
  const dateHeader = first("date");
  if (dateHeader) {
    const date = Date.parse(dateHeader.value);
    if (!Number.isFinite(date) || new Date(date).getUTCFullYear() < 2000) findings.push(finding(input, "date", "header", dateHeader.start));
  }
  for (const header of headers) {
    const basic = /\bbasic\s+([A-Za-z0-9+/]+=*)/i.exec(header.value)?.[1];
    if (basic && decodeBase64(basic)?.includes(":")) findings.push(finding(input, "credential", header.name, header.start, `${header.name} contains a Basic credential.`));
  }
  const attachment = /(?:filename|name)\s*=\s*["']?[^\s"']+\.(?:pdf|docx?|xlsx?|jpg|png|txt)\.(?:exe|scr|js|vbs|bat|cmd|ps1|lnk|msi|dll)\b/i.exec(input);
  if (attachment) findings.push(finding(input, "attachment", "double-extension", attachment.index));
  const dangerousMime = /content-type\s*:\s*application\/(?:x-msdownload|x-dosexec|vnd\.ms-application|x-sh|x-bat)\b/i.exec(input);
  const peMagic = /(?:^|[^A-Za-z0-9+/])TVqQ[A-Za-z0-9+/]{8,}={0,2}/.exec(input);
  if (dangerousMime) findings.push(finding(input, "mime", "declared", dangerousMime.index));
  else if (peMagic) findings.push(finding(input, "mime", "pe-base64", peMagic.index));
  const executableLink = /https?:\/\/[^\s"'<>]+\.(?:exe|scr|msi|dll|bat|cmd|ps1)(?:[?#][^\s"'<>]*)?/i.exec(input);
  if (executableLink?.[0].toLowerCase().startsWith("http://")) findings.push(finding(input, "httpExecutable", "link", executableLink.index));
  const privateIp = /\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.(?:\d{1,3}\.)\d{1,3})\b/.exec(input);
  if (privateIp) findings.push(finding(input, "privateIp", "header", privateIp.index));
  const mailer = /x-mailer:\s*[^\r\n]*phpmailer\s+([0-9]+\.[0-9]+\.[0-9]+)/i.exec(input);
  if (mailer && Number(mailer[1].split(".")[0]) < 6) findings.push(finding(input, "software", "phpmailer", mailer.index));
  return findings;
}
