type LayoutNode = { id: string; position: { x: number; y: number }; parentId?: string; width?: number; height?: number };
type LayoutEdge = { source: string; target: string };

/** Places top-level nodes into readable left-to-right layers without moving grouped children. */
export function autoLayout<T extends LayoutNode>(nodes: T[], edges: LayoutEdge[]): T[] {
  if (nodes.length < 2) return nodes.map(node => ({ ...node, position: { ...node.position } }));

  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const topLevelNodes = nodes.filter(node => !node.parentId);
  const nodeIds = new Set(topLevelNodes.map(node => node.id));
  const ownerId = (nodeId: string) => {
    let current = nodeById.get(nodeId);
    const visited = new Set<string>();
    while (current?.parentId && nodeById.has(current.parentId) && !visited.has(current.id)) {
      visited.add(current.id);
      current = nodeById.get(current.parentId);
    }
    return current?.id ?? nodeId;
  };
  const layoutEdges = edges.map(edge => ({ source: ownerId(edge.source), target: ownerId(edge.target) })).filter(edge => edge.source !== edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const node of topLevelNodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of layoutEdges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  }

  const roots = topLevelNodes.filter(node => incoming.get(node.id) === 0).map(node => node.id);
  const queue = roots.length > 0 ? [...roots] : [topLevelNodes[0].id];
  const layers = new Map<string, number>(queue.map(id => [id, 0]));
  for (let index = 0; index < queue.length; index += 1) {
    const source = queue[index];
    const sourceLayer = layers.get(source) ?? 0;
    for (const target of outgoing.get(source) ?? []) {
      // Assign each node once. Re-evaluating layers on every edge would never
      // settle for cyclic network topologies (rings and redundant paths).
      if (layers.has(target)) continue;
      layers.set(target, sourceLayer + 1);
      queue.push(target);
    }
  }

  topLevelNodes.forEach((node, index) => {
    if (!layers.has(node.id)) layers.set(node.id, Math.max(0, Math.floor(index / 4)));
  });
  const groups = new Map<number, string[]>();
  for (const node of topLevelNodes) {
    const layer = layers.get(node.id) ?? 0;
    groups.set(layer, [...(groups.get(layer) ?? []), node.id]);
  }

  // Reorder branches using their previous-layer neighbours to reduce crossings.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const [layer, ids] of groups) {
      if (layer === 0) continue;
      const previousRows = new Map((groups.get(layer - 1) ?? []).map((id, index) => [id, index]));
      ids.sort((left, right) => {
        const score = (id: string) => {
          const neighbours = layoutEdges.filter(edge => edge.target === id && previousRows.has(edge.source)).map(edge => previousRows.get(edge.source) as number);
          return neighbours.length ? neighbours.reduce((sum, row) => sum + row, 0) / neighbours.length : Number.MAX_SAFE_INTEGER;
        };
        return score(left) - score(right);
      });
    }
  }
  const rowById = new Map<string, number>();
  for (const ids of groups.values()) ids.forEach((id, index) => rowById.set(id, index));
  const maxWidth = Math.max(120, ...topLevelNodes.map(node => node.width ?? 120));
  const maxHeight = Math.max(100, ...topLevelNodes.map(node => node.height ?? 100));
  const columnGap = Math.max(260, maxWidth + 100);
  const rowGap = Math.max(160, maxHeight + 60);
  const positioned = new Map(topLevelNodes.map(node => [node.id, {
    x: 80 + (layers.get(node.id) ?? 0) * columnGap,
    y: 80 + (rowById.get(node.id) ?? 0) * rowGap,
  }]));

  return nodes.map(node => ({
    ...node,
    position: positioned.get(node.id) ?? { ...node.position },
  }));
}
