import net from "net";

function isPublicIpv4(address: string): boolean {
  const [a, b, c] = address.split(".").map(Number);
  return !(
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 88 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function mappedIpv4(address: string): string | null {
  const normalized = address.toLowerCase();
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized)?.[1];
  if (dotted && net.isIPv4(dotted)) return dotted;

  const match = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(normalized);
  if (!match) return null;
  const high = Number.parseInt(match[1], 16);
  const low = Number.parseInt(match[2], 16);
  return [high >>> 8, high & 255, low >>> 8, low & 255].join(".");
}

/** Returns true only for globally routable internet addresses. */
export function isPublicInternetAddress(address: string): boolean {
  if (net.isIPv4(address)) return isPublicIpv4(address);
  if (!net.isIPv6(address)) return false;

  const normalized = address.toLowerCase();
  const mapped = mappedIpv4(normalized);
  if (mapped) return isPublicIpv4(mapped);

  // Accept only global-unicast IPv6 (2000::/3), excluding documentation space.
  // This denies loopback, unspecified, link-local, ULA, multicast and transition ranges.
  return /^[23][0-9a-f]{0,3}:/.test(normalized) && !/^2001:0{0,1}db8:/.test(normalized);
}
