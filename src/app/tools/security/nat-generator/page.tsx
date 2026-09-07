"use client";

import { Suspense, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Check, Copy } from "lucide-react";

function NatGeneratorContent() {
  const [natType, setNatType] = useState("dnat");
  
  // DNAT fields
  const [publicIp, setPublicIp] = useState("1.1.1.1");
  const [publicPort, setPublicPort] = useState("443");
  const [privateIp, setPrivateIp] = useState("192.168.1.50");
  const [privatePort, setPrivatePort] = useState("443");
  const [protocol, setProtocol] = useState("tcp");

  // SNAT fields
  const [srcNetwork, setSrcNetwork] = useState("192.168.1.0/24");
  const [outIface, setOutIface] = useState("wan1");
  const [snatType, setSnatType] = useState("masquerade");
  const [snatIp, setSnatIp] = useState("1.1.1.2");

  const [copied, setCopied] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const generateMikrotik = () => {
    if (natType === "dnat") {
      return `/ip firewall nat\nadd chain=dstnat action=dst-nat to-addresses=${privateIp} to-ports=${privatePort} protocol=${protocol} dst-address=${publicIp} dst-port=${publicPort} comment="Port Forward ${publicPort} -> ${privateIp}"`;
    } else {
      let cmd = `/ip firewall nat\nadd chain=srcnat action=${snatType === "masquerade" ? "masquerade" : "src-nat"} src-address=${srcNetwork} out-interface=${outIface}`;
      if (snatType === "src-nat") {
        cmd += ` to-addresses=${snatIp}`;
      }
      return cmd;
    }
  };

  const generateFortigate = () => {
    if (natType === "dnat") {
      return `config firewall vip\n    edit "VIP_${publicPort}_to_${privateIp}"\n        set extip ${publicIp}\n        set mappedip "${privateIp}"\n        set extintf "any"\n        set portforward enable\n        set protocol ${protocol}\n        set extport ${publicPort}\n        set mappedport ${privatePort}\n    next\nend\n\nconfig firewall policy\n    edit 0\n        set srcintf "any"\n        set dstintf "any"\n        set srcaddr "all"\n        set dstaddr "VIP_${publicPort}_to_${privateIp}"\n        set action accept\n        set schedule "always"\n        set service "ALL"\n    next\nend`;
    } else {
      let pool = "";
      if (snatType === "src-nat") {
        pool = `config firewall ippool\n    edit "SNAT_Pool"\n        set type overload\n        set startip ${snatIp}\n        set endip ${snatIp}\n    next\nend\n\n`;
      }
      return `${pool}config firewall policy\n    edit 0\n        set srcintf "any"\n        set dstintf "${outIface}"\n        set srcaddr "${srcNetwork === "any" ? "all" : srcNetwork}"\n        set dstaddr "all"\n        set action accept\n        set schedule "always"\n        set service "ALL"\n        set nat enable\n${snatType === "src-nat" ? `        set ippool enable\n        set poolname "SNAT_Pool"` : ""}\n    next\nend`;
    }
  };

  const generateIptables = () => {
    if (natType === "dnat") {
      return `iptables -t nat -A PREROUTING -d ${publicIp} -p ${protocol} --dport ${publicPort} -j DNAT --to-destination ${privateIp}:${privatePort}\niptables -A FORWARD -p ${protocol} -d ${privateIp} --dport ${privatePort} -j ACCEPT`;
    } else {
      if (snatType === "masquerade") {
        return `iptables -t nat -A POSTROUTING -s ${srcNetwork} -o ${outIface} -j MASQUERADE`;
      } else {
        return `iptables -t nat -A POSTROUTING -s ${srcNetwork} -o ${outIface} -j SNAT --to-source ${snatIp}`;
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={natType === "dnat"} onChange={() => setNatType("dnat")} className="accent-[#00ff9c] w-4 h-4" />
          <span className={`font-bold tracking-wider ${natType === "dnat" ? "text-[#00ff9c]" : "text-zinc-500"}`}>DNAT (Port Forwarding)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={natType === "snat"} onChange={() => setNatType("snat")} className="accent-[#00ff9c] w-4 h-4" />
          <span className={`font-bold tracking-wider ${natType === "snat" ? "text-[#00ff9c]" : "text-zinc-500"}`}>SNAT / Masquerade</span>
        </label>
      </div>

      <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-6">
        {natType === "dnat" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">External (WAN)</h3>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Public IP</label>
                <input type="text" value={publicIp} onChange={(e) => setPublicIp(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Public Port & Protocol</label>
                <div className="flex gap-2">
                  <input type="text" value={publicPort} onChange={(e) => setPublicPort(e.target.value)} className="flex-1 bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
                  <select value={protocol} onChange={(e) => setProtocol(e.target.value)} className="bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono uppercase focus:border-[#00ff9c] focus:outline-none w-24">
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
                <input type="text" value={privateIp} onChange={(e) => setPrivateIp(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Private Port</label>
                <input type="text" value={privatePort} onChange={(e) => setPrivatePort(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">Internal Source</h3>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Source Network/IP</label>
                <input type="text" value={srcNetwork} onChange={(e) => setSrcNetwork(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Outbound Interface</label>
                <input type="text" value={outIface} onChange={(e) => setOutIface(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">Translation Type</h3>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Action</label>
                <select value={snatType} onChange={(e) => setSnatType(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none">
                  <option value="masquerade">Masquerade (Dynamic IP)</option>
                  <option value="src-nat">Static SNAT (Fixed IP)</option>
                </select>
              </div>
              {snatType === "src-nat" && (
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400">Translated Public IP</label>
                  <input type="text" value={snatIp} onChange={(e) => setSnatIp(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { id: "mikrotik", title: "MikroTik RouterOS", code: generateMikrotik() },
          { id: "fortigate", title: "FortiGate (FortiOS)", code: generateFortigate() },
          { id: "iptables", title: "Linux iptables", code: generateIptables() }
        ].map((platform) => (
          <div key={platform.id} className="border border-[#1a1a1a] bg-[#050505]">
            <header className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{platform.title}</span>
              <button
                onClick={() => handleCopy(platform.code, platform.id)}
                className="text-zinc-500 hover:text-[#00ff9c] transition-colors flex items-center gap-1 text-xs uppercase tracking-wider"
              >
                {copied === platform.id ? <><Check className="w-3 h-3"/> Copied</> : <><Copy className="w-3 h-3"/> Copy</>}
              </button>
            </header>
            <pre className="p-4 text-[#00ff9c] font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {platform.code}
            </pre>
          </div>
        ))}
      </div>
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
