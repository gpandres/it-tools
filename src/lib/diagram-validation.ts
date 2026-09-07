export type DiagramData = { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] };

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
  const nodeIds = new Set(nodes.map((node) => node.id));
  return edges.every((edge) => nodeIds.has(edge.source as string) && nodeIds.has(edge.target as string)) ? { nodes, edges } : null;
}
