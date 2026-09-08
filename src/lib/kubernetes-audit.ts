import { loadAll, YAMLException } from "js-yaml";
import { sourceExcerptAt, sourcePositionAt, type AuditFinding, type AuditRule } from "./config-audit.ts";

type JsonObject = Record<string, unknown>;

const ruleDefinitions = {
  parse: { id: "parse-error", label: "Invalid Kubernetes YAML", severity: "high", explanation: "The manifest could not be parsed as YAML, so no security checks can be trusted.", fix: "Correct the YAML syntax and validate it with kubectl apply --dry-run=client." },
  privileged: { id: "privileged", label: "Privileged container", severity: "high", explanation: "A container requests privileged mode and can bypass normal container isolation.", fix: "Remove privileged: true and grant only narrowly scoped capabilities if required." },
  hostNamespace: { id: "host-namespace", label: "Host namespace enabled", severity: "high", explanation: "The pod shares a host network, PID, or IPC namespace, increasing access to node resources.", fix: "Disable hostNetwork, hostPID, and hostIPC unless the workload has a documented node-level requirement." },
  hostPath: { id: "hostpath", label: "Host filesystem mount", severity: "high", explanation: "hostPath exposes a node filesystem path to the workload.", fix: "Use a PersistentVolume or a narrowly scoped read-only mount instead." },
  floatingImage: { id: "floating-image", label: "Floating container image", severity: "medium", explanation: "The image is not pinned to a stable tag or digest and can change between deployments.", fix: "Pin a reviewed version and preferably an immutable image digest." },
  root: { id: "root", label: "Container may run as root", severity: "medium", explanation: "The pod explicitly allows UID 0 or disables the non-root requirement.", fix: "Set runAsNonRoot: true and use a dedicated non-zero runAsUser." },
  resources: { id: "resources", label: "Missing resource limits", severity: "low", explanation: "The container has no CPU and memory requests/limits, which can enable noisy-neighbor and resource-exhaustion problems.", fix: "Define requests and limits for CPU and memory for every container." },
  secret: { id: "secret-value", label: "Secret value in manifest", severity: "high", explanation: "A credential-like value is stored directly in the manifest.", fix: "Reference a Kubernetes Secret or external secret manager and rotate any real value." },
  rbac: { id: "rbac-wildcard", label: "Wildcard RBAC permission", severity: "high", explanation: "The RBAC rule grants wildcard resources or verbs, which can exceed the intended access scope.", fix: "List the exact resources and verbs required by the service account." },
  dangerousCapability: { id: "dangerous-capability", label: "Dangerous Linux capability", severity: "high", explanation: "The container adds a capability that can materially expand access to the host or kernel.", fix: "Drop all capabilities by default and add only a justified, narrowly scoped capability." },
  escalation: { id: "privilege-escalation", label: "Privilege escalation allowed", severity: "medium", explanation: "The container can gain additional privileges during execution.", fix: "Set allowPrivilegeEscalation: false unless the workload has a documented exception." },
  hostPort: { id: "host-port", label: "Host port exposed", severity: "medium", explanation: "A container binds directly to a node port, bypassing normal Service and ingress controls.", fix: "Prefer a Service or Ingress and remove hostPort unless node binding is required." },
  serviceToken: { id: "service-account-token", label: "Service account token auto-mounted", severity: "low", explanation: "The pod receives a Kubernetes API token even when it may not need one.", fix: "Set automountServiceAccountToken: false and enable it only for API clients." },
} satisfies Record<string, Omit<AuditRule, "pattern">>;

type RuleKey = keyof typeof ruleDefinitions;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectAt(value: unknown, key: string): JsonObject | undefined {
  if (!isObject(value)) return undefined;
  const child = value[key];
  return isObject(child) ? child : undefined;
}

function arrayAt(value: unknown, key: string): unknown[] {
  if (!isObject(value) || !Array.isArray(value[key])) return [];
  return value[key];
}

function stringAt(value: unknown, key: string): string | undefined {
  if (!isObject(value) || typeof value[key] !== "string") return undefined;
  return value[key];
}

