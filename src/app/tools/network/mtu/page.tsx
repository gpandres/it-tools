"use client";

import { ToolLayout } from "@/components/tool-layout";
import { useToolState } from "@/hooks/use-tool-state";

export default function MtuTool() {
  const [baseMtuStr, setBaseMtuStr] = useToolState("mtu", "1500");
  const [ipVer, setIpVer] = useToolState("ip", "ipv4");
  
  // Encap checkboxes
  const [hasVlan, setHasVlan] = useToolState("vlan", "false");
  const [hasPppoe, setHasPppoe] = useToolState("pppoe", "false");
  const [hasGre, setHasGre] = useToolState("gre", "false");
  const [hasIpsec, setHasIpsec] = useToolState("ipsec", "false"); // Approx 50-70 bytes, we'll use 56 bytes avg for ESP/Tunnel

  const baseMtu = parseInt(baseMtuStr, 10);
  const isValidMtu = !isNaN(baseMtu) && baseMtu > 0;

  let encapOverhead = 0;
  if (hasVlan === "true") encapOverhead += 4;
  if (hasPppoe === "true") encapOverhead += 8;
  if (hasGre === "true") encapOverhead += 24; // 20 IP + 4 GRE
  if (hasIpsec === "true") encapOverhead += 56; // Typical ESP + New IP header

  const effectiveMtu = isValidMtu ? baseMtu - encapOverhead : 0;
  
  const ipHeader = ipVer === "ipv6" ? 40 : 20;
  const tcpHeader = 20;
  const mss = effectiveMtu > (ipHeader + tcpHeader) ? effectiveMtu - ipHeader - tcpHeader : 0;

  return (
    <ToolLayout
      title="MTU & MSS Calculator"
      description="Calculate Effective MTU and TCP MSS based on network encapsulation."
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="p-4 border border-[#1a1a1a] bg-[#0a0a0a] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Col: Basics */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Base Link MTU (Bytes)</label>
                <input
                  type="number"
                  value={baseMtuStr}
                  onChange={(e) => setBaseMtuStr(e.target.value)}
                  className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-2">Standard Ethernet is 1500. Jumbo frames up to 9000.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">IP Version</label>
                <div className="flex border border-[#1a1a1a] rounded-sm overflow-hidden bg-black w-full">
                  <button
                    onClick={() => setIpVer("ipv4")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                      ipVer === "ipv4" ? "bg-[#00ff9c] text-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    IPv4 (20 Bytes)
                  </button>
                  <button
                    onClick={() => setIpVer("ipv6")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                      ipVer === "ipv6" ? "bg-[#00ff9c] text-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    IPv6 (40 Bytes)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Toggles */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">L2 / VPN Encapsulation</label>
              <div className="space-y-3 p-4 bg-black border border-[#1a1a1a]">
                <Toggle
                  label="802.1Q VLAN Tag (+4 Bytes)"
                  checked={hasVlan === "true"}
                  onChange={(c) => setHasVlan(c ? "true" : "false")}
                />
                <Toggle
                  label="PPPoE (+8 Bytes)"
                  checked={hasPppoe === "true"}
                  onChange={(c) => setHasPppoe(c ? "true" : "false")}
                />
                <Toggle
                  label="GRE Tunnel (+24 Bytes)"
                  checked={hasGre === "true"}
                  onChange={(c) => setHasGre(c ? "true" : "false")}
                />
                <Toggle
                  label="IPsec ESP Tunnel (~56 Bytes)"
                  checked={hasIpsec === "true"}
                  onChange={(c) => setHasIpsec(c ? "true" : "false")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border border-[#1a1a1a] bg-[#050505] flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Effective MTU</div>
            <div className="text-4xl font-mono text-white mb-1">{effectiveMtu}</div>
            <div className="text-xs text-zinc-500">Bytes usable for IP packet</div>
          </div>
          <div className="p-6 border border-[#00ff9c]/30 bg-[#00ff9c]/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00ff9c]"></div>
            <div className="text-xs font-bold text-[#00ff9c] uppercase tracking-wider mb-2">TCP MSS (Max Segment Size)</div>
            <div className="text-4xl font-mono text-[#00ff9c] mb-1 glow">{mss}</div>
            <div className="text-xs text-zinc-400">Bytes usable for TCP payload</div>
          </div>
        </div>

        {/* Visualization / Explanation */}
        <div className="p-4 border border-[#1a1a1a] bg-black">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-[#1a1a1a] pb-2">Packet Structure Breakdown</h3>
          
          <div className="flex h-12 w-full rounded-sm overflow-hidden text-xs font-bold text-black border border-[#1a1a1a]">
            {encapOverhead > 0 && (
              <div 
                className="bg-zinc-600 flex items-center justify-center border-r border-black" 
                style={{ width: `${(encapOverhead / baseMtu) * 100}%`, minWidth: '40px' }}
                title={`Encap: ${encapOverhead} Bytes`}
              >
                ENC
              </div>
            )}
            <div 
              className="bg-blue-500 flex items-center justify-center border-r border-black"
              style={{ width: `${(ipHeader / baseMtu) * 100}%`, minWidth: '40px' }}
              title={`IP Header: ${ipHeader} Bytes`}
            >
              IP
            </div>
            <div 
              className="bg-purple-500 flex items-center justify-center border-r border-black"
              style={{ width: `${(tcpHeader / baseMtu) * 100}%`, minWidth: '40px' }}
              title="TCP Header: 20 Bytes"
            >
              TCP
            </div>
            <div 
              className="bg-[#00ff9c] flex items-center justify-center"
              style={{ width: `${(mss / baseMtu) * 100}%` }}
              title={`TCP Payload (MSS): ${mss} Bytes`}
            >
              PAYLOAD (MSS: {mss})
            </div>
          </div>
          
          <div className="mt-4 font-mono text-xs text-zinc-400 space-y-1">
            <div>Link MTU: {baseMtu}</div>
            <div>- Encapsulation Overhead: {encapOverhead}</div>
            <div>= Effective MTU: {effectiveMtu}</div>
            <div>- IP Header ({ipVer}): {ipHeader}</div>
            <div>- TCP Header: {tcpHeader}</div>
            <div className="text-[#00ff9c]">= MSS: {mss}</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`w-5 h-5 flex items-center justify-center border transition-colors ${checked ? 'bg-[#00ff9c] border-[#00ff9c]' : 'border-zinc-600 group-hover:border-[#00ff9c]'}`}>
        {checked && <div className="w-2.5 h-2.5 bg-black" />}
      </div>
      <span className="text-sm text-zinc-300 font-mono select-none">{label}</span>
    </label>
  );
}
