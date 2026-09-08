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
  writableRoot: { id: "writable-root-filesystem", label: "Writable container filesystem", severity: "medium", explanation: "The container explicitly allows writes to its root filesystem, which gives dropped payloads and tampering more room to persist.", fix: "Set readOnlyRootFilesystem: true and provide narrowly scoped emptyDir mounts for paths that must be writable." },
  missingProbes: { id: "missing-health-probes", label: "Health probes missing", severity: "low", explanation: "The workload has neither a livenessProbe nor a readinessProbe, so Kubernetes cannot detect a stuck process or safely gate traffic.", fix: "Define liveness and readiness probes that represent the application's real health and startup behavior." },
  reservedNamespace: { id: "reserved-namespace", label: "Workload in kube-system", severity: "medium", explanation: "A user workload is deployed into kube-system, a namespace reserved for cluster-critical components.", fix: "Deploy application workloads into a dedicated namespace with explicit RBAC and NetworkPolicy controls." },
  capabilityDrop: { id: "capability-drop-missing", label: "Capabilities are not dropped by default", severity: "medium", explanation: "The container adds Linux capabilities without explicitly dropping ALL first, leaving ambient capabilities available.", fix: "Set capabilities.drop: [ALL] and add back only the exact capability required by the workload." },
  secretGovernance: { id: "secret-governance", label: "Secret namespace or immutability hardening missing", severity: "low", explanation: "The Secret is in the default namespace or is mutable, which increases the chance of accidental exposure or in-place tampering.", fix: "Use a dedicated namespace and set immutable: true where the secret does not need rotation in place." },
  secretType: { id: "secret-type-mismatch", label: "TLS material stored as Opaque Secret", severity: "medium", explanation: "Certificate/key material is stored in an untyped Secret, reducing validation and making consumers easier to misconfigure.", fix: "Use type kubernetes.io/tls with tls.crt and tls.key keys for TLS material." },
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

function decodeBase64(value: string) {
  try {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return null;
    const decoded = atob(value);
    return [...decoded].every(character => character === "\t" || character === "\n" || character === "\r" || character.charCodeAt(0) >= 32) ? decoded : null;
  } catch {
    return null;
  }
}

function auditDocument(input: string, document: JsonObject, documentIndex: number): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const kind = stringAt(document, "kind") ?? "document";
  const name = stringAt(objectAt(document, "metadata"), "name") ?? `${kind} ${documentIndex + 1}`;
  const spec = workloadSpec(document);

  if (spec && stringAt(objectAt(document, "metadata"), "namespace") === "kube-system") {
    findings.push(createFinding(input, "reservedNamespace", `${documentIndex}:namespace`, ["namespace: kube-system"], `${name} is placed in kube-system.`));
  }

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
      if (securityContext?.readOnlyRootFilesystem === false) findings.push(createFinding(input, "writableRoot", `${documentIndex}:${containerName}`, ["readOnlyRootFilesystem"], `${containerName} explicitly keeps its root filesystem writable.`));
      if (!objectAt(container, "livenessProbe") && !objectAt(container, "readinessProbe")) findings.push(createFinding(input, "missingProbes", `${documentIndex}:${containerName}`, ["containers:", containerName], `${containerName} has no liveness or readiness probe.`));
      const capabilities = objectAt(securityContext, "capabilities");
      const added = arrayAt(capabilities, "add").filter((capability): capability is string => typeof capability === "string");
      const dangerous = added.find(capability => ["ALL", "SYS_ADMIN", "SYS_PTRACE", "NET_ADMIN", "SYS_MODULE", "DAC_READ_SEARCH"].includes(capability.toUpperCase()));
      if (dangerous) findings.push(createFinding(input, "dangerousCapability", `${documentIndex}:${containerName}`, [dangerous, "capabilities:"], `${containerName} adds ${dangerous}.`));
      const dropped = arrayAt(capabilities, "drop").filter((capability): capability is string => typeof capability === "string").map(capability => capability.toUpperCase());
      if (added.length > 0 && !dropped.includes("ALL")) findings.push(createFinding(input, "capabilityDrop", `${documentIndex}:${containerName}`, ["capabilities:", "add:", "drop:"], `${containerName} adds capabilities without drop: [ALL].`));
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
    const encodedData = objectAt(document, "data");
    if (encodedData) {
      for (const [key, encoded] of Object.entries(encodedData)) {
        if (typeof encoded !== "string") continue;
        const decoded = decodeBase64(encoded);
        if (decoded && /(?:admin|password|secret|token|passwd)\s*[:=]/i.test(decoded)) findings.push(createFinding(input, "secret", `${documentIndex}:data:${key}`, [key, encoded], `${name}.${key} decodes to a credential-like value (${decoded.slice(0, 40)}).`));
      }
    }
    const namespace = stringAt(objectAt(document, "metadata"), "namespace");
    if (namespace === "default" || document.immutable !== true) findings.push(createFinding(input, "secretGovernance", `${documentIndex}:governance`, ["namespace:", "immutable:"], `${name} should use a dedicated namespace and immutable: true where possible.`));
    const secretType = stringAt(document, "type") ?? "Opaque";
    const keys = [...Object.keys(data ?? {}), ...Object.keys(objectAt(document, "data") ?? {})];
    if (secretType === "Opaque" && keys.some(key => /(?:tls\.key|tls\.crt|private.?key|certificate)/i.test(key))) findings.push(createFinding(input, "secretType", `${documentIndex}:type`, ["type:", "tls.key", "tls.crt", "privateKey"], `${name} contains TLS material but uses type Opaque.`));
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
