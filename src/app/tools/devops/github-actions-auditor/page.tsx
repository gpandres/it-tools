"use client";

import { ConfigAuditTool, type AuditRule } from "@/components/config-audit-tool";

const rules: AuditRule[] = [
  { id: "writeall", label: "Broad workflow permissions", severity: "high", pattern: /permissions:\s*write-all/i, explanation: "The workflow grants write access to every supported permission.", fix: "Set permissions: {} and grant only the specific read/write scopes required per job." },
  { id: "prtarget", label: "pull_request_target usage", severity: "high", pattern: /pull_request_target:/i, explanation: "This event can expose write-scoped secrets when running code influenced by a pull request.", fix: "Use pull_request where possible and isolate untrusted code from privileged jobs." },
  { id: "unpinned", label: "Unpinned third-party action", severity: "medium", pattern: /uses:\s+[\w.-]+\/[\w.-]+@(?![0-9a-f]{40}\b)[^\s]+/i, explanation: "A third-party action uses a mutable tag or branch.", fix: "Pin actions to a full commit SHA and review updates deliberately." },
  { id: "interpolation", label: "Shell interpolation risk", severity: "high", pattern: /run:\s*[^\n]*(?:github\.event|inputs\.|github\.head_ref)/i, explanation: "Untrusted workflow data is interpolated directly into a shell command.", fix: "Pass values through environment variables and quote them safely." },
  { id: "secretlog", label: "Possible secret logging", severity: "high", pattern: /(?:echo|printf|print)\s+[^\n]*(?:secrets\.|PASSWORD|TOKEN|API[_-]?KEY)/i, explanation: "A command appears to print a secret or credential-like value.", fix: "Remove the logging and mask/rotate any value already exposed." },
];

export default function GithubActionsAuditorPage() { return <ConfigAuditTool title="GitHub Actions Security Auditor" description="Review GitHub Actions workflows for excessive permissions, injection and supply-chain risks." placeholder={'name: CI\non:\n  pull_request_target:\npermissions: write-all\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo "${{ github.event.pull_request.title }}"'} rules={rules} />; }
