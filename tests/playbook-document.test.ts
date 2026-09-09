import test from "node:test";
import assert from "node:assert/strict";
import { createPlaybookDocument, parsePlaybookDocument, playbookMarkdown } from "../src/lib/playbook-document.ts";
import type { Runbook } from "../src/app/tools/sysadmin/runbook/components/types.ts";

const legacyPlaybook: Runbook = {
  id: "legacy-1",
  title: "Legacy playbook",
  description: "A compatible runbook-shaped playbook.",
  variables: [],
  steps: [{ id: "step-1", type: "information", title: "Assess", content: "Collect evidence." }],
};

test("playbook documents migrate legacy runbook exports and preserve incident context", () => {
  const migrated = parsePlaybookDocument(legacyPlaybook);
  assert.equal(migrated?.playbook.id, "legacy-1");
  assert.equal(migrated?.incident.phase, "Prepare");

  const document = createPlaybookDocument(legacyPlaybook, {
    phase: "Contain", priority: "Critical", incidentCommander: "On-call lead", technicalLead: "SOC", communicationsLead: "Comms", escalationCriteria: "Escalate on confirmed impact.",
  });
  const parsed = parsePlaybookDocument(JSON.parse(JSON.stringify(document)));
  assert.deepEqual(parsed, document);
});

test("playbook markdown includes command context and workflow steps", () => {
  const markdown = playbookMarkdown(createPlaybookDocument(legacyPlaybook, {
    phase: "Detect", priority: "High", incidentCommander: "IR lead", technicalLead: "", communicationsLead: "", escalationCriteria: "Escalate on scope.",
  }));
  assert.match(markdown, /## Incident command/);
  assert.match(markdown, /Current phase:\*\* Detect/);
  assert.match(markdown, /### 1\. \[INFORMATION\] Assess/);
});
