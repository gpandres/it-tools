"use client";

import { ConfigAuditTool, type AuditRule } from "@/components/config-audit-tool";

const rules: AuditRule[] = [
  { id: "root", label: "Container runs as root", severity: "high", pattern: /^(?!.*\bUSER\s+[^\s#]+)/im, explanation: "No non-root USER instruction was detected.", fix: "Create a dedicated UID/GID and finish the image with USER." },
  { id: "latest", label: "Floating image tag", severity: "medium", pattern: /^\s*FROM\s+[^\s:]+\s*(?:#.*)?$/im, explanation: "An unpinned base image can change without a review.", fix: "Pin an immutable version or digest and update it deliberately." },
  { id: "privileged", label: "Privileged runtime", severity: "high", pattern: /--privileged|--cap-add\s+(?:ALL|SYS_ADMIN)/i, explanation: "The runtime configuration requests broad host capabilities.", fix: "Remove the flag or grant only the smallest required capability." },
  { id: "secret", label: "Secret in build instruction", severity: "high", pattern: /(?:ENV|ARG)\s+[^\n]*(?:PASSWORD|TOKEN|SECRET|API[_-]?KEY|PRIVATE[_-]?KEY)\s*=/i, explanation: "Build arguments and environment layers can expose credentials in image history.", fix: "Use a secret mount or runtime secret store and rotate exposed values." },
  { id: "curlpipe", label: "Remote script execution", severity: "high", pattern: /(?:curl|wget)[^\n|]*\|\s*(?:sh|bash|ash)/i, explanation: "A remote response is executed without an integrity check.", fix: "Pin and verify an artifact checksum, or copy a reviewed script into the build context." },
  { id: "sudo", label: "Sudo installed in image", severity: "low", pattern: /(?:apt|apk|yum|dnf)[^\n]*(?:install|add)[^\n]*\bsudo\b/i, explanation: "Sudo increases the attack surface in production images.", fix: "Remove it from runtime images and use a multi-stage build." },
];

export default function DockerfileLinterPage() { return <ConfigAuditTool title="Dockerfile Security Linter" description="Review Dockerfiles for unsafe base images, privilege, secrets and supply-chain risks." placeholder={'FROM ubuntu:latest\n\nRUN apt-get update && apt-get install -y curl\nENV API_KEY=replace-me\n\nCMD ["./app"]'} rules={rules} />; }
