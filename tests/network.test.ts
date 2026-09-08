import test from "node:test";
import assert from "node:assert/strict";
import { calculateSubnet, calculateVlsm, isIpInNetwork, ipToInt } from "../src/lib/network.ts";
import { expandIPv6 } from "../src/lib/ipv6.ts";
import { parseAclRules } from "../src/lib/acl.ts";
import { parseDiagram, validateDiagram } from "../src/lib/diagram-validation.ts";
import { autoLayout } from "../src/lib/diagram-layout.ts";

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
