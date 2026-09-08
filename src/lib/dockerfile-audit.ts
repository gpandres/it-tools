import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type RuleKey = "root" | "floatingImage" | "secret" | "remoteScript" | "remoteAdd" | "sudo" | "worldWritable" | "parse";

const ruleDefinitions = {
  root: { id: "root", label: "Image may run as root", severity: "high", explanation: "No non-root USER instruction was found for the final image stage.", fix: "Create a dedicated UID/GID and finish the final stage with USER." },
  floatingImage: { id: "floating-image", label: "Floating base image", severity: "medium", explanation: "A base image is referenced by a mutable tag or without a tag.", fix: "Pin a reviewed version and preferably an immutable digest." },
  secret: { id: "build-secret", label: "Secret in build instruction", severity: "high", explanation: "ARG or ENV values can remain visible in image history or metadata.", fix: "Use BuildKit secret mounts or a runtime secret store, and rotate any exposed value." },
  remoteScript: { id: "remote-script", label: "Remote script execution", severity: "high", explanation: "A remote response is piped directly into a shell without an integrity check.", fix: "Download a pinned artifact, verify its checksum or signature, then execute the reviewed file." },
  remoteAdd: { id: "remote-add", label: "Remote ADD source", severity: "medium", explanation: "ADD downloads a remote URL during the build, making the build input less explicit and reproducible.", fix: "Download and verify the artifact in a controlled step, or copy a reviewed file from the build context." },
  sudo: { id: "sudo", label: "Sudo installed in image", severity: "low", explanation: "Sudo increases the attack surface and can undermine a minimal runtime image.", fix: "Remove it from the runtime stage and use a multi-stage build if build tooling needs it." },
  worldWritable: { id: "world-writable", label: "World-writable path", severity: "medium", explanation: "The image changes permissions to allow all users to write to a path.", fix: "Use ownership and the narrowest required permissions instead of chmod 777." },
  parse: { id: "parse-error", label: "Invalid Dockerfile instruction", severity: "high", explanation: "The Dockerfile contains an instruction that cannot be interpreted reliably.", fix: "Correct the instruction syntax and validate the file with docker build --check." },
} satisfies Record<RuleKey, Omit<AuditRule, "pattern">>;

function sourceFor(input: string, needles: readonly string[]) {
  const index = needles.map(needle => input.indexOf(needle)).filter(position => position >= 0).sort((a, b) => a - b)[0] ?? 0;
  return { ...sourcePositionAt(input, index), excerpt: sourceExcerptAt(input, index) };
}

function finding(input: string, key: RuleKey, suffix: string, needles: readonly string[], detail?: string): AuditFinding {
  const rule = ruleDefinitions[key];
  return { ...rule, pattern: /$^/, id: `${rule.id}:${suffix}`, ...sourceFor(input, needles), ...(detail ? { explanation: `${rule.explanation} ${detail}` } : {}) } as AuditFinding;
}

function logicalLines(input: string) {
  const physicalLines = input.split(/\r?\n/);
  const lines: { text: string; start: number }[] = [];
  let offset = 0;
  let pending = "";
  let pendingStart = 0;
  for (const physicalLine of physicalLines) {
    if (!pending) pendingStart = offset;
    pending += physicalLine.endsWith("\\") ? `${physicalLine.slice(0, -1)} ` : physicalLine;
    if (!physicalLine.endsWith("\\")) {
      if (pending.trim() && !pending.trimStart().startsWith("#")) lines.push({ text: pending.trim(), start: pendingStart });
      pending = "";
    }
    offset += physicalLine.length + 1;
  }
  if (pending.trim() && !pending.trimStart().startsWith("#")) lines.push({ text: pending.trim(), start: pendingStart });
  return lines;
}

function secretValueIsReal(value: string) {
  return value.length > 0 && !/^(?:replace[-_ ]?me|changeme|example|dummy|your[-_ ]?value|<[^>]+>)$/i.test(value);
}

