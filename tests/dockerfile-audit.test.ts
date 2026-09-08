import assert from "node:assert/strict";
import test from "node:test";
import { analyzeDockerfile } from "../src/lib/dockerfile-audit.ts";

test("Dockerfile audit understands stages and instruction semantics", () => {
  const findings = analyzeDockerfile(`FROM ubuntu:latest AS build
ARG API_TOKEN=real-token
RUN curl https://example.test/install.sh | bash
FROM ubuntu@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
RUN chmod 777 /opt/app
CMD ["./app"]`);

  assert.ok(findings.some(finding => finding.id.startsWith("floating-image:")));
  assert.ok(findings.some(finding => finding.id.startsWith("build-secret:")));
  assert.ok(findings.some(finding => finding.id.startsWith("remote-script:")));
  assert.ok(findings.some(finding => finding.id.startsWith("world-writable:")));
  assert.ok(findings.some(finding => finding.id.startsWith("root:")));
});

test("Dockerfile audit does not flag placeholder secrets", () => {
  const findings = analyzeDockerfile("FROM alpine:3.20\nENV API_KEY=replace-me\nUSER 10001");
  assert.equal(findings.some(finding => finding.id.startsWith("build-secret:")), false);
  assert.equal(findings.some(finding => finding.id.startsWith("root:")), false);
});
