import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGithubActionsWorkflow } from "../src/lib/github-actions-audit.ts";

test("GitHub Actions audit checks workflow and job structure", () => {
  const findings = analyzeGithubActionsWorkflow(`name: CI
on:
  pull_request_target:
permissions: write-all
jobs:
  build:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v4
      - run: echo "\${{ github.event.pull_request.title }}"
`);

  assert.ok(findings.some(finding => finding.id.startsWith("broad-permissions:")));
  assert.ok(findings.some(finding => finding.id.startsWith("privileged-event:")));
  assert.ok(findings.some(finding => finding.id.startsWith("unpinned-action:")));
  assert.ok(findings.some(finding => finding.id.startsWith("shell-injection:")));
  assert.ok(findings.some(finding => finding.id.startsWith("self-hosted-runner:")));
  assert.ok(findings.some(finding => finding.id.startsWith("cache-privileged-event:")));
});

test("GitHub Actions audit reports malformed YAML without throwing", () => {
  const findings = analyzeGithubActionsWorkflow("name: CI\njobs: [");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, "parse-error:workflow");
});