function imageIsFloating(image: string) {
  if (image.includes("@sha256:")) return false;
  const imageWithoutPlatform = image.split(" ")[0];
  const lastPart = imageWithoutPlatform.slice(imageWithoutPlatform.lastIndexOf("/") + 1);
  return !lastPart.includes(":") || lastPart.endsWith(":latest");
}

const knownInstructions = new Set(["ADD", "ARG", "CMD", "COPY", "ENTRYPOINT", "ENV", "EXPOSE", "FROM", "HEALTHCHECK", "LABEL", "MAINTAINER", "ONBUILD", "RUN", "SHELL", "STOPSIGNAL", "USER", "VOLUME", "WORKDIR"]);

export function analyzeDockerfile(input: string): AuditFinding[] {
  if (!input.trim()) return [];
  const findings: AuditFinding[] = [];
  const lines = logicalLines(input);
  let stage = 0;
  let stageHasNonRootUser = false;
  let sawInstruction = false;

  for (const line of lines) {
    const match = /^([A-Za-z]+)(?:\s+(.*))?$/.exec(line.text);
    if (!match?.[1]) {
      findings.push(finding(input, "parse", `line-${line.start}`, [line.text]));
      continue;
    }
    sawInstruction = true;
    const instruction = match[1].toUpperCase();
    const argument = match[2]?.trim() ?? "";
    if (!knownInstructions.has(instruction)) {
      findings.push(finding(input, "parse", `instruction-${line.start}`, [line.text], `${instruction} is not a recognized Dockerfile instruction.`));
      continue;
    }
    if (instruction === "FROM") {
      stage += 1;
      stageHasNonRootUser = false;
      const image = argument.split(/\s+/)[0] ?? "";
      if (image && imageIsFloating(image)) findings.push(finding(input, "floatingImage", `stage-${stage}`, [image, "FROM"], `Stage ${stage} uses ${image}.`));
      continue;
    }
    if (instruction === "USER") {
      stageHasNonRootUser = argument !== "" && argument !== "0" && !/^root(?:\b|:)/i.test(argument);
      if (!stageHasNonRootUser) findings.push(finding(input, "root", `user-${line.start}`, ["USER"], `The image explicitly selects ${argument || "root"}.`));
      continue;
    }
    if ((instruction === "ARG" || instruction === "ENV") && /(?:PASSWORD|PASSWD|TOKEN|SECRET|API[_-]?KEY|PRIVATE[_-]?KEY|ACCESS[_-]?KEY)/i.test(argument)) {
      const assignment = argument.match(/(?:^|\s)[A-Za-z_][A-Za-z0-9_-]*=([^\s]+)?/);
      if (assignment?.[1] && secretValueIsReal(assignment[1])) findings.push(finding(input, "secret", `${instruction.toLowerCase()}-${line.start}`, [argument.split(/\s|=/)[0] ?? instruction], `${instruction} includes a credential-like value.`));
    }
    if (instruction === "RUN" && /(?:curl|wget)\b[^|\n]*\|\s*(?:sh|bash|ash|zsh)\b/i.test(argument)) findings.push(finding(input, "remoteScript", `run-${line.start}`, ["curl", "wget"], "The command executes remote content directly."));
    if (instruction === "ADD" && /^(?:https?|ftp):\/\//i.test(argument)) findings.push(finding(input, "remoteAdd", `add-${line.start}`, [argument.split(/\s+/)[0] ?? "ADD"], "The build downloads a remote source via ADD."));
    if (instruction === "RUN" && /(?:apt|apk|yum|dnf)[^\n]*(?:install|add)[^\n]*\bsudo\b/i.test(argument)) findings.push(finding(input, "sudo", `sudo-${line.start}`, ["sudo"], "The package manager installs sudo."));
    if (instruction === "RUN" && /\bchmod\s+(?:-[^\s]+\s+)?(?:777|a\+rwx)\b/i.test(argument)) findings.push(finding(input, "worldWritable", `chmod-${line.start}`, ["chmod"], "The command grants broad write permissions."));
  }
  if (sawInstruction && stage > 0 && !stageHasNonRootUser) findings.push(finding(input, "root", `stage-${stage}`, ["FROM"], "The final image stage has no non-root USER."));
  return findings;
}
