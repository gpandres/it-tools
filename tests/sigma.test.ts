import assert from "node:assert/strict";
import test from "node:test";
import { validateSigmaRule } from "../src/lib/sigma.ts";

test("Sigma validator accepts a valid rule and rejects unknown conditions", () => {
  const valid = `title: Process execution
logsource:
  product: windows
detection:
  selection:
    Image|endswith: powershell.exe
  condition: selection
level: high`;
  assert.deepEqual(validateSigmaRule(valid), []);
  assert.ok(validateSigmaRule(valid.replace("condition: selection", "condition: missing")).some(item => item.severity === "error"));
});

test("Sigma validator catches malformed YAML and invalid metadata", () => {
  const diagnostics = validateSigmaRule("title: [\nid: not-a-uuid");
  assert.ok(diagnostics.some(item => item.severity === "error"));
});
