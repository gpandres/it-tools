type LayoutNode = { id: string; position: { x: number; y: number }; parentId?: string; width?: number; height?: number };
type LayoutEdge = { source: string; target: string };

/** Places top-level nodes into readable left-to-right layers without moving grouped children. */
export function autoLayout<T extends LayoutNode>(nodes: T[], edges: LayoutEdge[]): T[] {
  if (nodes.length < 2) return nodes.map(node => ({ ...node, position: { ...node.position } }));

  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const topLevelNodes = nodes.filter(node => !node.parentId);
  if (topLevelNodes.length < 2) return nodes.map(node => ({ ...node, position: { ...node.position } }));
  const nodeIds = new Set(topLevelNodes.map(node => node.id));
  const ownerCache = new Map<string, string>();
  const ownerId = (nodeId: string) => {
    const cached = ownerCache.get(nodeId);
    if (cached) return cached;

    const path: string[] = [];
    const visited = new Set<string>();
    let currentId = nodeId;
    while (!visited.has(currentId)) {
      const cachedOwner = ownerCache.get(currentId);
      if (cachedOwner) {
        path.forEach(id => ownerCache.set(id, cachedOwner));
        return cachedOwner;
      }
      visited.add(currentId);
      path.push(currentId);
      const current = nodeById.get(currentId);
      if (!current?.parentId || !nodeById.has(current.parentId)) break;
      currentId = current.parentId;
    }

    // Imported diagrams are validated before layout, but keep this fallback
    // finite if a caller supplies a malformed parent cycle directly.
    const owner = nodeIds.has(currentId) ? currentId : nodeId;
    path.forEach(id => ownerCache.set(id, owner));
    return owner;
  };

  const layoutEdges: LayoutEdge[] = [];
  const layoutEdgeKeys = new Set<string>();
  for (const edge of edges) {
    const source = ownerId(edge.source);
    const target = ownerId(edge.target);
    if (source === target || !nodeIds.has(source) || !nodeIds.has(target)) continue;
    const key = `${source}\u0000${target}`;
    if (layoutEdgeKeys.has(key)) continue;
    layoutEdgeKeys.add(key);
    layoutEdges.push({ source, target });
  }

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  const incomingNeighbours = new Map<string, string[]>();
  const originalOrder = new Map(topLevelNodes.map((node, index) => [node.id, index]));
  for (const node of topLevelNodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
    incomingNeighbours.set(node.id, []);
  }
  for (const edge of layoutEdges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
    incomingNeighbours.get(edge.target)?.push(edge.source);
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

  // Reorder branches using indexed previous-layer neighbours to reduce
  // crossings without repeatedly scanning every edge during each comparison.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const [layer, ids] of groups) {
      if (layer === 0) continue;
      const previousRows = new Map((groups.get(layer - 1) ?? []).map((id, index) => [id, index]));
      ids.sort((left, right) => {
        const score = (id: string) => {
          const neighbours = (incomingNeighbours.get(id) ?? []).filter(source => previousRows.has(source)).map(source => previousRows.get(source) as number);
          return neighbours.length ? neighbours.reduce((sum, row) => sum + row, 0) / neighbours.length : Number.MAX_SAFE_INTEGER;
        };
        return score(left) - score(right) || (originalOrder.get(left) ?? 0) - (originalOrder.get(right) ?? 0);
      });
    }
  }
  const rowById = new Map<string, number>();
  for (const ids of groups.values()) ids.forEach((id, index) => rowById.set(id, index));

  // Give each layer only the width it needs. Row heights are shared by all
  // layers so cards in adjacent columns cannot overlap vertically.
  const layerWidths = new Map<number, number>();
  const rowHeights: number[] = [];
  for (const [layer, ids] of groups) {
    layerWidths.set(layer, Math.max(120, ...ids.map(id => nodeById.get(id)?.width ?? 120)));
    ids.forEach((id, row) => {
      rowHeights[row] = Math.max(rowHeights[row] ?? 100, nodeById.get(id)?.height ?? 100);
    });
  }
  const layerX = new Map<number, number>();
  let nextX = 80;
  for (const layer of [...groups.keys()].sort((left, right) => left - right)) {
    layerX.set(layer, nextX);
    nextX += (layerWidths.get(layer) ?? 120) + 100;
  }
  const rowY: number[] = [];
  let nextY = 80;
  rowHeights.forEach((height, row) => {
    rowY[row] = nextY;
    nextY += height + 60;
  });
  const positioned = new Map(topLevelNodes.map(node => [node.id, {
    x: layerX.get(layers.get(node.id) ?? 0) ?? 80,
    y: rowY[rowById.get(node.id) ?? 0] ?? 80,
  }]));

  return nodes.map(node => ({
    ...node,
    position: positioned.get(node.id) ?? { ...node.position },
  }));
}
