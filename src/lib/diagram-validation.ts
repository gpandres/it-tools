import { validateIp } from './network.ts';

export type DiagramData = { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] };
export type DiagramIssue = { id: string; severity: 'error' | 'warning'; title: string; detail: string };

export function parseDiagram(value: unknown): DiagramData | null {
  if (!value || typeof value !== "object") return null;
  const item = value as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(item.nodes) || !Array.isArray(item.edges) || item.nodes.length > 500 || item.edges.length > 1000) return null;
  const nodes = item.nodes.filter((node): node is Record<string, unknown> => {
    if (!node || typeof node !== "object") return false;
    const n = node as { id?: unknown; position?: { x?: unknown; y?: unknown } };
    return typeof n.id === "string" && n.id.length <= 128 && !!n.position && Number.isFinite(n.position.x) && Number.isFinite(n.position.y);
  });
  const edges = item.edges.filter((edge): edge is Record<string, unknown> => {
    if (!edge || typeof edge !== "object") return false;
    const e = edge as { id?: unknown; source?: unknown; target?: unknown };
    return typeof e.id === "string" && e.id.length <= 128 && typeof e.source === "string" && typeof e.target === "string";
  });
  if (nodes.length !== item.nodes.length || edges.length !== item.edges.length) return null;
  const nodeIds = new Set<string>();
  if (nodes.some((node) => {
    const id = node.id as string;
    if (nodeIds.has(id)) return true;
    nodeIds.add(id);
    return false;
  })) return null;

  const edgeIds = new Set<string>();
  const edgeKeys = new Set<string>();
  if (edges.some((edge) => {
    const id = edge.id as string;
    const key = [edge.source, edge.sourceHandle, edge.target, edge.targetHandle].map(String).join('|');
    if (edgeIds.has(id) || edgeKeys.has(key)) return true;
    edgeIds.add(id);
    edgeKeys.add(key);
    return false;
  })) return null;

  return edges.every((edge) => nodeIds.has(edge.source as string) && nodeIds.has(edge.target as string)) ? { nodes, edges } : null;
}

function readNodeString(node: Record<string, unknown>, key: string) {
  return typeof node[key] === 'string' ? node[key] as string : '';
}

export function validateDiagram(diagram: DiagramData): DiagramIssue[] {
  const issues: DiagramIssue[] = [];
  const connectedNodeIds = new Set(diagram.edges.flatMap((edge) => [edge.source, edge.target].filter((id): id is string => typeof id === 'string')));
  const seenIps = new Map<string, string>();
  const seenEdges = new Set<string>();

  for (const node of diagram.nodes) {
    const nodeId = readNodeString(node, 'id');
    const data = node.data && typeof node.data === 'object' ? node.data as Record<string, unknown> : {};
    const label = readNodeString(data, 'label') || nodeId;
    const ip = readNodeString(data, 'ip').trim();
    const vlan = readNodeString(data, 'vlan').trim();

    if (!connectedNodeIds.has(nodeId)) {
      issues.push({ id: `orphan-${nodeId}`, severity: 'warning', title: 'Isolated node', detail: `${label} has no connections.` });
    }
    if (ip) {
      const address = ip.split('/')[0];
      const prefix = ip.includes('/') ? Number(ip.split('/')[1]) : null;
      if (!validateIp(address) || (prefix !== null && (!Number.isInteger(prefix) || prefix < 0 || prefix > 32))) {
        issues.push({ id: `ip-invalid-${nodeId}`, severity: 'error', title: 'Invalid IPv4 address', detail: `${label} uses ${ip}.` });
      } else if (seenIps.has(ip)) {
        issues.push({ id: `ip-duplicate-${nodeId}`, severity: 'error', title: 'Duplicate IP address', detail: `${ip} is used by ${seenIps.get(ip)} and ${label}.` });
      } else {
        seenIps.set(ip, label);
      }
    }
    if (vlan && (!/^\d+$/.test(vlan) || Number(vlan) < 1 || Number(vlan) > 4094)) {
      issues.push({ id: `vlan-invalid-${nodeId}`, severity: 'error', title: 'Invalid VLAN', detail: `${label} uses VLAN ${vlan}; use a value from 1 to 4094.` });
    }
  }

  for (const edge of diagram.edges) {
    const key = [edge.source, edge.sourceHandle, edge.target, edge.targetHandle].map(String).join('|');
    if (seenEdges.has(key)) {
      issues.push({ id: `edge-duplicate-${edge.id}`, severity: 'error', title: 'Duplicate connection', detail: 'The same endpoints and ports are connected more than once.' });
    }
    seenEdges.add(key);
    if (edge.source === edge.target) {
      issues.push({ id: `edge-loop-${edge.id}`, severity: 'warning', title: 'Self-connection', detail: 'A link cannot normally connect a device to itself.' });
    }
  }

  return issues;
}
