import { cidrToMaskInt, ipToInt, validateIp } from './network.ts';

export type DiagramMetadata = { title?: string; description?: string };
export type DiagramData = { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[]; metadata?: DiagramMetadata };
export type DiagramIssue = { id: string; severity: 'error' | 'warning'; title: string; detail: string };

const MAX_LABEL_LENGTH = 1000;
const NODE_DATA_FIELDS = ['label', 'type', 'ip', 'subnet', 'vlan', 'hostname', 'vendor', 'model', 'role', 'zone', 'status', 'notes', 'interfaces', 'groupColor'];
const EDGE_DATA_FIELDS = ['connectionType', 'label', 'sourcePort', 'targetPort', 'bandwidth', 'vlanMode', 'vlans'];
const CONNECTION_TYPES = new Set(['ethernet', 'fiber', 'wireless', 'vpn']);
const VLAN_MODES = new Set(['access', 'trunk', 'routed', 'unknown']);

function safeString(value: unknown, maxLength = MAX_LABEL_LENGTH) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function safeRecordFields(value: unknown, fields: string[]) {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (typeof source[field] === 'string') result[field] = safeString(source[field]);
  }
  return result;
}

export function parseDiagram(value: unknown): DiagramData | null {
  if (!value || typeof value !== "object") return null;
  const item = value as { nodes?: unknown; edges?: unknown; metadata?: unknown };
  if (!Array.isArray(item.nodes) || !Array.isArray(item.edges) || item.nodes.length > 500 || item.edges.length > 1000) return null;
  const nodes = item.nodes.map((node) => {
    if (!node || typeof node !== "object") return null;
    const source = node as { id?: unknown; position?: { x?: unknown; y?: unknown }; width?: unknown; height?: unknown; parentId?: unknown; extent?: unknown };
    const id = safeString(source.id, 128).trim();
    const x = source.position?.x;
    const y = source.position?.y;
    if (!id || !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x as number) > 1_000_000 || Math.abs(y as number) > 1_000_000) return null;
    const normalized: Record<string, unknown> = {
      id,
      type: 'networkNode',
      position: { x, y },
      data: safeRecordFields((node as Record<string, unknown>).data, NODE_DATA_FIELDS),
    };
    if (typeof source.width === 'number' && Number.isFinite(source.width) && source.width >= 120 && source.width <= 2000) normalized.width = source.width;
    if (typeof source.height === 'number' && Number.isFinite(source.height) && source.height >= 100 && source.height <= 2000) normalized.height = source.height;
    const parentId = safeString(source.parentId, 128).trim();
    if (parentId) normalized.parentId = parentId;
    if (source.extent === 'parent') normalized.extent = 'parent';
    return normalized;
  });
  const edges = item.edges.map((edge) => {
    if (!edge || typeof edge !== "object") return null;
    const source = edge as Record<string, unknown>;
    const id = safeString(source.id, 128).trim();
    const sourceId = safeString(source.source, 128).trim();
    const targetId = safeString(source.target, 128).trim();
    if (!id || !sourceId || !targetId) return null;
    const normalized: Record<string, unknown> = {
      id,
      source: sourceId,
      target: targetId,
      type: 'networkEdge',
      data: safeRecordFields(source.data, EDGE_DATA_FIELDS),
    };
    const sourceHandle = safeString(source.sourceHandle, 64).trim();
    const targetHandle = safeString(source.targetHandle, 64).trim();
    if (sourceHandle) normalized.sourceHandle = sourceHandle;
    if (targetHandle) normalized.targetHandle = targetHandle;
    if (typeof source.animated === 'boolean') normalized.animated = source.animated;
    return normalized;
  });
  if (nodes.some((node) => node === null) || edges.some((edge) => edge === null)) return null;
  const normalizedNodes = nodes as Record<string, unknown>[];
  const normalizedEdges = edges as Record<string, unknown>[];
  const nodeIds = new Set<string>();
  if (normalizedNodes.some((node) => {
    const id = node.id as string;
    if (nodeIds.has(id)) return true;
    nodeIds.add(id);
    return false;
  })) return null;
  if (normalizedNodes.some((node) => {
    const parentId = safeString(node.parentId, 128);
    return Boolean(parentId) && (parentId === node.id || !nodeIds.has(parentId));
  })) return null;
  const nodesById = new Map(normalizedNodes.map((node) => [node.id as string, node]));
  for (const node of normalizedNodes) {
    const parentId = safeString(node.parentId, 128);
    if (!parentId) continue;
    const parent = nodesById.get(parentId);
    const parentData = parent?.data && typeof parent.data === 'object' ? parent.data as Record<string, unknown> : {};
    if (readNodeString(parentData, 'type') !== 'group') return null;
    const ancestors = new Set<string>();
    let currentId: string | undefined = parentId;
    while (currentId) {
      if (ancestors.has(currentId)) return null;
      ancestors.add(currentId);
      const ancestor = nodesById.get(currentId);
      currentId = ancestor ? safeString(ancestor.parentId, 128) || undefined : undefined;
    }
  }

  const edgeIds = new Set<string>();
  const edgeKeys = new Set<string>();
  if (normalizedEdges.some((edge) => {
    const id = edge.id as string;
    const key = [edge.source, edge.sourceHandle, edge.target, edge.targetHandle].map(String).join('|');
    if (edgeIds.has(id) || edgeKeys.has(key)) return true;
    edgeIds.add(id);
    edgeKeys.add(key);
    return false;
  })) return null;

  if (!normalizedEdges.every((edge) => nodeIds.has(edge.source as string) && nodeIds.has(edge.target as string))) return null;
  const rawMetadata = item.metadata && typeof item.metadata === 'object' ? item.metadata as Record<string, unknown> : {};
  const metadata: DiagramMetadata = {};
  const title = safeString(rawMetadata.title, 200).trim();
  const description = safeString(rawMetadata.description, 2000).trim();
  if (title) metadata.title = title;
  if (description) metadata.description = description;
  return Object.keys(metadata).length > 0 ? { nodes: normalizedNodes, edges: normalizedEdges, metadata } : { nodes: normalizedNodes, edges: normalizedEdges };
}

