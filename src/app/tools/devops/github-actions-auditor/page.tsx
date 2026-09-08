"use client";

import { ConfigAuditTool } from "@/components/config-audit-tool";
import { analyzeGithubActionsWorkflow } from "@/lib/github-actions-audit";

export default function GithubActionsAuditorPage() { return <ConfigAuditTool title="GitHub Actions Security Auditor" description="Review GitHub Actions workflows for excessive permissions, injection and supply-chain risks." placeholder={'name: CI\non:\n  pull_request_target:\npermissions: write-all\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo "${{ github.event.pull_request.title }}"'} analyzer={analyzeGithubActionsWorkflow} />; }
