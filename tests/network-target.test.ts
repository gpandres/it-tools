import assert from "node:assert/strict";
import test from "node:test";
import { isPublicInternetAddress } from "../src/lib/network-target.ts";

test("allows public IPv4 and IPv6 destinations", () => {
  assert.equal(isPublicInternetAddress("1.1.1.1"), true);
  assert.equal(isPublicInternetAddress("2606:4700:4700::1111"), true);
});

test("rejects private, reserved and IPv4-mapped IPv6 destinations", () => {
  for (const address of [
    "127.0.0.1", "10.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.0.1",
    "198.18.0.1", "203.0.113.1", "::1", "fc00::1", "fe80::1", "2001:db8::1", "2001:0db8::1",
    "::ffff:127.0.0.1", "::ffff:169.254.169.254", "::ffff:a9fe:a9fe",
  ]) assert.equal(isPublicInternetAddress(address), false, address);
});