function readNodeString(node: Record<string, unknown>, key: string) {
  return typeof node[key] === 'string' ? node[key] as string : '';
}

export function validateDiagram(diagram: DiagramData): DiagramIssue[] {
  const issues: DiagramIssue[] = [];
  const connectedNodeIds = new Set(diagram.edges.flatMap((edge) => [edge.source, edge.target].filter((id): id is string => typeof id === 'string')));
  const nodesById = new Map(diagram.nodes.map((node) => [readNodeString(node, 'id'), node]));
  const seenIps = new Map<string, string>();
  const explicitSubnets: SubnetRange[] = [];
  const usedPorts = new Map<string, { edgeId: string; label: string }>();
  const reportedPorts = new Set<string>();
  const nodeDegrees = new Map<string, number>();
  const seenEdges = new Set<string>();

  for (const node of diagram.nodes) {
    const nodeId = readNodeString(node, 'id');
    const data = node.data && typeof node.data === 'object' ? node.data as Record<string, unknown> : {};
    const label = readNodeString(data, 'label') || nodeId;
    const ip = readNodeString(data, 'ip').trim();
    const subnet = readNodeString(data, 'subnet').trim();
    const vlan = readNodeString(data, 'vlan').trim();

    // Groups are visual containers: their children own the actual links, so a
    // group itself must never be reported as an isolated network device.
    if (readNodeString(data, 'type') !== 'group' && !connectedNodeIds.has(nodeId)) {
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
    if (subnet) {
      const subnetRange = parseSubnetRange(subnet);
      if (!subnetRange) {
        issues.push({ id: `subnet-invalid-${nodeId}`, severity: 'error', title: 'Invalid subnet', detail: `${label} uses ${subnet}; enter an IPv4 network in CIDR notation.` });
      } else {
        explicitSubnets.push({ ...subnetRange, nodeId, label, value: subnet });
      }
    }
  }

  for (let leftIndex = 0; leftIndex < explicitSubnets.length; leftIndex += 1) {
    const left = explicitSubnets[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < explicitSubnets.length; rightIndex += 1) {
      const right = explicitSubnets[rightIndex];
      if (left.network <= right.broadcast && right.network <= left.broadcast) {
        issues.push({ id: `subnet-overlap-${left.nodeId}-${right.nodeId}`, severity: 'warning', title: 'Overlapping subnets', detail: `${left.label} (${left.value}) overlaps ${right.label} (${right.value}).` });
      }
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
    const sourceHandle = readNodeString(edge, 'sourceHandle');
    const targetHandle = readNodeString(edge, 'targetHandle');
    if (sourceHandle && !sourceHandle.endsWith('-source')) {
      issues.push({ id: `source-handle-${edge.id}`, severity: 'error', title: 'Invalid source handle', detail: `${sourceHandle} is not a source handle.` });
    }
    if (targetHandle && !targetHandle.endsWith('-target')) {
      issues.push({ id: `target-handle-${edge.id}`, severity: 'error', title: 'Invalid target handle', detail: `${targetHandle} is not a target handle.` });
    }
    const data = edge.data && typeof edge.data === 'object' ? edge.data as Record<string, unknown> : {};
    const connectionType = readNodeString(data, 'connectionType');
    const vlanMode = readNodeString(data, 'vlanMode');
    const vlans = readNodeString(data, 'vlans').trim();
    const sourceNode = nodesById.get(readNodeString(edge, 'source'));
    const targetNode = nodesById.get(readNodeString(edge, 'target'));
    const sourceData = sourceNode?.data && typeof sourceNode.data === 'object' ? sourceNode.data as Record<string, unknown> : {};
    const targetData = targetNode?.data && typeof targetNode.data === 'object' ? targetNode.data as Record<string, unknown> : {};
    if (!CONNECTION_TYPES.has(connectionType)) {
      issues.push({ id: `link-type-invalid-${edge.id}`, severity: 'error', title: 'Invalid connection type', detail: `${connectionType || 'No type'} is not a supported link type.` });
    }
    if (vlanMode && !VLAN_MODES.has(vlanMode)) {
      issues.push({ id: `vlan-mode-invalid-${edge.id}`, severity: 'error', title: 'Invalid VLAN mode', detail: `${vlanMode} is not a supported VLAN mode.` });
    }
    const vlanValues = vlans ? vlans.split(',').map(value => value.trim()).filter(Boolean) : [];
    if (vlanValues.some(value => !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 4094)) {
      issues.push({ id: `vlan-list-invalid-${edge.id}`, severity: 'error', title: 'Invalid allowed VLANs', detail: 'Allowed VLANs must be comma-separated values from 1 to 4094.' });
    }
    if (vlanMode === 'access' && vlanValues.length > 1) {
      issues.push({ id: `access-vlans-${edge.id}`, severity: 'error', title: 'Access link has multiple VLANs', detail: 'An access link should carry one VLAN; use trunk for multiple VLANs.' });
    }
    if (new Set(vlanValues).size !== vlanValues.length) {
      issues.push({ id: `vlan-list-duplicate-${edge.id}`, severity: 'warning', title: 'Duplicate allowed VLAN', detail: 'Remove repeated VLAN numbers from this link.' });
    }
    const sourceType = readNodeString(sourceData, 'type');
    const targetType = readNodeString(targetData, 'type');
    incrementDegree(nodeDegrees, readNodeString(edge, 'source'));
    incrementDegree(nodeDegrees, readNodeString(edge, 'target'));
    registerPort(usedPorts, reportedPorts, issues, readNodeString(edge, 'source'), readNodeString(data, 'sourcePort'), readNodeString(edge, 'id'), readNodeString(sourceData, 'label') || readNodeString(edge, 'source'));
    registerPort(usedPorts, reportedPorts, issues, readNodeString(edge, 'target'), readNodeString(data, 'targetPort'), readNodeString(edge, 'id'), readNodeString(targetData, 'label') || readNodeString(edge, 'target'));
    if (connectionType === 'wireless' && sourceType !== 'wireless' && targetType !== 'wireless') {
      issues.push({ id: `wireless-endpoints-${edge.id}`, severity: 'warning', title: 'Wireless link endpoints', detail: 'Wireless links normally include a WiFi access point or wireless bridge.' });
    }
    if (connectionType === 'vpn' && !['vpn', 'firewall', 'router', 'cloud', 'vpc'].includes(sourceType) && !['vpn', 'firewall', 'router', 'cloud', 'vpc'].includes(targetType)) {
      issues.push({ id: `vpn-endpoints-${edge.id}`, severity: 'warning', title: 'VPN link endpoints', detail: 'A VPN link normally terminates at a VPN gateway, router, firewall, or cloud edge.' });
    }
    if (vlanMode === 'trunk' && !vlans) {
      issues.push({ id: `trunk-vlans-${edge.id}`, severity: 'warning', title: 'Trunk without VLANs', detail: 'List the allowed VLANs or mark the link as unknown.' });
    }
    if (vlanMode === 'access' && !vlans) {
      issues.push({ id: `access-vlan-${edge.id}`, severity: 'warning', title: 'Access link without VLAN', detail: 'Set the access VLAN for this connection.' });
    }
    if (!connectionType) {
      issues.push({ id: `link-type-${edge.id}`, severity: 'warning', title: 'Connection type missing', detail: 'Choose ethernet, fiber, wireless, or VPN.' });
    }
  }

  const infrastructureTypes = new Set(['router', 'firewall', 'switch', 'load-balancer', 'ids-ips', 'vpn']);
  const edgeTypes = new Set(['router', 'firewall', 'vpn']);
  const isExternalPeer = (data: Record<string, unknown>) => {
    const zone = readNodeString(data, 'zone');
    const type = readNodeString(data, 'type');
    return ['internet', 'wan', 'cloud'].includes(zone) || ['cloud', 'vpc'].includes(type);
  };
  for (const node of diagram.nodes) {
    const nodeId = readNodeString(node, 'id');
    const data = node.data && typeof node.data === 'object' ? node.data as Record<string, unknown> : {};
    const type = readNodeString(data, 'type');
    const label = readNodeString(data, 'label') || nodeId;
    const neighborIds = diagram.edges.flatMap(edge => edge.source === nodeId ? [edge.target] : edge.target === nodeId ? [edge.source] : []).filter((id): id is string => typeof id === 'string');
    const externalPeerIds = new Set(neighborIds.filter(peerId => {
      const peer = nodesById.get(peerId);
      const peerData = peer?.data && typeof peer.data === 'object' ? peer.data as Record<string, unknown> : {};
      return isExternalPeer(peerData);
    }));
    const internalPeerCount = new Set(neighborIds).size - externalPeerIds.size;

    if (edgeTypes.has(type) && externalPeerIds.size > 0) {
      if (externalPeerIds.size < 2) {
        issues.push({ id: `wan-failover-${nodeId}`, severity: 'warning', title: 'WAN failover unavailable', detail: `${label} has ${externalPeerIds.size} external upstream; add an independent Internet/WAN peer for failover.` });
      }
      if (internalPeerCount === 0) {
        issues.push({ id: `internal-handoff-${nodeId}`, severity: 'warning', title: 'Internal handoff missing', detail: `${label} reaches an external network but has no LAN, DMZ, or server-side connection.` });
      }
    } else if (infrastructureTypes.has(type) && (nodeDegrees.get(nodeId) ?? 0) === 1) {
      issues.push({ id: `single-homed-${nodeId}`, severity: 'warning', title: 'Single-homed infrastructure', detail: `${label} has one connection; consider a redundant link or document the dependency.` });
    }
  }

  return issues;
}

type SubnetRange = { nodeId: string; label: string; value: string; network: number; broadcast: number };

function parseSubnetRange(value: string): Omit<SubnetRange, 'nodeId' | 'label' | 'value'> | null {
  const match = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/.exec(value);
  if (!match || !validateIp(match[1])) return null;
  const cidr = Number(match[2]);
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) return null;
  const mask = cidrToMaskInt(cidr);
  const network = (ipToInt(match[1]) & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  return { network, broadcast };
}

function incrementDegree(degrees: Map<string, number>, nodeId: string) {
  if (nodeId) degrees.set(nodeId, (degrees.get(nodeId) ?? 0) + 1);
}

function registerPort(usedPorts: Map<string, { edgeId: string; label: string }>, reportedPorts: Set<string>, issues: DiagramIssue[], nodeId: string, port: string, edgeId: string, label: string) {
  const normalizedPort = port.trim().toLowerCase();
  if (!nodeId || !normalizedPort) return;
  const key = `${nodeId}|${normalizedPort}`;
  const previous = usedPorts.get(key);
  if (previous && !reportedPorts.has(key)) {
    reportedPorts.add(key);
    issues.push({ id: `port-reused-${nodeId}-${normalizedPort}`, severity: 'error', title: 'Port reused', detail: `${label} uses port ${port} on multiple connections (${previous.edgeId} and ${edgeId}).` });
  } else if (!previous) {
    usedPorts.set(key, { edgeId, label });
  }
}
