import type { Runbook } from '../app/tools/sysadmin/runbook/components/types';
import { downloadPdfWithPdfMake, type PdfMakeDocument } from './pdfmake-export.ts';

type DiagramImage = { dataUrl: string; width: number; height: number };

export function createRunbookPdfDocument(runbook: Runbook, diagram?: DiagramImage): PdfMakeDocument {
  const stepStyle = (type: Runbook['steps'][number]['type']) => {
    if (type === 'warning') return 'warningTitle';
    if (type === 'decision') return 'decisionTitle';
    if (type === 'command') return 'commandTitle';
    return 'stepTitle';
  };
  const content: unknown[] = [
    { table: { widths: ['*', 'auto'], body: [[
      { text: 'IT TOOLS', style: 'brand' },
      { text: 'INTERACTIVE PLAYBOOK', style: 'eyebrow', alignment: 'right' }
    ]] }, layout: 'noBorders', margin: [0, 0, 0, 14] },
    { text: runbook.title || 'Untitled runbook', style: 'title' },
    { text: runbook.description || 'No description provided.', style: 'body', margin: [0, 0, 0, 16] },
    { table: { widths: ['25%', '25%', '25%', '25%'], body: [
      [{ text: 'ID', style: 'metaKey' }, { text: 'VERSION', style: 'metaKey' }, { text: 'STEPS', style: 'metaKey' }, { text: 'VARIABLES', style: 'metaKey' }],
      [runbook.id, runbook.version || '1.0', String(runbook.steps.length), String(runbook.variables.length)]
    ] }, layout: 'lightHorizontalLines', margin: [0, 0, 0, 18] }
  ];

  if (runbook.variables.length) {
    content.push({ text: 'VARIABLES', style: 'section' });
    content.push({ ul: runbook.variables.map(variable => `${variable.name}: ${variable.description || 'No description'}${variable.defaultValue ? ` (default: ${variable.defaultValue})` : ''}`), style: 'body' });
  }

  content.push({ text: 'STEPS', style: 'section' });
  runbook.steps.forEach((step, index) => {
    const stack: unknown[] = [{ text: `${index + 1}. [${step.type.toUpperCase()}] ${step.title} (${step.id})`, style: stepStyle(step.type) }];
    const body = step.description || step.content;
    if (body) stack.push({ text: body, style: 'body' });
    if (step.command) stack.push({ text: `Command: ${step.command}`, style: 'code' });
    if (step.expectedResult) stack.push({ text: `Expected result: ${step.expectedResult}`, style: 'body' });
    if (step.items?.length) stack.push({ ul: step.items, style: 'body' });
    if (step.type === 'decision') {
      stack.push({ text: `Question: ${step.decisionQuestion || 'Not provided.'}`, style: 'body' });
      stack.push({ text: `YES -> ${step.decisionTrueNext || 'not set'}    NO -> ${step.decisionFalseNext || 'not set'}`, style: 'body' });
    }
    content.push({ stack, margin: [0, 0, 0, 12], unbreakable: true });
  });

  if (diagram?.dataUrl) {
    content.push({ text: 'DIAGRAM', style: 'section', pageBreak: 'before' });
    content.push({ image: 'runbookDiagram', fit: [507, 700], alignment: 'center' });
  }

  return {
    pageSize: 'A4', pageMargins: [44, 44, 44, 44], content,
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    ...(diagram?.dataUrl ? { images: { runbookDiagram: diagram.dataUrl } } : {}),
    styles: {
      brand: { fontSize: 18, bold: true, color: '#047857', characterSpacing: 1.2 },
      eyebrow: { fontSize: 8, bold: true, color: '#2563eb', characterSpacing: 1.2 },
      title: { fontSize: 22, bold: true, color: '#0f172a', margin: [0, 0, 0, 8] },
      section: { fontSize: 12, bold: true, color: '#1d4ed8', margin: [0, 14, 0, 7], decoration: 'underline', decorationColor: '#93c5fd' },
      metaKey: { fontSize: 8, bold: true, color: '#1e3a8a', fillColor: '#dbeafe', margin: [6, 6, 6, 6] },
      body: { fontSize: 10, color: '#334155', lineHeight: 1.3, margin: [0, 0, 0, 5] },
      stepTitle: { fontSize: 11, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
      commandTitle: { fontSize: 11, bold: true, color: '#047857', margin: [0, 0, 0, 5] },
      decisionTitle: { fontSize: 11, bold: true, color: '#b45309', margin: [0, 0, 0, 5] },
      warningTitle: { fontSize: 11, bold: true, color: '#b91c1c', margin: [0, 0, 0, 5] },
      code: { fontSize: 9, color: '#065f46', background: '#ecfdf5', margin: [6, 6, 6, 6] }
    },
    footer: (currentPage: number, pageCount: number) => ({ text: `Generated locally - page ${currentPage} of ${pageCount}`, alignment: 'center', fontSize: 8, color: '#64748b' })
  };
}

export function downloadRunbookPdf(runbook: Runbook, diagram?: DiagramImage) {
  downloadPdfWithPdfMake(createRunbookPdfDocument(runbook, diagram), `runbook-${runbook.id}.pdf`);
}
