import test from "node:test";
import assert from "node:assert/strict";
import { calculateSubnet, calculateVlsm, isIpInNetwork, ipToInt } from "../src/lib/network.ts";
import { expandIPv6 } from "../src/lib/ipv6.ts";
import { parseAclRules } from "../src/lib/acl.ts";
import { parseDiagram, validateDiagram } from "../src/lib/diagram-validation.ts";

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
