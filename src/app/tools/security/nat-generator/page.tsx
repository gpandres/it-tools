"use client";

import { Suspense, useState } from "react";
import { MultiVendorOutput, type VendorOutput } from "@/components/multi-vendor-output";
import { ToolLayout } from "@/components/tool-layout";
import { validateIp } from "@/lib/network";

function NatGeneratorContent() {
  const [natType, setNatType] = useState<"dnat" | "snat">("dnat");
  
  // DNAT fields
  const [publicIp, setPublicIp] = useState("1.1.1.1");
  const [publicPort, setPublicPort] = useState("443");
  const [privateIp, setPrivateIp] = useState("192.168.1.50");
  const [privatePort, setPrivatePort] = useState("443");
  const [protocol, setProtocol] = useState<"tcp" | "udp">("tcp");

  // SNAT fields
  const [srcNetwork, setSrcNetwork] = useState("192.168.1.0/24");
  const [outIface, setOutIface] = useState("wan1");
  const [snatType, setSnatType] = useState("masquerade");
  const [snatIp, setSnatIp] = useState("1.1.1.2");
  const [activeVendor, setActiveVendor] = useState("mikrotik");


  const isValidPort = (value: string) => {
    if (!/^\d+$/.test(value.trim())) return false;
    const port = Number(value);
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  };

  const isValidNetwork = (value: string) => {
    const input = value.trim();
    if (input.toLowerCase() === "any") return true;
    const parts = input.split("/");
    if (parts.length === 1) return validateIp(parts[0]);
    if (parts.length !== 2 || !validateIp(parts[0]) || !/^(?:0|[1-9]\d*)$/.test(parts[1])) return false;
    const cidr = Number(parts[1]);
    return Number.isInteger(cidr) && cidr >= 0 && cidr <= 32;
  };

  const safePublicIp = validateIp(publicIp.trim()) ? publicIp.trim() : "PUBLIC_IP";
  const safePrivateIp = validateIp(privateIp.trim()) ? privateIp.trim() : "PRIVATE_IP";
  const safeSnatIp = validateIp(snatIp.trim()) ? snatIp.trim() : "SNAT_IP";
  const safePublicPort = isValidPort(publicPort) ? publicPort.trim() : "PUBLIC_PORT";
  const safePrivatePort = isValidPort(privatePort) ? privatePort.trim() : "PRIVATE_PORT";
  const safeSourceNetwork = isValidNetwork(srcNetwork) ? srcNetwork.trim() : "SOURCE_NETWORK";
  const safeInterface = /^[A-Za-z0-9_.:-]+$/.test(outIface.trim()) && outIface.trim() ? outIface.trim() : "INTERFACE_NAME";
  const hasInvalidDnatInput = safePublicIp === "PUBLIC_IP" || safePrivateIp === "PRIVATE_IP" ||
    safePublicPort === "PUBLIC_PORT" || safePrivatePort === "PRIVATE_PORT";
  const hasInvalidSnatInput = safeSourceNetwork === "SOURCE_NETWORK" || safeInterface === "INTERFACE_NAME" ||
    (snatType === "src-nat" && safeSnatIp === "SNAT_IP");
  const hasInvalidInput = natType === "dnat" ? hasInvalidDnatInput : hasInvalidSnatInput;

  const generateMikrotik = () => {
    if (natType === "dnat") {
      return `/ip firewall nat\nadd chain=dstnat action=dst-nat to-addresses=${safePrivateIp} to-ports=${safePrivatePort} protocol=${protocol} dst-address=${safePublicIp} dst-port=${safePublicPort} comment="Port Forward ${safePublicPort} -> ${safePrivateIp}"`;
    } else {
      let cmd = `/ip firewall nat\nadd chain=srcnat action=${snatType === "masquerade" ? "masquerade" : "src-nat"} src-address=${safeSourceNetwork} out-interface=${safeInterface}`;
      if (snatType === "src-nat") {
        cmd += ` to-addresses=${safeSnatIp}`;
      }
      return cmd;
    }
  };

  const generateFortigate = () => {
    if (natType === "dnat") {
      return `config firewall vip\n    edit "VIP_${safePublicPort}_to_${safePrivateIp}"\n        set extip ${safePublicIp}\n        set mappedip "${safePrivateIp}"\n        set extintf "any"\n        set portforward enable\n        set protocol ${protocol}\n        set extport ${safePublicPort}\n        set mappedport ${safePrivatePort}\n    next\nend\n\nconfig firewall policy\n    edit 0\n        set srcintf "any"\n        set dstintf "any"\n        set srcaddr "all"\n        set dstaddr "VIP_${safePublicPort}_to_${safePrivateIp}"\n        set action accept\n        set schedule "always"\n        set service "ALL"\n    next\nend`;
    } else {
      let pool = "";
      if (snatType === "src-nat") {
        pool = `config firewall ippool\n    edit "SNAT_Pool"\n        set type overload\n        set startip ${safeSnatIp}\n        set endip ${safeSnatIp}\n    next\nend\n\n`;
      }
      return `${pool}config firewall policy\n    edit 0\n        set srcintf "any"\n        set dstintf "${safeInterface}"\n        set srcaddr "${safeSourceNetwork.toLowerCase() === "any" ? "all" : safeSourceNetwork}"\n        set dstaddr "all"\n        set action accept\n        set schedule "always"\n        set service "ALL"\n        set nat enable\n${snatType === "src-nat" ? `        set ippool enable\n        set poolname "SNAT_Pool"` : ""}\n    next\nend`;
    }
  };

  const generateIptables = () => {
    if (natType === "dnat") {
      return `iptables -t nat -A PREROUTING -d ${safePublicIp} -p ${protocol} --dport ${safePublicPort} -j DNAT --to-destination ${safePrivateIp}:${safePrivatePort}\niptables -A FORWARD -p ${protocol} -d ${safePrivateIp} --dport ${safePrivatePort} -j ACCEPT`;
    } else {
      if (snatType === "masquerade") {
        return `iptables -t nat -A POSTROUTING -s ${safeSourceNetwork} -o ${safeInterface} -j MASQUERADE`;
      } else {
        return `iptables -t nat -A POSTROUTING -s ${safeSourceNetwork} -o ${safeInterface} -j SNAT --to-source ${safeSnatIp}`;
      }
    }
  };

  const outputs: VendorOutput[] = [
    { id: "mikrotik", label: "MikroTik RouterOS", code: generateMikrotik() },
    { id: "fortigate", label: "FortiGate FortiOS", code: generateFortigate() },
    { id: "iptables", label: "Linux iptables", code: generateIptables() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex w-fit flex-wrap overflow-hidden rounded-none border border-[#1a1a1a] bg-black">
        {(["dnat", "snat"] as const).map(mode => (
          <button key={mode} type="button" aria-pressed={natType === mode} onClick={() => setNatType(mode)} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${natType === mode ? "bg-[#00ff9c] text-black" : "text-zinc-500 hover:text-zinc-300"} rounded-none`}>
            {mode === "dnat" ? "DNAT (Port Forwarding)" : "SNAT / Masquerade"}
          </button>
        ))}
      </div>

      {hasInvalidInput && (
        <div className="border border-amber-500/40 bg-amber-500/5 p-3 text-amber-300 text-xs font-mono">
          The preview uses placeholders until every IP, port, network and interface value is valid. Review the generated rule before applying it.
        </div>
      )}

      <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-6">
        {natType === "dnat" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">External (WAN)</h3>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Public IP</label>
                <input type="text" value={publicIp} onChange={(e) => setPublicIp(e.target.value)} className="w-full rounded-none bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Public Port & Protocol</label>
                <div className="flex gap-2">
                  <input type="text" value={publicPort} onChange={(e) => setPublicPort(e.target.value)} className="flex-1 rounded-none bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
                  <select value={protocol} onChange={(e) => setProtocol(e.target.value === "udp" ? "udp" : "tcp")} className="rounded-none bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono uppercase focus:border-[#00ff9c] focus:outline-none w-24">
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">Internal (LAN)</h3>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Private IP</label>
                <input type="text" value={privateIp} onChange={(e) => setPrivateIp(e.target.value)} className="w-full rounded-none bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Private Port</label>
                <input type="text" value={privatePort} onChange={(e) => setPrivatePort(e.target.value)} className="w-full rounded-none bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">Internal Source</h3>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Source Network/IP</label>
                <input type="text" value={srcNetwork} onChange={(e) => setSrcNetwork(e.target.value)} className="w-full rounded-none bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Outbound Interface</label>
                <input type="text" value={outIface} onChange={(e) => setOutIface(e.target.value)} className="w-full rounded-none bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">Translation Type</h3>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Action</label>
                <select value={snatType} onChange={(e) => setSnatType(e.target.value)} className="w-full rounded-none bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none">
                  <option value="masquerade">Masquerade (Dynamic IP)</option>
                  <option value="src-nat">Static SNAT (Fixed IP)</option>
                </select>
              </div>
              {snatType === "src-nat" && (
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400">Translated Public IP</label>
                  <input type="text" value={snatIp} onChange={(e) => setSnatIp(e.target.value)} className="w-full rounded-none bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MultiVendorOutput outputs={outputs} activeId={activeVendor} onActiveChange={setActiveVendor} />
    </div>
  );
}

export default function NatGeneratorTool() {
  return (
    <ToolLayout
      title="Multi-Vendor NAT Generator"
      description="Quickly generate Source NAT (Masquerade) or Destination NAT (Port Forwarding) rules for MikroTik, FortiGate, and iptables."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <NatGeneratorContent />
      </Suspense>
    </ToolLayout>
  );
}