function hasValue(value: unknown, key: string, expected: unknown) {
  return isObject(value) && value[key] === expected;
}

function workloadSpec(document: JsonObject): JsonObject | undefined {
  const kind = stringAt(document, "kind");
  if (kind === "Pod") return objectAt(document, "spec");
  if (kind === "CronJob") {
    const jobTemplate = objectAt(objectAt(document, "spec"), "jobTemplate");
    return objectAt(objectAt(jobTemplate, "spec"), "template")
      ? objectAt(objectAt(objectAt(jobTemplate, "spec"), "template"), "spec")
      : undefined;
  }
  const template = objectAt(objectAt(document, "spec"), "template");
  return template ? objectAt(template, "spec") : undefined;
}

function sourceFor(input: string, needles: readonly string[]) {
  const index = needles.map(needle => input.indexOf(needle)).filter(position => position >= 0).sort((a, b) => a - b)[0] ?? 0;
  return { ...sourcePositionAt(input, index), excerpt: sourceExcerptAt(input, index) };
}

function createFinding(input: string, key: RuleKey, suffix: string, needles: readonly string[], detail?: string): AuditFinding {
  const rule = ruleDefinitions[key];
  return { ...rule, pattern: /$^/, id: `${rule.id}:${suffix}`, ...sourceFor(input, needles), ...(detail ? { explanation: `${rule.explanation} ${detail}` } : {}) } as AuditFinding;
}

function containerEntries(spec: JsonObject) {
  return [
    ...arrayAt(spec, "containers"),
    ...arrayAt(spec, "initContainers"),
    ...arrayAt(spec, "ephemeralContainers"),
  ].filter(isObject);
}

function imageIsFloating(image: string) {
  if (image.includes("@sha256:")) return false;
  const lastPart = image.slice(image.lastIndexOf("/") + 1);
  return !lastPart.includes(":") || lastPart.endsWith(":latest");
}

function secretLikeKey(key: string) {
  return /(?:password|passwd|token|secret|api[_-]?key|private[_-]?key|access[_-]?key)/i.test(key);
}

