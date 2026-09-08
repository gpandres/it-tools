import test from "node:test";
import assert from "node:assert/strict";
import { calculateSubnet, calculateVlsm, isIpInNetwork, ipToInt } from "../src/lib/network.ts";
import { expandIPv6 } from "../src/lib/ipv6.ts";
import { parseAclRules } from "../src/lib/acl.ts";
import { parseDiagram, validateDiagram } from "../src/lib/diagram-validation.ts";
import { autoLayout } from "../src/lib/diagram-layout.ts";
import { analyzeNetworkTopology, findNetworkPath } from "../src/lib/diagram-analysis.ts";
import { serializeNetworkMarkdown, summarizeNetworkDiagram } from "../src/lib/network-diagram-documentation.ts";
import { parseNetworkDiagramLibrary } from "../src/lib/network-diagram-workspace.ts";
import { NETWORK_INVENTORY_HEADERS, serializeNetworkDiagram, serializeNetworkInventory } from "../src/lib/network-diagram-export.ts";
import type { NetworkEdge, NetworkNode } from "../src/app/tools/network/diagram/types.ts";

test("analyzes topology cut points, bridge links and shortest paths", () => {
  const nodes = ["a", "b", "c", "d"].map(id => ({ id, data: { type: "server" } }));
  const edges = [
    { id: "ab", source: "a", target: "b" },
    { id: "bc", source: "b", target: "c" },
    { id: "cd", source: "c", target: "d" },
  ];
  const analysis = analyzeNetworkTopology(nodes, edges);

  assert.equal(analysis.componentCount, 1);
  assert.deepEqual(analysis.articulationNodeIds, ["b", "c"]);
  assert.deepEqual(analysis.bridgeEdgeIds, ["ab", "bc", "cd"]);
  assert.deepEqual(findNetworkPath(nodes, edges, "a", "d"), {
    nodeIds: ["a", "b", "c", "d"],
    edgeIds: ["ab", "bc", "cd"],
  });
});

test("does not report cut points inside a redundant cycle and ignores groups", () => {
  const nodes = [
    { id: "group", data: { type: "group" } },
    { id: "a", data: { type: "server" }, parentId: "group" },
    { id: "b", data: { type: "server" } },
    { id: "c", data: { type: "server" } },
    { id: "isolated", data: { type: "server" } },
  ];
  const edges = [
    { id: "ab", source: "a", target: "b" },
    { id: "bc", source: "b", target: "c" },
    { id: "ca", source: "c", target: "a" },
  ];
  const analysis = analyzeNetworkTopology(nodes, edges);

  assert.equal(analysis.nodeCount, 4);
  assert.equal(analysis.componentCount, 2);
  assert.deepEqual(analysis.articulationNodeIds, []);
  assert.deepEqual(analysis.bridgeEdgeIds, []);
  assert.deepEqual(analysis.isolatedNodeIds, ["isolated"]);
  assert.equal(findNetworkPath(nodes, edges, "a", "isolated"), null);
});

