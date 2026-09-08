import test from "node:test";
import assert from "node:assert/strict";
import { calculateSubnet, isIpInNetwork, ipToInt } from "../src/lib/network.ts";
import { expandIPv6 } from "../src/lib/ipv6.ts";
import { parseAclRules } from "../src/lib/acl.ts";

test("rejects malformed IPv4 values instead of truncating them", () => {
  assert.throws(() => ipToInt("999.1.1.1"));
  assert.equal(isIpInNetwork("10.0.0.1", "10.0.0.0/8"), true);
  assert.equal(isIpInNetwork("not-an-ip", "10.0.0.0/8"), false);
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
  assert.equal(parseAclRules([{ ...valid, dstPort: "2048-1024" }]), null);
  assert.equal(parseAclRules([{ ...valid, dstPort: "0" }]), null);
});
