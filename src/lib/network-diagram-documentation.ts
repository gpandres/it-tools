import type { DiagramIssue, DiagramMetadata } from './diagram-validation.ts';
import type { TopologyAnalysis } from './diagram-analysis.ts';
import type { NetworkEdge, NetworkNode } from '@/app/tools/network/diagram/types';

export type DiagramDocumentationStats = {
  deviceCount: number;
  groupCount: number;
  linkCount: number;
  typeCounts: Record<string, number>;
  zoneCounts: Record<string, number>;
  statusCounts: Record<string, number>;
};

export function summarizeNetworkDiagram(nodes: NetworkNode[], edges: NetworkEdge[]): DiagramDocumentationStats {
  const typeCounts: Record<string, number> = {};
  const zoneCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const devices = nodes.filter(node => node.data.type !== 'group');

  devices.forEach(node => {
    increment(typeCounts, node.data.type);
    increment(zoneCounts, node.data.zone || 'unassigned');
    increment(statusCounts, node.data.status || 'active');
  });

  return {
    deviceCount: devices.length,
    groupCount: nodes.length - devices.length,
    linkCount: edges.length,
    typeCounts,
    zoneCounts,
    statusCounts,
  };
}

export function serializeNetworkMarkdown(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  analysis: TopologyAnalysis,
  issues: DiagramIssue[],
  metadata: DiagramMetadata = {},
): string {
  const stats = summarizeNetworkDiagram(nodes, edges);
  const title = metadata.title || 'Network topology';
  const description = metadata.description || 'Network topology documentation generated locally in the browser.';
  const labels = new Map(nodes.map(node => [node.id, node.data.label || node.id]));
  const devices = nodes.filter(node => node.data.type !== 'group');
  const lines = [
    `# ${markdownCell(title)}`,
    '',
    markdownCell(description),
    '',
    '## Overview',
    '',
    `- Devices: ${stats.deviceCount}`,
    `- Groups: ${stats.groupCount}`,
    `- Links: ${stats.linkCount}`,
    `- Connected components: ${analysis.componentCount}`,
    `- Isolated devices: ${analysis.isolatedNodeIds.length}`,
    `- Critical nodes: ${analysis.articulationNodeIds.length}`,
    `- Bridge links: ${analysis.bridgeEdgeIds.length}`,
    `- Validation findings: ${issues.length}`,
    '',
    '## Legend',
    '',
    '- Status: `active`, `degraded`, `offline`, `maintenance`.',
    '- Zones: `internet`, `wan`, `lan`, `dmz`, `management`, `server`, `cloud`.',
    '- Critical nodes are articulation points: removing one can split the topology.',
    '- Bridge links are single points of failure between connected areas.',
    '',
    '## Device inventory',
    '',
    '| Name | Type | IP | Subnet | VLAN | Zone | Status | Role | Vendor / model |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...devices.map(node => `| ${markdownCell(node.data.label || node.id)} | ${markdownCell(node.data.type)} | ${markdownCell(node.data.ip)} | ${markdownCell(node.data.subnet)} | ${markdownCell(node.data.vlan)} | ${markdownCell(node.data.zone || 'unassigned')} | ${markdownCell(node.data.status || 'active')} | ${markdownCell(node.data.role)} | ${markdownCell([node.data.vendor, node.data.model].filter(Boolean).join(' / '))} |`),
    '',
    '## Link inventory',
    '',
    '| Source | Target | Type | Source port | Target port | Bandwidth | VLAN mode | Allowed VLANs |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...edges.map(edge => `| ${markdownCell(labels.get(edge.source) || edge.source)} | ${markdownCell(labels.get(edge.target) || edge.target)} | ${markdownCell(edge.data?.connectionType)} | ${markdownCell(edge.data?.sourcePort)} | ${markdownCell(edge.data?.targetPort)} | ${markdownCell(edge.data?.bandwidth)} | ${markdownCell(edge.data?.vlanMode)} | ${markdownCell(edge.data?.vlans)} |`),
    '',
    '## Resilience findings',
    '',
    analysis.articulationNodeIds.length === 0 ? '- No articulation points detected.' : `- Critical nodes: ${analysis.articulationNodeIds.map(id => markdownCell(labels.get(id) || id)).join(', ')}.`,
    analysis.bridgeEdgeIds.length === 0 ? '- No bridge links detected.' : `- Bridge link IDs: ${analysis.bridgeEdgeIds.map(markdownCell).join(', ')}.`,
    analysis.isolatedNodeIds.length === 0 ? '- No isolated devices detected.' : `- Isolated devices: ${analysis.isolatedNodeIds.map(id => markdownCell(labels.get(id) || id)).join(', ')}.`,
    '',
    '## Validation findings',
    '',
    ...(issues.length === 0 ? ['- No validation findings.'] : issues.map(issue => `- **${markdownCell(issue.severity)}:** ${markdownCell(issue.title)} — ${markdownCell(issue.detail)}`)),
    '',
    '## Distribution',
    '',
    `- Types: ${formatDistribution(stats.typeCounts)}`,
    `- Zones: ${formatDistribution(stats.zoneCounts)}`,
    `- Status: ${formatDistribution(stats.statusCounts)}`,
  ];
  return `${lines.join('\n')}\n`;
}

function increment(distribution: Record<string, number>, value: string) {
  distribution[value] = (distribution[value] || 0) + 1;
}

function formatDistribution(distribution: Record<string, number>) {
  return Object.entries(distribution).map(([key, count]) => `${key} (${count})`).join(', ') || 'none';
}

function markdownCell(value: unknown) {
  return String(value || '—').replaceAll('|', '\\|').replaceAll(/\r?\n/g, '<br>');
}
