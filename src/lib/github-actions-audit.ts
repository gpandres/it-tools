import { loadAll, YAMLException } from "js-yaml";
import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type JsonObject = Record<string, unknown>;

const ruleDefinitions = {
  parse: { id: "parse-error", label: "Invalid workflow YAML", severity: "high", explanation: "The workflow could not be parsed, so its security properties cannot be evaluated reliably.", fix: "Correct the YAML syntax and validate the workflow with GitHub's workflow editor or actionlint." },
  permissions: { id: "broad-permissions", label: "Broad workflow permissions", severity: "high", explanation: "The workflow grants write access broadly instead of declaring the smallest required token permissions.", fix: "Set permissions: {} at workflow level and grant only the required permission per job." },
  missingPermissions: { id: "missing-permissions", label: "Implicit workflow permissions", severity: "low", explanation: "The workflow does not declare a permissions policy, so its effective GITHUB_TOKEN access depends on repository or organization defaults.", fix: "Declare an explicit least-privilege permissions block and override it only for jobs that need more access." },
  privilegedEvent: { id: "privileged-event", label: "Privileged pull request event", severity: "high", explanation: "pull_request_target runs in a privileged context while processing pull request-controlled metadata or code.", fix: "Prefer pull_request and isolate any trusted automation from untrusted pull request content." },
  unpinnedAction: { id: "unpinned-action", label: "Unpinned action", severity: "medium", explanation: "A reusable action is referenced by a mutable tag or branch, so its code can change without a workflow diff.", fix: "Pin third-party actions to a reviewed full commit SHA and update them deliberately." },
  injection: { id: "shell-injection", label: "Untrusted expression in shell", severity: "high", explanation: "User-controlled or event-controlled data is interpolated directly into a shell command.", fix: "Pass the expression through env and quote it as data, or validate it before use." },
  secretLog: { id: "secret-log", label: "Possible secret logging", severity: "high", explanation: "A shell command appears to print a secret or credential-like workflow value.", fix: "Remove the output, avoid exposing secrets to the shell, and rotate any value already logged." },
  selfHosted: { id: "self-hosted-runner", label: "Self-hosted runner", severity: "medium", explanation: "Jobs on self-hosted runners can expose persistent host state to untrusted workflow code.", fix: "Use ephemeral isolated runners or restrict the job to trusted events and repositories." },
  checkoutCredential: { id: "checkout-credential", label: "Persisted checkout credential", severity: "medium", explanation: "The checkout action persists repository credentials in local Git configuration for later steps.", fix: "Set persist-credentials: false unless a later step explicitly needs authenticated Git operations." },
  cacheOnPrivilegedEvent: { id: "cache-privileged-event", label: "Cache use in privileged event", severity: "high", explanation: "A cache action is used in a workflow triggered by a privileged pull request event, which can create cache poisoning or code-execution risk.", fix: "Separate trusted and untrusted workflows and avoid sharing writable caches across trust boundaries." },
} satisfies Record<string, Omit<AuditRule, "pattern">>;

type RuleKey = keyof typeof ruleDefinitions;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringAt(value: unknown, key: string): string | undefined {
  if (!isObject(value) || typeof value[key] !== "string") return undefined;
  return value[key];
}

function objectAt(value: unknown, key: string): JsonObject | undefined {
  if (!isObject(value) || !isObject(value[key])) return undefined;
  return value[key];
}

function arrayAt(value: unknown, key: string): unknown[] {
  if (!isObject(value) || !Array.isArray(value[key])) return [];
  return value[key];
}

function sourceFor(input: string, needles: readonly string[]) {
  const index = needles.map(needle => input.indexOf(needle)).filter(position => position >= 0).sort((a, b) => a - b)[0] ?? 0;
  return { ...sourcePositionAt(input, index), excerpt: sourceExcerptAt(input, index) };
}

function createFinding(input: string, key: RuleKey, suffix: string, needles: readonly string[], detail?: string): AuditFinding {
  const rule = ruleDefinitions[key];
  return { ...rule, pattern: /$^/, id: `${rule.id}:${suffix}`, ...sourceFor(input, needles), ...(detail ? { explanation: `${rule.explanation} ${detail}` } : {}) } as AuditFinding;
}

function isFullCommitSha(value: string) {
  return /^[0-9a-f]{40}$/i.test(value);
}

function actionUsesMutableRef(value: string) {
  const at = value.lastIndexOf("@");
  if (at < 1) return false;
  return !isFullCommitSha(value.slice(at + 1));
}

