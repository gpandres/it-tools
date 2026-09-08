"use client";

import { ConfigAuditTool } from "@/components/config-audit-tool";
import { analyzeKubernetesManifest } from "@/lib/kubernetes-audit";

export default function KubernetesAuditorPage() { return <ConfigAuditTool title="Kubernetes Manifest Analyzer" description="Audit Kubernetes YAML for privilege, RBAC, secrets, image and workload-hardening issues." placeholder={'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: example\nspec:\n  template:\n    spec:\n      hostNetwork: true\n      containers:\n        - name: app\n          image: example/app:latest'} analyzer={analyzeKubernetesManifest} />; }
