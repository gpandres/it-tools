import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRunbookPdfDocument } from '../src/lib/runbook-pdf.ts';
import type { Runbook } from '../src/app/tools/sysadmin/runbook/components/types.ts';

const runbook: Runbook = {
  id: 'pdf-regression', title: 'PDF export regression', description: 'A branching procedure.',
  variables: [],
  steps: [
    { id: 'decision', type: 'decision', title: 'Continue?', decisionTrueNext: 'yes', decisionFalseNext: 'no' },
    { id: 'yes', type: 'command', title: 'Proceed' },
    { id: 'no', type: 'verification', title: 'Stop' }
  ]
};

test('list-only PDF preserves the steps and decision targets without a diagram page', () => {
  const document = createRunbookPdfDocument(runbook);
  assert.equal(document.images, undefined);
  const content = JSON.stringify(document.content);
  assert.ok(content.includes('YES -> yes    NO -> no'));
  assert.ok(content.includes('Proceed'));
  assert.ok(content.includes('Stop'));
  assert.ok(!content.includes('"pageBreak":"before"'));
});

test('list + diagram PDF embeds the supplied image on a separate page within A4 bounds', () => {
  const dataUrl = 'data:image/png;base64,test-image';
  const document = createRunbookPdfDocument(runbook, { dataUrl, width: 1200, height: 3000 });
  assert.deepEqual(document.images, { runbookDiagram: dataUrl });
  const content = document.content as Record<string, unknown>[];
  assert.equal(content.at(-2)?.text, 'DIAGRAM');
  assert.equal(content.at(-2)?.pageBreak, 'before');
  assert.deepEqual(content.at(-1), { image: 'runbookDiagram', fit: [507, 700], alignment: 'center' });
  assert.ok(JSON.stringify(content).includes('YES -> yes    NO -> no'));
});