function hasWriteAll(value: unknown) {
  return value === "write-all" || (isObject(value) && Object.values(value).some(permission => permission === "write-all"));
}

function hasUntrustedExpression(value: string) {
  return /\$\{\{\s*(?:github\.event|github\.head_ref|github\.base_ref|github\.ref|github\.ref_name|inputs\.)/i.test(value);
}

function hasSecretExpression(value: string) {
  return /\$\{\{\s*secrets\.[^}]+\}\}|\b(?:PASSWORD|TOKEN|SECRET|API[_-]?KEY|PRIVATE[_-]?KEY)\b/i.test(value);
}

function auditWorkflow(input: string, workflow: JsonObject, workflowIndex: number): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const jobs = objectAt(workflow, "jobs");
  const permissions = workflow.permissions;
  const triggerSource = input.includes("pull_request_target") ? ["pull_request_target"] : ["on:"];
  const privilegedTrigger = isObject(workflow.on) && "pull_request_target" in workflow.on || input.includes("pull_request_target:");

  if (hasWriteAll(permissions)) findings.push(createFinding(input, "permissions", `${workflowIndex}:workflow`, ["write-all", "permissions:"]));
  if (permissions === undefined) findings.push(createFinding(input, "missingPermissions", `${workflowIndex}:workflow`, ["name:", "on:"]));
  if (privilegedTrigger) findings.push(createFinding(input, "privilegedEvent", `${workflowIndex}:trigger`, triggerSource));
  if (!jobs) return findings;

  for (const [jobId, job] of Object.entries(jobs)) {
    if (!isObject(job)) continue;
    const jobPermissions = job.permissions;
    const jobNeedles = [jobId, "permissions:"];
    if (hasWriteAll(jobPermissions)) findings.push(createFinding(input, "permissions", `${workflowIndex}:${jobId}`, jobNeedles, `Job ${jobId} grants write access broadly.`));
    const runsOn = job["runs-on"];
    const runnerValues = Array.isArray(runsOn) ? runsOn : [runsOn];
    if (runnerValues.some(value => typeof value === "string" && value.toLowerCase().includes("self-hosted"))) findings.push(createFinding(input, "selfHosted", `${workflowIndex}:${jobId}`, ["self-hosted", jobId], `Job ${jobId} runs on a self-hosted runner.`));

    for (const [stepIndex, step] of arrayAt(job, "steps").entries()) {
      if (!isObject(step)) continue;
      const stepName = stringAt(step, "name") ?? `${jobId} step ${stepIndex + 1}`;
      const uses = stringAt(step, "uses");
      const run = stringAt(step, "run");
      if (uses && actionUsesMutableRef(uses) && !uses.startsWith("./")) findings.push(createFinding(input, "unpinnedAction", `${workflowIndex}:${jobId}:${stepIndex}`, [uses], `${stepName} uses ${uses}.`));
      if (run && hasUntrustedExpression(run)) findings.push(createFinding(input, "injection", `${workflowIndex}:${jobId}:${stepIndex}`, ["run:", run.slice(0, 48)], `${stepName} passes event or input data directly to a shell.`));
      if (run && hasSecretExpression(run) && /\b(?:echo|printf|print|cat)\b/i.test(run)) findings.push(createFinding(input, "secretLog", `${workflowIndex}:${jobId}:${stepIndex}`, ["run:", "secrets.", "TOKEN", "PASSWORD"], `${stepName} may print a secret.`));
      if (uses?.toLowerCase().startsWith("actions/checkout@") && step["with"] && isObject(step["with"]) && step["with"]["persist-credentials"] !== false) findings.push(createFinding(input, "checkoutCredential", `${workflowIndex}:${jobId}:${stepIndex}`, ["persist-credentials", "actions/checkout"], `${stepName} keeps checkout credentials by default.`));
      if (privilegedTrigger && uses?.toLowerCase().startsWith("actions/cache@")) findings.push(createFinding(input, "cacheOnPrivilegedEvent", `${workflowIndex}:${jobId}:${stepIndex}`, ["actions/cache", "pull_request_target"], `${stepName} uses a cache in a privileged event workflow.`));
    }
  }
  return findings;
}

export function analyzeGithubActionsWorkflow(input: string): AuditFinding[] {
  if (!input.trim()) return [];
  try {
    return loadAll(input).filter(isObject).flatMap((workflow, index) => auditWorkflow(input, workflow, index));
  } catch (error) {
    const message = error instanceof YAMLException ? error.reason : "The YAML parser returned an unknown error.";
    return [createFinding(input, "parse", "workflow", ["name:", "on:", "jobs:"], message)];
  }
}
