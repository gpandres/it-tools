import assert from "node:assert/strict";
import test from "node:test";
import { analyzeKubernetesManifest } from "../src/lib/kubernetes-audit.ts";

test("Kubernetes audit parses multiple documents and reports container-level issues", () => {
  const findings = analyzeKubernetesManifest(`apiVersion: v1
kind: Pod
metadata:
  name: api
spec:
  containers:
    - name: api
      image: example/api:latest
      securityContext:
        privileged: true
        allowPrivilegeEscalation: true
      ports:
        - containerPort: 8080
          hostPort: 8080
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: broad
rules:
  - apiGroups: [""]
    resources: ["*"]
    verbs: ["get"]`);

  assert.ok(findings.some(finding => finding.id.startsWith("privileged:")));
  assert.ok(findings.some(finding => finding.id.startsWith("floating-image:")));
  assert.ok(findings.some(finding => finding.id.startsWith("host-port:")));
  assert.ok(findings.some(finding => finding.id.startsWith("rbac-wildcard:")));
  assert.ok(findings.every(finding => finding.line > 0 && finding.excerpt.length > 0));
});

test("Kubernetes audit reports malformed YAML without throwing", () => {
  const findings = analyzeKubernetesManifest("kind: Pod\nspec: [");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, "parse-error:document");
  assert.equal(findings[0].severity, "high");
});
