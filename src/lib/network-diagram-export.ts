import { parseDiagram, type DiagramData } from './diagram-validation.ts';
import type { NetworkEdge, NetworkNode } from '@/app/tools/network/diagram/types';

export const NETWORK_INVENTORY_HEADERS = [
  'record_type', 'id', 'name', 'type', 'source', 'target', 'ip_cidr', 'subnet_cidr', 'vlan', 'zone', 'status', 'role',
  'vendor', 'model', 'source_port', 'target_port', 'bandwidth', 'vlan_mode', 'allowed_vlans', 'hostname_or_label',
] as const;

export function normalizeNetworkDiagram(nodes: NetworkNode[], edges: NetworkEdge[]): DiagramData | null {
  return parseDiagram({ nodes, edges });
}

export function serializeNetworkDiagram(nodes: NetworkNode[], edges: NetworkEdge[]): string | null {
  const safeDiagram = normalizeNetworkDiagram(nodes, edges);
  return safeDiagram ? JSON.stringify(safeDiagram, null, 2) : null;
}

export function serializeNetworkInventory(nodes: NetworkNode[], edges: NetworkEdge[]): string {
  const rows: string[][] = [NETWORK_INVENTORY_HEADERS.slice()];
  nodes.forEach(node => rows.push([
    'node', node.id, node.data.label, node.data.type, '', '', node.data.ip || '', node.data.subnet || '', node.data.vlan || '', node.data.zone || '',
    node.data.status || '', node.data.role || '', node.data.vendor || '', node.data.model || '', '', '', '', '', '', node.data.hostname || '',
  ]));
  edges.forEach(edge => rows.push([
    'edge', edge.id, edge.data?.label || '', edge.data?.connectionType || '', edge.source, edge.target, '', '', '', '', '', '', '', '',
    edge.data?.sourcePort || '', edge.data?.targetPort || '', edge.data?.bandwidth || '', edge.data?.vlanMode || '', edge.data?.vlans || '',
    edge.data?.label || '',
  ]));

  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
}

function escapeCsvCell(value: string): string {
  const text = String(value);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}
