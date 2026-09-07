export function expandIPv6(ip: string): string | null {
  try {
    // Remove CIDR if present
    const baseIp = ip.split('/')[0];
    
    // Basic validation
    if (!/^[a-fA-F0-9:]+$/.test(baseIp) || baseIp.split('::').length > 2) return null;
    
    let parts = baseIp.split(':');
    
    // Handle :: at start or end
    if (parts[0] === '') parts.shift();
    if (parts[parts.length - 1] === '') parts.pop();
    
    const doubleColonIndex = parts.indexOf('');
    if (doubleColonIndex !== -1) {
      const missing = 8 - (parts.length - 1);
      if (missing < 0) return null;
      parts.splice(doubleColonIndex, 1, ...Array(missing).fill('0000'));
    }
    
    if (parts.length !== 8) return null;
    
    return parts.map(p => p.padStart(4, '0').toLowerCase()).join(':');
  } catch {
    return null;
  }
}

export function compressIPv6(ip: string): string | null {
  const expanded = expandIPv6(ip);
  if (!expanded) return null;
  
  // Find longest sequence of zeros
  const parts = expanded.split(':').map(p => parseInt(p, 16).toString(16)); // strip leading zeros
  
  let bestStart = -1;
  let bestLen = 0;
  let currentStart = -1;
  let currentLen = 0;
  
  for (let i = 0; i < 8; i++) {
    if (parts[i] === '0') {
      if (currentStart === -1) currentStart = i;
      currentLen++;
    } else {
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = currentStart;
      }
      currentStart = -1;
      currentLen = 0;
    }
  }
  if (currentLen > bestLen) {
    bestLen = currentLen;
    bestStart = currentStart;
  }
  
  if (bestLen > 1) {
    parts.splice(bestStart, bestLen, '');
    let res = parts.join(':');
    if (res.startsWith(':')) res = ':' + res;
    if (res.endsWith(':')) res = res + ':';
    return res;
  }
  
  return parts.join(':');
}

export function getIPv6NetworkInfo(ip: string, cidr: number) {
  const expanded = expandIPv6(ip);
  if (!expanded || cidr < 0 || cidr > 128) return null;
  
  const parts = expanded.split(':');
  const binString = parts.map(p => parseInt(p, 16).toString(2).padStart(16, '0')).join('');
  
  const networkBin = binString.substring(0, cidr) + '0'.repeat(128 - cidr);
  
  const networkParts = [];
  for (let i = 0; i < 128; i += 16) {
    networkParts.push(parseInt(networkBin.substring(i, i + 16), 2).toString(16).padStart(4, '0'));
  }
  
  const networkIp = networkParts.join(':');
  const totalIps = cidr === 128 ? "1" : `2^${128 - cidr}`;
  
  return {
    expanded,
    compressed: compressIPv6(expanded) || expanded,
    networkAddress: compressIPv6(networkIp) || networkIp,
    totalIps,
    type: getIPv6Type(expanded)
  };
}

function getIPv6Type(expandedIp: string): string {
  if (expandedIp === '0000:0000:0000:0000:0000:0000:0000:0001') return 'Loopback';
  if (expandedIp === '0000:0000:0000:0000:0000:0000:0000:0000') return 'Unspecified';
  
  const first16 = parseInt(expandedIp.substring(0, 4), 16);
  if (first16 >= 0xff00) return 'Multicast';
  if (first16 >= 0xfe80 && first16 <= 0xfebf) return 'Link-Local Unicast';
  if (first16 >= 0xfc00 && first16 <= 0xfdff) return 'Unique Local Unicast (ULA)';
  if (first16 >= 0x2000 && first16 <= 0x3fff) return 'Global Unicast';
  
  return 'Unknown / Reserved';
}