test("generates safe network documentation with inventory and resilience findings", () => {
  const nodes = [
    { id: "router", position: { x: 0, y: 0 }, data: { type: "router", label: "Edge | Router", zone: "wan", status: "active", ip: "10.0.0.1" } },
    { id: "server", position: { x: 100, y: 0 }, data: { type: "server", label: "App Server", zone: "server", status: "degraded", ip: "10.0.1.10" } },
  ] as unknown as NetworkNode[];
  const edges = [{ id: "link", source: "router", target: "server", data: { connectionType: "fiber" } }] as unknown as NetworkEdge[];
  const analysis = analyzeNetworkTopology(nodes, edges);
  const markdown = serializeNetworkMarkdown(nodes, edges, analysis, [], { title: "Office topology", description: "Primary site" });
  const stats = summarizeNetworkDiagram(nodes, edges);

  assert.equal(stats.deviceCount, 2);
  assert.equal(stats.zoneCounts.wan, 1);
  assert.match(markdown, /^# Office topology/m);
  assert.match(markdown, /Edge \\| Router/);
  assert.match(markdown, /## Device inventory/);
  assert.match(markdown, /Critical nodes: Edge \\| Router/);
});

test("sanitizes the local diagram library and keeps the newest snapshots first", () => {
  const snapshot = {
    id: "newer",
    updatedAt: 20,
    metadata: { title: "DMZ", description: "Perimeter" },
    nodes: [{ id: "fw", position: { x: 0, y: 0 }, data: { label: "Firewall", type: "firewall", injected: "remove" } }],
    edges: [],
  };
  const library = parseNetworkDiagramLibrary([snapshot, { ...snapshot, id: "older", updatedAt: 10 }, { ...snapshot, id: "newer" }, "invalid"]);

  assert.deepEqual(library.map(diagram => diagram.id), ["newer", "older"]);
  assert.equal(library[0].title, "DMZ");
  assert.equal((library[0].nodes[0].data as unknown as Record<string, unknown>).injected, undefined);
});

test("rejects malformed IPv4 values instead of truncating them", () => {
  assert.throws(() => ipToInt("999.1.1.1"));
  assert.equal(isIpInNetwork("10.0.0.1", "10.0.0.0/8"), true);
  assert.equal(isIpInNetwork("not-an-ip", "10.0.0.0/8"), false);
  assert.equal(isIpInNetwork("10.0.0.1", "10.0.0.0/8-nope"), false);
});

test("calculates the IPv4 /0 network correctly", () => {
  const result = calculateSubnet("192.168.1.20", 0);
  assert.equal(result.network, "0.0.0.0");
  assert.equal(result.broadcast, "255.255.255.255");
  assert.equal(result.totalHosts, 2 ** 32 - 2);
});

test("rejects IPv6 groups longer than four hexadecimal characters", () => {
  assert.equal(expandIPv6("12345::1"), null);
  assert.equal(expandIPv6("2001:db8::1")?.endsWith("0001"), true);
});

test("rejects malformed ACL ports and reversed ranges", () => {
  const valid = {
    id: "r1", action: "permit", protocol: "tcp", srcIp: "any", dstIp: "10.0.0.1/32",
    srcPort: "1024-2048", dstPort: "443", log: false,
  };
  assert.ok(parseAclRules([valid]));
  assert.equal(parseAclRules([valid, { ...valid }]), null);
  assert.equal(parseAclRules([{ ...valid, dstPort: "2048-1024" }]), null);
  assert.equal(parseAclRules([{ ...valid, dstPort: "0" }]), null);
});

test("rejects zero-host VLSM requests instead of allocating a fake /31", () => {
  const result = calculateVlsm("192.168.1.0", 24, [{ name: "empty", hosts: 0 }]);
  assert.equal(result[0]?.error, "Hosts must be a positive integer");
  assert.equal(result[0]?.allocatedHosts, 0);
});

test("allocates a conventional subnet for a one-host VLSM request", () => {
  const result = calculateVlsm("192.168.1.0", 24, [{ name: "router", hosts: 1 }]);
  assert.equal(result[0]?.cidr, 30);
  assert.equal(result[0]?.allocatedHosts, 2);
});

test("rejects duplicate diagram node and edge identifiers", () => {
  const duplicatedNodes = {
    nodes: [{ id: "router", position: { x: 0, y: 0 } }, { id: "router", position: { x: 100, y: 0 } }],
    edges: [],
  };
  assert.equal(parseDiagram(duplicatedNodes), null);

  const duplicatedEdges = {
    nodes: [{ id: "router", position: { x: 0, y: 0 } }, { id: "switch", position: { x: 100, y: 0 } }],
    edges: [
      { id: "link-1", source: "router", target: "switch" },
      { id: "link-2", source: "router", target: "switch" },
    ],
  };
  assert.equal(parseDiagram(duplicatedEdges), null);
});

test("reports actionable diagram topology issues", () => {
  const issues = validateDiagram({
    nodes: [
      { id: "router", position: { x: 0, y: 0 }, data: { label: "Router", ip: "10.0.0.1/24", vlan: "10" } },
      { id: "server", position: { x: 100, y: 0 }, data: { label: "Server", ip: "10.0.0.1/24", vlan: "5000" } },
    ],
    edges: [],
  });
  assert.deepEqual(issues.map(issue => issue.title), [
    "Isolated node", "Isolated node", "Duplicate IP address", "Invalid VLAN",
  ]);
});

test("auto layout terminates for cyclic network topologies", () => {
  const nodes = [
    { id: "a", position: { x: 900, y: 900 } },
    { id: "b", position: { x: 900, y: 900 } },
    { id: "c", position: { x: 900, y: 900 } },
  ];
  const edges = [{ source: "a", target: "b" }, { source: "b", target: "c" }, { source: "c", target: "a" }];
  const result = autoLayout(nodes, edges);
  assert.equal(result.length, nodes.length);
  assert.ok(result.every(node => Number.isFinite(node.position.x) && Number.isFinite(node.position.y)));
  assert.ok(result.some(node => node.position.x !== 900 || node.position.y !== 900));
});

test("auto layout keeps grouped children in their parent coordinate space", () => {
  const nodes = [
    { id: "group", position: { x: 100, y: 100 }, width: 400, height: 300 },
    { id: "child", position: { x: 40, y: 40 }, parentId: "group" },
    { id: "router", position: { x: 900, y: 900 } },
  ];
  const result = autoLayout(nodes, [{ source: "child", target: "router" }]);
  assert.deepEqual(result.find(node => node.id === "child")?.position, { x: 40, y: 40 });
  assert.notDeepEqual(result.find(node => node.id === "group")?.position, { x: 100, y: 100 });
});

test("auto layout sizes each column from its widest node", () => {
  const result = autoLayout([
    { id: "wide", position: { x: 900, y: 900 }, width: 640, height: 160 },
    { id: "narrow", position: { x: 900, y: 900 }, width: 120, height: 100 },
    { id: "last", position: { x: 900, y: 900 }, width: 240, height: 100 },
  ], [
    { source: "wide", target: "narrow" },
    { source: "narrow", target: "last" },
  ]);
  const wide = result.find(node => node.id === "wide")!;
  const narrow = result.find(node => node.id === "narrow")!;
  const last = result.find(node => node.id === "last")!;
  assert.ok(narrow.position.x >= wide.position.x + 640 + 100);
  assert.ok(last.position.x >= narrow.position.x + 120 + 100);
});

test("auto layout remains deterministic with parallel links and disconnected nodes", () => {
  const nodes = [
    { id: "router", position: { x: 500, y: 500 }, width: 180, height: 120 },
    { id: "switch", position: { x: 500, y: 500 }, width: 160, height: 110 },
    { id: "isolated", position: { x: 500, y: 500 }, width: 140, height: 100 },
  ];
  const edges = [
    { source: "router", target: "switch" },
    { source: "router", target: "switch" },
  ];
  const first = autoLayout(nodes, edges);
  const second = autoLayout(nodes, edges);
  assert.deepEqual(first.map(node => node.position), second.map(node => node.position));
});

test("auto layout leaves a single group coordinate space untouched", () => {
  const nodes = [
    { id: "group", position: { x: 200, y: 200 }, width: 500, height: 300 },
    { id: "child", position: { x: 40, y: 40 }, parentId: "group" },
  ];
  const result = autoLayout(nodes, []);
  assert.deepEqual(result.map(node => node.position), nodes.map(node => node.position));
});

test("auto layout handles the maximum supported 500-node topology", () => {
  const nodes = Array.from({ length: 500 }, (_, index) => ({
    id: `node-${index}`,
    position: { x: 10_000, y: 10_000 },
    width: index % 7 === 0 ? 260 : 140,
    height: index % 11 === 0 ? 180 : 100,
  }));
  const edges = nodes.slice(1).map((node, index) => ({ source: `node-${Math.floor(index / 2)}`, target: node.id }));
  const started = performance.now();
  const result = autoLayout(nodes, edges);
  const elapsed = performance.now() - started;

  assert.equal(result.length, 500);
  assert.ok(result.every(node => Number.isFinite(node.position.x) && Number.isFinite(node.position.y)));
  // Keep a generous ceiling for slower CI runners while catching accidental
  // quadratic regressions in the layout implementation.
  assert.ok(elapsed < 5_000, `500-node layout took ${Math.round(elapsed)}ms`);
});

test("validates connection semantics and VLAN lists", () => {
  const issues = validateDiagram({
    nodes: [
      { id: "ap", position: { x: 0, y: 0 }, data: { type: "wireless", label: "AP" } },
      { id: "server", position: { x: 100, y: 0 }, data: { type: "server", label: "Server" } },
    ],
    edges: [{ id: "link", source: "ap", target: "server", sourceHandle: "top-target", targetHandle: "bottom-source", data: { connectionType: "unknown", vlanMode: "access", vlans: "10,20,5000,20" } }],
  });
  assert.deepEqual(issues.map(issue => issue.title), [
    "Invalid source handle", "Invalid target handle", "Invalid connection type", "Invalid allowed VLANs", "Access link has multiple VLANs", "Duplicate allowed VLAN",
  ]);
});

test("validates explicit subnet overlaps, reused ports and single-homed infrastructure", () => {
  const issues = validateDiagram({
    nodes: [
      { id: "router", position: { x: 0, y: 0 }, data: { type: "router", label: "Edge Router", ip: "10.0.0.1", subnet: "10.0.0.0/24" } },
      { id: "firewall", position: { x: 100, y: 0 }, data: { type: "firewall", label: "Firewall", ip: "10.0.0.2", subnet: "10.0.0.128/25" } },
      { id: "server-a", position: { x: 200, y: 0 }, data: { type: "server", label: "Server A", ip: "10.0.1.10" } },
      { id: "server-b", position: { x: 300, y: 0 }, data: { type: "server", label: "Server B", ip: "10.0.1.11" } },
    ],
    edges: [
      { id: "link-a", source: "router", target: "server-a", data: { connectionType: "ethernet", sourcePort: "Gi0/1" } },
      { id: "link-b", source: "router", target: "server-b", data: { connectionType: "ethernet", sourcePort: "Gi0/1" } },
      { id: "link-c", source: "firewall", target: "server-a", data: { connectionType: "ethernet" } },
    ],
  });

  assert.deepEqual(issues.map(issue => issue.title), [
    "Overlapping subnets", "Port reused", "Single-homed infrastructure",
  ]);
});

test("rejects malformed explicit subnet declarations", () => {
  const issues = validateDiagram({
    nodes: [{ id: "router", position: { x: 0, y: 0 }, data: { type: "router", label: "Router", subnet: "10.0.0.0/33" } }],
    edges: [],
  });

  assert.equal(issues.some(issue => issue.title === "Invalid subnet" && issue.severity === "error"), true);
});

test("diagram imports keep only safe editable fields and preserve dimensions", () => {
  const parsed = parseDiagram({
    nodes: [{
      id: "  router  ", position: { x: 10, y: 20 }, width: 320, height: 180,
      data: { label: "Router", ip: "10.0.0.1", injected: "discard me" },
      onClick: "discard me",
    }],
    edges: [{
      id: "link", source: "router", target: "router2", sourceHandle: "bottom-source", targetHandle: "top-target",
      data: { connectionType: "fiber", injected: "discard me" },
    }],
  });
  assert.equal(parsed, null);

  const valid = parseDiagram({
    nodes: [{ id: "group", type: "networkNode", position: { x: 0, y: 0 }, width: 320, height: 180, data: { label: "Group", type: "group" } }, { id: "router", position: { x: 10, y: 20 }, parentId: "group", extent: "parent", data: { label: "Router", injected: "discard me" } }],
    edges: [],
  });
  assert.deepEqual(valid?.nodes[1], {
    id: "router", type: "networkNode", position: { x: 10, y: 20 }, parentId: "group", extent: "parent", data: { label: "Router" },
  });
  assert.equal(parseDiagram({
    nodes: [{ id: "router", position: { x: 10, y: 20 }, parentId: "missing", extent: "parent", data: { label: "Router" } }],
    edges: [],
  }), null);
});

test("network JSON export is safe and round-trippable", () => {
  const nodes = [
    { id: "group", type: "networkNode", position: { x: 0, y: 0 }, width: 400, height: 240, data: { label: "DMZ", type: "group" }, selected: true },
    { id: "fw", type: "networkNode", position: { x: 24, y: 24 }, parentId: "group", extent: "parent", data: { label: "Firewall", type: "firewall", ip: "10.0.0.1", injected: "remove" } },
  ] as unknown as NetworkNode[];
  const json = serializeNetworkDiagram(nodes, [], { title: "DMZ topology", description: "Production perimeter" });
  assert.ok(json);
  const parsed = JSON.parse(json);
  assert.equal(parsed.nodes[0].selected, undefined);
  assert.equal(parsed.nodes[1].parentId, "group");
  assert.equal(parsed.nodes[1].data.injected, undefined);
  assert.equal(parsed.nodes[0].width, 400);
  assert.equal(parsed.nodes[0].height, 240);
  assert.deepEqual(parsed.metadata, { title: "DMZ topology", description: "Production perimeter" });
});

test("network inventory export preserves columns and escapes CSV content", () => {
  const csv = serializeNetworkInventory([
    { id: "router", type: "networkNode", position: { x: 0, y: 0 }, data: { label: 'Edge, "primary"', type: "router", hostname: "edge\n01", role: "=HYPERLINK(\"https://example.test\")" } },
  ], []);
  const lines = csv.split("\r\n");
  assert.equal(lines[0], NETWORK_INVENTORY_HEADERS.join(",").replaceAll(/(^|,)([^,]*)/g, '$1"$2"'));
  assert.match(csv, /"Edge, ""primary"""/);
  assert.match(csv, /"edge\n01"/);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.test""\)"/);
});
