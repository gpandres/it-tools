import assert from "node:assert/strict";
import test from "node:test";
import { analyzeConfig, type AuditRule } from "../src/lib/config-audit.ts";

const rule: AuditRule = {
  id: "secret",
  label: "Credential-like value",
  severity: "high",
  pattern: /TOKEN\s*=\s*.+/g,
  explanation: "A token-like value is present.",
  fix: "Move it to a secret manager.",
};

test("config audit returns a useful source position and excerpt", () => {
  const findings = analyzeConfig("name: app\nTOKEN = example", [rule]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 2);
  assert.equal(findings[0].column, 1);
  assert.equal(findings[0].excerpt, "TOKEN = example");
});

test("config audit does not mutate global regular expressions", () => {
  const input = "TOKEN = one\nTOKEN = two";

  assert.equal(analyzeConfig(input, [rule]).length, 1);
  assert.equal(analyzeConfig(input, [rule]).length, 1);
});
