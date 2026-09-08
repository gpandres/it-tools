"use client";

import { ConfigAuditTool, type AuditRule } from "@/components/config-audit-tool";

const rules: AuditRule[] = [
  { id: "privileged", label: "Privileged pod", severity: "high", pattern: /privileged:\s*true|hostNetwork:\s*true|hostPID:\s*true/i, explanation: "The workload can access host-level resources.", fix: "Disable host namespaces and privileged mode unless explicitly required and isolated." },
  { id: "hostpath", label: "Host filesystem mount", severity: "high", pattern: /hostPath:/i, explanation: "hostPath exposes a node filesystem to the workload.", fix: "Prefer a PersistentVolume with a controlled storage class." },
  { id: "latest", label: "Floating container image", severity: "medium", pattern: /image:\s*[^\s:#]+\s*(?:#.*)?$/im, explanation: "The image has no version tag or digest and may change between deployments.", fix: "Pin a version and preferably an image digest." },
  { id: "root", label: "Runs as root", severity: "medium", pattern: /runAsUser:\s*0|runAsNonRoot:\s*false/i, explanation: "The pod explicitly permits a root process.", fix: "Set runAsNonRoot: true and use a non-root UID." },
  { id: "resources", label: "Missing resource limits", severity: "low", pattern: /kind:\s*(?:Deployment|Pod|StatefulSet)/i, explanation: "Workloads should define CPU and memory requests/limits to reduce noisy-neighbor risk.", fix: "Add resources.requests and resources.limits for each container." },
  { id: "secret", label: "Secret value in manifest", severity: "high", pattern: /(?:password|token|api[_-]?key|private[_-]?key)\s*:\s*[^\s{][^\n]*/i, explanation: "A credential-like value appears directly in the manifest.", fix: "Reference a Kubernetes Secret or external secret manager; rotate the value if real." },
  { id: "rbac", label: "Broad RBAC permission", severity: "high", pattern: /resources:\s*\[\s*["']\*["']|verbs:\s*\[\s*["']\*["']/i, explanation: "Wildcard RBAC permissions grant more access than necessary.", fix: "Scope verbs and resources to the exact operations required." },
];

export default function KubernetesAuditorPage() { return <ConfigAuditTool title="Kubernetes Manifest Analyzer" description="Audit Kubernetes YAML for privilege, RBAC, secrets, image and workload-hardening issues." placeholder={'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: example\nspec:\n  template:\n    spec:\n      hostNetwork: true\n      containers:\n        - name: app\n          image: example/app:latest'} rules={rules} />; }
