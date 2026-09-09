import type { NetworkEdge, NetworkEdgeData } from '../app/tools/network/diagram/types';

/** One visual definition for both rendering and lane allocation. */
export function cableAppearance(data?: Partial<NetworkEdgeData>) {
  const type = data?.connectionType ?? 'ethernet';
  const color = data?.color || ({ ethernet: '#a1a1aa', fiber: '#00ff9c', wireless: '#00e5ff', vpn: '#b026ff' }[type]) || '#a1a1aa';
  const texture = data?.texture;
  const dash = texture === 'solid' ? '0' : texture === 'dashed' ? '8 5' : texture === 'dotted' ? '2 5' : texture === 'dash-dot' ? '10 4 2 4' : type === 'wireless' ? '5,5' : type === 'vpn' ? '5,10' : '0';
  return { color: color.toLowerCase(), dash, extraWidth: type === 'fiber' ? 1 : 0 };
}

function endpoint(node: string, handle?: string | null) {
  // Source and target handles on the same side occupy the same physical point.
  return JSON.stringify([node, (handle || 'top').replace(/-(source|target)$/, '')]);
}

export function distributeEdgeLanes(edges: NetworkEdge[]): NetworkEdge[] {
  const treatments = new Map<string, Set<string>>();
  const signature = (edge: NetworkEdge) => JSON.stringify(cableAppearance(edge.data));
  for (const edge of edges) {
    for (const key of [endpoint(edge.source, edge.sourceHandle), endpoint(edge.target, edge.targetHandle)]) {
      if (!treatments.has(key)) treatments.set(key, new Set());
      treatments.get(key)!.add(signature(edge));
    }
  }
  const lanes = new Map([...treatments].map(([key, values]) => [key, [...values].sort()]));
  const lane = (key: string, edge: NetworkEdge) => {
    const values = lanes.get(key)!;
    return values.indexOf(signature(edge)) - (values.length - 1) / 2;
  };
  return edges.map(edge => ({ ...edge, data: {
    ...edge.data,
    connectionType: edge.data?.connectionType ?? 'ethernet',
    lane: lane(endpoint(edge.source, edge.sourceHandle), edge),
    targetLane: lane(endpoint(edge.target, edge.targetHandle), edge),
  } }));
}