function auditDocument(input: string, document: JsonObject, documentIndex: number): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const kind = stringAt(document, "kind") ?? "document";
  const name = stringAt(objectAt(document, "metadata"), "name") ?? `${kind} ${documentIndex + 1}`;
  const spec = workloadSpec(document);

  if (spec) {
    for (const [key, needles] of [["hostNetwork", ["hostNetwork"]], ["hostPID", ["hostPID"]], ["hostIPC", ["hostIPC"]]] as const) {
      if (hasValue(spec, key, true)) findings.push(createFinding(input, "hostNamespace", `${documentIndex}:${key}`, needles, `${name} enables ${key}.`));
    }
    for (const container of containerEntries(spec)) {
      const containerName = stringAt(container, "name") ?? "unnamed container";
      const securityContext = objectAt(container, "securityContext");
      if (hasValue(container, "privileged", true) || hasValue(securityContext, "privileged", true)) findings.push(createFinding(input, "privileged", `${documentIndex}:${containerName}`, ["privileged", "securityContext"], `${containerName} in ${name} requests privileged mode.`));
      const image = stringAt(container, "image");
      if (image && imageIsFloating(image)) findings.push(createFinding(input, "floatingImage", `${documentIndex}:${containerName}`, [image, "image:"], `${containerName} uses ${image}.`));
      const podSecurityContext = objectAt(spec, "securityContext");
      const runAsUser = securityContext?.runAsUser ?? podSecurityContext?.runAsUser;
      const runAsNonRoot = securityContext?.runAsNonRoot ?? podSecurityContext?.runAsNonRoot;
      if (runAsUser === 0 || runAsNonRoot === false) findings.push(createFinding(input, "root", `${documentIndex}:${containerName}`, ["runAsUser", "runAsNonRoot"], `${containerName} in ${name} can run as root.`));
      if (securityContext?.allowPrivilegeEscalation === true) findings.push(createFinding(input, "escalation", `${documentIndex}:${containerName}`, ["allowPrivilegeEscalation"], `${containerName} allows privilege escalation.`));
      const capabilities = objectAt(securityContext, "capabilities");
      const added = arrayAt(capabilities, "add").filter((capability): capability is string => typeof capability === "string");
      const dangerous = added.find(capability => ["ALL", "SYS_ADMIN", "SYS_PTRACE", "NET_ADMIN", "SYS_MODULE", "DAC_READ_SEARCH"].includes(capability.toUpperCase()));
      if (dangerous) findings.push(createFinding(input, "dangerousCapability", `${documentIndex}:${containerName}`, [dangerous, "capabilities:"], `${containerName} adds ${dangerous}.`));
      if (!objectAt(container, "resources") || !objectAt(objectAt(container, "resources"), "limits")) findings.push(createFinding(input, "resources", `${documentIndex}:${containerName}`, ["resources:", containerName], `${containerName} in ${name} has no resource limits.`));
      const ports = arrayAt(container, "ports");
      if (ports.some(port => isObject(port) && typeof port.hostPort === "number")) findings.push(createFinding(input, "hostPort", `${documentIndex}:${containerName}`, ["hostPort", containerName], `${containerName} exposes a host port.`));
      const environment = arrayAt(container, "env");
      if (environment.some(variable => isObject(variable) && secretLikeKey(stringAt(variable, "name") ?? "") && typeof variable.value === "string")) findings.push(createFinding(input, "secret", `${documentIndex}:${containerName}:env`, ["env:", "value:"], `${containerName} contains a literal credential-like environment value.`));
    }
    if (arrayAt(spec, "volumes").some(volume => isObject(volume) && isObject(volume.hostPath))) findings.push(createFinding(input, "hostPath", `${documentIndex}:volume`, ["hostPath", "volumes:"], `${name} mounts a node filesystem path.`));
    if (spec.automountServiceAccountToken !== false && (stringAt(document, "kind") === "Pod" || stringAt(document, "kind")?.includes("Deployment"))) findings.push(createFinding(input, "serviceToken", `${documentIndex}:service-account`, ["automountServiceAccountToken", "serviceAccountName"], `${name} auto-mounts a service account token.`));
  }

  if (kind === "Role" || kind === "ClusterRole") {
    const directRules = arrayAt(document, "rules");
    for (const [rule, ruleIndex] of directRules.map((value, index) => [value, index] as const)) {
      if (!isObject(rule)) continue;
      const wildcardResources = arrayAt(rule, "resources").includes("*");
      const wildcardVerbs = arrayAt(rule, "verbs").includes("*");
      if (wildcardResources || wildcardVerbs) findings.push(createFinding(input, "rbac", `${documentIndex}:${ruleIndex}`, ["resources:", "verbs:"], `${name} grants wildcard ${wildcardResources ? "resources" : "verbs"}.`));
    }
  }

  if (kind === "Secret") {
    const data = objectAt(document, "stringData");
    if (data && Object.keys(data).some(secretLikeKey)) findings.push(createFinding(input, "secret", `${documentIndex}:stringData`, ["stringData:", ...Object.keys(data)], `${name} contains credential-like stringData.`));
  }
  if (isObject(document)) {
    const serialized = JSON.stringify(document);
    if (secretLikeKey(name) || /(?:password|token|api[_-]?key|private[_-]?key)\s*:/i.test(serialized)) findings.push(createFinding(input, "secret", `${documentIndex}:literal`, ["password:", "token:", "apiKey:", "privateKey:"], `${name} contains a credential-like field.`));
  }
  return findings;
}

export function analyzeKubernetesManifest(input: string): AuditFinding[] {
  if (!input.trim()) return [];
  try {
    const documents = loadAll(input).filter(isObject);
    return documents.flatMap((document, index) => auditDocument(input, document, index));
  } catch (error) {
    const message = error instanceof YAMLException ? error.reason : "The YAML parser returned an unknown error.";
    return [createFinding(input, "parse", "document", ["apiVersion", "kind"], message)];
  }
}
