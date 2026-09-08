import type { Edge, Node } from '@xyflow/react';

export const NETWORK_NODE_TYPES = [
  'router', 'switch', 'firewall', 'server', 'database', 'nas', 'wireless', 'pc', 'cloud',
  'load-balancer', 'ids-ips', 'vpn', 'proxy', 'dns', 'dhcp', 'kubernetes', 'container',
  'vm', 'identity', 'endpoint', 'vpc',
] as const;

export type NetworkNodeType = (typeof NETWORK_NODE_TYPES)[number];
export type NetworkConnectionType = 'ethernet' | 'fiber' | 'wireless' | 'vpn';
export type NetworkZone = 'internet' | 'wan' | 'lan' | 'dmz' | 'management' | 'server' | 'cloud';
export type NetworkStatus = 'active' | 'degraded' | 'offline' | 'maintenance';

export type NetworkNodeData = {
  label: string;
  type: NetworkNodeType;
  ip?: string;
  vlan?: string;
  hostname?: string;
  vendor?: string;
  model?: string;
  role?: string;
  zone?: NetworkZone | string;
  status?: NetworkStatus;
  notes?: string;
  interfaces?: string;
};

export type NetworkEdgeData = {
  connectionType: NetworkConnectionType;
  label?: string;
  sourcePort?: string;
  targetPort?: string;
  bandwidth?: string;
  vlanMode?: 'access' | 'trunk' | 'routed' | 'unknown';
  vlans?: string;
};

export type NetworkNode = Node<NetworkNodeData, 'networkNode'>;
export type NetworkEdge = Edge<NetworkEdgeData, 'networkEdge'>;
export type DiagramSnapshot = { nodes: NetworkNode[]; edges: NetworkEdge[] };
