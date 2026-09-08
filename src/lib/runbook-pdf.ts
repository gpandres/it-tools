import { Runbook } from '@/app/tools/sysadmin/runbook/components/types';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 44;

function ascii(value: string | undefined) {
  return (value || '').replace(/[^\x20-\x7e]/g, '?');
}

function escapePdfText(value: string) {
  return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(value: string, max = 88) {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (word.length > max) {
      if (current) lines.push(current);
      for (let i = 0; i < word.length; i += max) lines.push(word.slice(i, i + max));
      current = '';
    } else if ((current + ' ' + word).trim().length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function imageBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function binaryString(bytes: Uint8Array) {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
  }
  return chunks.join('');
}

function bytesFromString(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) bytes[i] = value.charCodeAt(i) & 0xff;
  return bytes;
}

function joinBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function drawText(lines: string[], startY: number, fontSize = 9, leading = 14) {
  let content = `BT /F1 ${fontSize} Tf ${MARGIN} ${startY} Td ${leading} TL\n`;
  lines.forEach((line, index) => {
    if (index) content += 'T*\n';
    content += `(${escapePdfText(line)}) Tj\n`;
  });
  return `${content}ET\n`;
}

function pageContent(lines: string[], pageNumber: number, totalPages: number) {
  let content = 'q 0.02 0.02 0.02 rg 0 0 595 842 re f Q\n';
  content += 'q 1 0.69 0 rg 44 786 507 2 re f Q\n';
  content += 'BT /F2 18 Tf 44 758 Td (IT TOOLS) Tj ET\n';
  content += 'BT /F1 9 Tf 44 742 Td (RUNBOOK EXPORT) Tj ET\n';
  content += '0.75 0.75 0.75 rg\n';
  content += drawText(lines, 710, 9, 14);
  content += `0.35 0.35 0.35 rg BT /F1 8 Tf 44 30 Td (Generated locally - page ${pageNumber} of ${totalPages}) Tj ET\n`;
  return content;
}

export function downloadRunbookPdf(runbook: Runbook, diagram?: { dataUrl: string; width: number; height: number }) {
  const lines: string[] = [
    runbook.title.toUpperCase(),
    '',
    ...wrap(runbook.description, 88),
    '',
    `ID: ${runbook.id}`,
    `VERSION: ${runbook.version || '1.0'}`,
    `STEPS: ${runbook.steps.length}`,
    '',
    'VARIABLES'
  ];
  runbook.variables.forEach(variable => lines.push(...wrap(`${variable.name}: ${variable.description} [default: ${variable.defaultValue || 'none'}]`, 88)));
  lines.push('', 'STEPS');
  runbook.steps.forEach((step, index) => {
    lines.push('', `${index + 1}. [${step.type.toUpperCase()}] ${step.title} (${step.id})`);
    const body = step.description ?? step.content;
    if (body) lines.push(...wrap(body, 88));
    if (step.command) lines.push(...wrap(`Command: ${step.command}`, 88));
    if (step.expectedResult) lines.push(...wrap(`Expected result: ${step.expectedResult}`, 88));
    if (step.items) step.items.forEach(item => lines.push(...wrap(`[ ] ${item}`, 88)));
    if (step.type === 'decision') {
      lines.push(...wrap(`Question: ${step.decisionQuestion}`, 88));
      lines.push(`YES -> ${step.decisionTrueNext || 'not set'}`);
      lines.push(`NO -> ${step.decisionFalseNext || 'not set'}`);
    }
  });

  const pageLineLimit = 45;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += pageLineLimit) pages.push(lines.slice(i, i + pageLineLimit));
  if (!pages.length) pages.push([]);
  const hasDiagram = Boolean(diagram?.dataUrl);
  const totalPages = pages.length + (hasDiagram ? 1 : 0);
  const objects: Uint8Array[] = [];
  const object = (value: string | Uint8Array) => {
    objects.push(typeof value === 'string' ? bytesFromString(value) : value);
    return objects.length;
  };

  const fontRegular = object('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBold = object('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  const image = hasDiagram ? imageBytes(diagram!.dataUrl) : null;
  const imageId = image ? object(joinBytes([
    bytesFromString(`<< /Type /XObject /Subtype /Image /Width ${Math.max(1, Math.round(diagram!.width))} /Height ${Math.max(1, Math.round(diagram!.height))} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
    image,
    bytesFromString('\nendstream')
  ])) : null;

  pages.forEach((page, index) => {
    const content = pageContent(page, index + 1, totalPages);
    contentIds.push(object(`<< /Length ${content.length} >>\nstream\n${content}endstream`));
  });
  if (hasDiagram) {
    let diagramContent = pageContent(['DIAGRAM', '', 'High-resolution runbook flow diagram'], totalPages, totalPages);
    const maxWidth = PAGE_WIDTH - MARGIN * 2;
    const maxHeight = PAGE_HEIGHT - 150;
    const scale = Math.min(maxWidth / diagram!.width, maxHeight / diagram!.height);
    const width = diagram!.width * scale;
    const height = diagram!.height * scale;
    diagramContent += `q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${MARGIN} ${(PAGE_HEIGHT - 105 - height).toFixed(2)} cm /Im1 Do Q\n`;
    contentIds.push(object(`<< /Length ${diagramContent.length} >>\nstream\n${diagramContent}endstream`));
  }

  const pagesId = objects.length + 1;
  const catalogId = pagesId + 1;
  contentIds.forEach(contentId => {
    const resources = imageId && contentId === contentIds[contentIds.length - 1]
      ? `<< /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> /XObject << /Im1 ${imageId} 0 R >> >>`
      : `<< /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >>`;
    pageIds.push(object(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources ${resources} /Contents ${contentId} 0 R >>`));
  });
  object(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  object(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const chunks: Uint8Array[] = [bytesFromString('%PDF-1.4\n%\xff\xff\xff\xff\n')];
  const offsets: number[] = [0];
  let offset = chunks[0].length;
  objects.forEach((value, index) => {
    const prefix = bytesFromString(`${index + 1} 0 obj\n`);
    const suffix = bytesFromString('\nendobj\n');
    offsets.push(offset);
    chunks.push(prefix, value, suffix);
    offset += prefix.length + value.length + suffix.length;
  });
  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(bytesFromString(xref));
  const blob = new Blob([joinBytes(chunks)], { type: 'application/pdf' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `runbook-${runbook.id}.pdf`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}
