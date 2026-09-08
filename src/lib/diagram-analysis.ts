export type TopologyNode = {
  id: string;
  parentId?: string;
  data?: { type?: string };
};

export type TopologyEdge = {
  id: string;
  source: string;
  target: string;
};

export type NetworkPath = {
  nodeIds: string[];
  edgeIds: string[];
};

export type TopologyAnalysis = {
  nodeCount: number;
  edgeCount: number;
  componentCount: number;
  components: string[][];
  isolatedNodeIds: string[];
  articulationNodeIds: string[];
  bridgeEdgeIds: string[];
};

type AdjacencyEntry = { neighborId: string; edgeId: string };

export function analyzeNetworkTopology(nodes: TopologyNode[], edges: TopologyEdge[]): TopologyAnalysis {
  const activeNodes = nodes.filter(node => node.data?.type !== 'group');
  const nodeIds = new Set(activeNodes.map(node => node.id));
  const adjacency = new Map<string, AdjacencyEntry[]>();
  const validEdges = edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target);

  activeNodes.forEach(node => adjacency.set(node.id, []));
  validEdges.forEach(edge => {
    adjacency.get(edge.source)?.push({ neighborId: edge.target, edgeId: edge.id });
    adjacency.get(edge.target)?.push({ neighborId: edge.source, edgeId: edge.id });
  });

  const discovery = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const articulationNodeIds = new Set<string>();
  const bridgeEdgeIds = new Set<string>();
  const components: string[][] = [];
  let clock = 0;

  const visit = (nodeId: string, parentEdgeId: string | null, component: string[]) => {
    discovery.set(nodeId, clock);
    lowLink.set(nodeId, clock);
    clock += 1;
    component.push(nodeId);
    let childCount = 0;

    for (const { neighborId, edgeId } of adjacency.get(nodeId) ?? []) {
      if (edgeId === parentEdgeId) continue;
      if (!discovery.has(neighborId)) {
        childCount += 1;
        visit(neighborId, edgeId, component);
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId) ?? 0, lowLink.get(neighborId) ?? 0));
        if (parentEdgeId !== null && (lowLink.get(neighborId) ?? 0) >= (discovery.get(nodeId) ?? 0)) {
          articulationNodeIds.add(nodeId);
        }
        if ((lowLink.get(neighborId) ?? 0) > (discovery.get(nodeId) ?? 0)) {
          bridgeEdgeIds.add(edgeId);
        }
      } else {
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId) ?? 0, discovery.get(neighborId) ?? 0));
      }
    }

    if (parentEdgeId === null && childCount > 1) articulationNodeIds.add(nodeId);
  };

  for (const node of activeNodes) {
    if (discovery.has(node.id)) continue;
    const component: string[] = [];
    visit(node.id, null, component);
    components.push(component);
  }

  return {
    nodeCount: activeNodes.length,
    edgeCount: validEdges.length,
    componentCount: components.length,
    components,
    isolatedNodeIds: components.filter(component => component.length === 1 && (adjacency.get(component[0])?.length ?? 0) === 0).flat(),
    articulationNodeIds: activeNodes.filter(node => articulationNodeIds.has(node.id)).map(node => node.id),
    bridgeEdgeIds: validEdges.filter(edge => bridgeEdgeIds.has(edge.id)).map(edge => edge.id),
  };
}

export function findNetworkPath(nodes: TopologyNode[], edges: TopologyEdge[], sourceId: string, targetId: string): NetworkPath | null {
  if (!sourceId || !targetId || sourceId === targetId) return sourceId === targetId && sourceId ? { nodeIds: [sourceId], edgeIds: [] } : null;
  const nodeIds = new Set(nodes.filter(node => node.data?.type !== 'group').map(node => node.id));
  if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return null;

  const adjacency = new Map<string, AdjacencyEntry[]>();
  nodeIds.forEach(nodeId => adjacency.set(nodeId, []));
  edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target).forEach(edge => {
    adjacency.get(edge.source)?.push({ neighborId: edge.target, edgeId: edge.id });
    adjacency.get(edge.target)?.push({ neighborId: edge.source, edgeId: edge.id });
  });

  const previous = new Map<string, { nodeId: string; edgeId: string }>();
  const queue = [sourceId];
  const visited = new Set([sourceId]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current === targetId) break;
    for (const { neighborId, edgeId } of adjacency.get(current) ?? []) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      previous.set(neighborId, { nodeId: current, edgeId });
      queue.push(neighborId);
    }
  }
  if (!visited.has(targetId)) return null;

  const nodePath: string[] = [];
  const edgePath: string[] = [];
  let current = targetId;
  while (current !== sourceId) {
    nodePath.push(current);
    const step = previous.get(current);
    if (!step) return null;
    edgePath.push(step.edgeId);
    current = step.nodeId;
  }
  nodePath.push(sourceId);
  return { nodeIds: nodePath.reverse(), edgeIds: edgePath.reverse() };
}
