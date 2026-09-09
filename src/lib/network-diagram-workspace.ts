import { readLocalStorage, writeLocalStorage } from './storage.ts';
import { parseDiagram, type DiagramMetadata } from './diagram-validation.ts';
import type { NetworkEdge, NetworkNode } from '@/app/tools/network/diagram/types';

export const NETWORK_DIAGRAM_LIBRARY_KEY = 'network_diagram_library';
export const MAX_SAVED_NETWORK_DIAGRAMS = 10;
export const NETWORK_DIAGRAM_TEMPLATES_KEY = 'network_diagram_templates';
export const MAX_SAVED_NETWORK_TEMPLATES = 8;

export type SavedNetworkDiagram = {
  id: string;
  title: string;
  description: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  updatedAt: number;
};

export function readNetworkDiagramLibrary(): SavedNetworkDiagram[] {
  const raw = readLocalStorage(NETWORK_DIAGRAM_LIBRARY_KEY);
  if (!raw) return [];
  try {
    return parseNetworkDiagramLibrary(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeNetworkDiagramLibrary(diagrams: SavedNetworkDiagram[]): boolean {
  return writeLocalStorage(NETWORK_DIAGRAM_LIBRARY_KEY, JSON.stringify(diagrams.slice(0, MAX_SAVED_NETWORK_DIAGRAMS)));
}

export function readNetworkDiagramTemplates(): SavedNetworkDiagram[] {
  const raw = readLocalStorage(NETWORK_DIAGRAM_TEMPLATES_KEY);
  if (!raw) return [];
  try {
    return parseNetworkDiagramTemplates(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeNetworkDiagramTemplates(templates: SavedNetworkDiagram[]): boolean {
  return writeLocalStorage(NETWORK_DIAGRAM_TEMPLATES_KEY, JSON.stringify(templates.slice(0, MAX_SAVED_NETWORK_TEMPLATES)));
}

export function parseNetworkDiagramLibrary(value: unknown): SavedNetworkDiagram[] {
  return parseNetworkDiagramCollection(value, MAX_SAVED_NETWORK_DIAGRAMS);
}

export function parseNetworkDiagramTemplates(value: unknown): SavedNetworkDiagram[] {
  return parseNetworkDiagramCollection(value, MAX_SAVED_NETWORK_TEMPLATES);
}

function parseNetworkDiagramCollection(value: unknown, maxItems: number): SavedNetworkDiagram[] {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set<string>();
  const diagrams: SavedNetworkDiagram[] = [];

  for (const item of value.slice(0, maxItems)) {
    if (!item || typeof item !== 'object') continue;
    const source = item as Record<string, unknown>;
    const parsed = parseDiagram(source);
    const id = safeString(source.id, 80).trim();
    if (!parsed || !id || seenIds.has(id)) continue;
    seenIds.add(id);
    const metadata: DiagramMetadata = parsed.metadata || {};
    const updatedAt = typeof source.updatedAt === 'number' && Number.isFinite(source.updatedAt) ? source.updatedAt : 0;
    diagrams.push({
      id,
      title: metadata.title || 'Untitled topology',
      description: metadata.description || '',
      nodes: parsed.nodes as unknown as NetworkNode[],
      edges: parsed.edges as unknown as NetworkEdge[],
      updatedAt,
    });
  }

  return diagrams.sort((left, right) => right.updatedAt - left.updatedAt);
}

function safeString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}
