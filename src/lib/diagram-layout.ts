type LayoutNode = { id: string; position: { x: number; y: number } };
type LayoutEdge = { source: string; target: string };

/** Places connected nodes into readable left-to-right layers without adding a layout dependency. */
export function autoLayout<T extends LayoutNode>(nodes: T[], edges: LayoutEdge[]): T[] {
  if (nodes.length < 2) return nodes.map(node => ({ ...node, position: { ...node.position } }));

  const nodeIds = new Set(nodes.map(node => node.id));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const node of nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) continue;
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  }

  const roots = nodes.filter(node => incoming.get(node.id) === 0).map(node => node.id);
  const queue = roots.length > 0 ? [...roots] : [nodes[0].id];
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

  nodes.forEach((node, index) => {
    if (!layers.has(node.id)) layers.set(node.id, Math.max(0, Math.floor(index / 4)));
  });
  const groups = new Map<number, string[]>();
  for (const node of nodes) {
    const layer = layers.get(node.id) ?? 0;
    groups.set(layer, [...(groups.get(layer) ?? []), node.id]);
  }
  const rowById = new Map<string, number>();
  for (const ids of groups.values()) ids.forEach((id, index) => rowById.set(id, index));

  return nodes.map(node => ({
    ...node,
    position: {
      x: 80 + (layers.get(node.id) ?? 0) * 280,
      y: 80 + (rowById.get(node.id) ?? 0) * 170,
    },
  }));
}
