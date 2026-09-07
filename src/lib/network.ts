export function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join(".");
}

export function cidrToMaskInt(cidr: number): number {
  return cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
}

export function calculateSubnet(ipStr: string, cidr: number) {
  try {
    const ipInt = ipToInt(ipStr);
    const maskInt = cidrToMaskInt(cidr);
    const networkInt = (ipInt & maskInt) >>> 0;
    const wildcardInt = (~maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;
    
    let firstHostInt = networkInt;
    let lastHostInt = broadcastInt;
    let totalHosts = 0;

    if (cidr <= 30) {
      firstHostInt = networkInt + 1;
      lastHostInt = broadcastInt - 1;
      totalHosts = Math.pow(2, 32 - cidr) - 2;
    } else if (cidr === 31) {
      firstHostInt = networkInt;
      lastHostInt = broadcastInt;
      totalHosts = 2; // PtP links
    } else if (cidr === 32) {
      firstHostInt = networkInt;
      lastHostInt = broadcastInt;
      totalHosts = 1; // Single host
    }

    return {
      ip: ipStr,
      mask: intToIp(maskInt),
      network: intToIp(networkInt),
      broadcast: intToIp(broadcastInt),
      wildcard: intToIp(wildcardInt),
      firstHost: intToIp(firstHostInt),
      lastHost: intToIp(lastHostInt),
      totalHosts,
      cidr,
      error: undefined
    };
  } catch (e) {
    return { 
      ip: "", mask: "", network: "", broadcast: "", wildcard: "", firstHost: "", lastHost: "", totalHosts: 0, cidr: 0,
      error: "Invalid IP address or CIDR" 
    };
  }
}

export function validateIp(ip: string): boolean {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
}
// Force Turbopack refresh

export function isIpInNetwork(testIp: string, networkCidr: string): boolean {
  if (networkCidr.toLowerCase() === "any") return true;
  if (!networkCidr.includes("/")) {
    return testIp === networkCidr;
  }
  const [netIp, cidrStr] = networkCidr.split("/");
  const cidr = parseInt(cidrStr, 10);
  if (isNaN(cidr) || cidr < 0 || cidr > 32) return false;
  
  try {
    const testInt = ipToInt(testIp);
    const netInt = ipToInt(netIp);
    const mask = cidrToMaskInt(cidr);
    return (testInt & mask) === (netInt & mask);
  } catch (e) {
    return false;
  }
}

export interface VlsmSubnetReq {
  name: string;
  hosts: number;
}

export interface VlsmResult {
  name: string;
  neededHosts: number;
  allocatedHosts: number;
  network: string;
  cidr: number;
  mask: string;
  firstHost: string;
  lastHost: string;
  broadcast: string;
  error?: string;
}

export function calculateVlsm(majorNetworkIp: string, majorCidr: number, subnets: VlsmSubnetReq[]): VlsmResult[] {
  try {
    const majorNetwork = calculateSubnet(majorNetworkIp, majorCidr);
    if (majorNetwork.error) return [];

    let currentIpInt = ipToInt(majorNetwork.network!);
    const maxIpInt = ipToInt(majorNetwork.broadcast!);
    
    // Sort subnets by required hosts descending
    const sortedReqs = [...subnets].sort((a, b) => b.hosts - a.hosts);
    const results: VlsmResult[] = [];

    for (const req of sortedReqs) {
      // Need 2 extra IPs for network and broadcast
      const neededTotal = req.hosts + 2;
      // Find smallest power of 2 >= neededTotal
      let allocatedPower = 0;
      while (Math.pow(2, allocatedPower) < neededTotal) {
        allocatedPower++;
      }
      
      const newCidr = 32 - allocatedPower;
      const allocatedHosts = Math.pow(2, allocatedPower) - 2;

      // Check if it fits
      const requiredSpace = Math.pow(2, allocatedPower);
      if (currentIpInt + requiredSpace - 1 > maxIpInt || newCidr < majorCidr) {
        results.push({
          name: req.name,
          neededHosts: req.hosts,
          allocatedHosts: 0,
          network: "N/A",
          cidr: 0,
          mask: "N/A",
          firstHost: "N/A",
          lastHost: "N/A",
          broadcast: "N/A",
          error: "Not enough space in major network"
        });
        continue;
      }

      // Ensure network boundary alignment
      const maskInt = cidrToMaskInt(newCidr);
      const networkInt = (currentIpInt & maskInt) >>> 0;
      if (networkInt !== currentIpInt) {
         // Jump to next valid boundary
         currentIpInt = networkInt + requiredSpace;
         if (currentIpInt + requiredSpace - 1 > maxIpInt) {
             results.push({ ...req, neededHosts: req.hosts, allocatedHosts: 0, network: "N/A", cidr: 0, mask: "N/A", firstHost: "N/A", lastHost: "N/A", broadcast: "N/A", error: "Boundary alignment failed" });
             continue;
         }
      }

      const subnetInfo = calculateSubnet(intToIp(currentIpInt), newCidr);

      results.push({
        name: req.name,
        neededHosts: req.hosts,
        allocatedHosts,
        network: subnetInfo.network!,
        cidr: newCidr,
        mask: subnetInfo.mask!,
        firstHost: subnetInfo.firstHost!,
        lastHost: subnetInfo.lastHost!,
        broadcast: subnetInfo.broadcast!
      });

      // Move pointer
      currentIpInt += requiredSpace;
    }

    return results;
  } catch (e) {
    return [];
  }
}
