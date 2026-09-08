import { getNodesBounds, getViewportForBounds, Node } from '@xyflow/react';
import { toJpeg, toPng } from 'html-to-image';

type Format = 'png' | 'jpeg';

function inlineSvgStyles(root: HTMLElement) {
  const properties = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight', 'paint-order', 'opacity', 'visibility'];
  const snapshots = Array.from(root.querySelectorAll<SVGElement>('svg, svg *')).map(element => ({
    element, original: element.getAttribute('style'), values: properties.map(property => [property, getComputedStyle(element).getPropertyValue(property)] as const)
  }));
  snapshots.forEach(({ element, values }) => values.forEach(([property, value]) => element.style.setProperty(property, value)));
  return () => snapshots.forEach(({ element, original }) => original === null ? element.removeAttribute('style') : element.setAttribute('style', original));
}

export async function captureRunbookDiagram(root: HTMLElement, nodes: Node[], format: Format, background: 'black' | 'white' | 'transparent' = 'black') {
  const flowViewport = root.querySelector<HTMLElement>('.react-flow__viewport');
  if (!flowViewport) throw new Error('The diagram is not ready to export');
  const bounds = nodes.length ? getNodesBounds(nodes) : { x: 0, y: 0, width: 1200, height: 800 };
  const padding = 80;
  const width = Math.min(4000, Math.max(1200, Math.ceil(bounds.width + padding * 2)));
  const height = Math.min(3000, Math.max(800, Math.ceil(bounds.height + padding * 2)));
  const viewport = nodes.length ? getViewportForBounds(bounds, width, height, 0.1, 2, padding / Math.max(bounds.width, bounds.height)) : { x: 0, y: 0, zoom: 1 };
  const backgroundColor = background === 'transparent' ? undefined : background === 'white' ? '#ffffff' : '#000000';
  let restore: (() => void) | undefined;
  let captureTarget: HTMLElement | undefined;
  try {
    await document.fonts.ready;
    captureTarget = root.cloneNode(true) as HTMLElement;
    captureTarget.removeAttribute('id');
    captureTarget.classList.add('runbook-exporting');
    captureTarget.dataset.exportBackground = background;
    captureTarget.style.position = 'fixed';
    captureTarget.style.left = '-10000px';
    captureTarget.style.top = '0';
    captureTarget.style.width = `${width}px`;
    captureTarget.style.height = `${height}px`;
    captureTarget.style.backgroundColor = backgroundColor || 'transparent';
    document.body.appendChild(captureTarget);
    const captureViewport = captureTarget.querySelector<HTMLElement>('.react-flow__viewport');
    if (!captureViewport) throw new Error('The diagram viewport is missing');
    captureViewport.style.width = `${width}px`;
    captureViewport.style.height = `${height}px`;
    captureViewport.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
    restore = inlineSvgStyles(captureTarget);
    const options = {
      width, height, pixelRatio: 1, cacheBust: true, backgroundColor,
      // Capture only the graph, not its off-screen staging container or controls.
      // A fixed left:-10000px on the rasterized root produces a valid but blank PNG.
      style: { position: 'relative', left: '0', top: '0', margin: '0' },
      filter: (node: HTMLElement) => !node.classList?.contains('diagram-export-exclude')
    };
    const dataUrl = format === 'png' ? await toPng(captureViewport, options) : await toJpeg(captureViewport, options);
    return { dataUrl, width, height };
  } finally {
    restore?.();
    captureTarget?.remove();
  }
}
