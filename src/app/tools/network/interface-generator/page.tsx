"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { useToolState } from "@/hooks/use-tool-state";

// Helper to convert CIDR (0-32) to subnet mask string
function cidrToMask(cidr: number): string {
  if (cidr < 0 || cidr > 32) return "Invalid";
  const mask = ~((1 << (32 - cidr)) - 1);
  return [
    (mask >>> 24) & 255,
    (mask >>> 16) & 255,
    (mask >>> 8) & 255,
    mask & 255,
  ].join(".");
}

export default function InterfaceConfigGenerator() {
  const [ip, setIp] = useToolState("ip", "192.168.1.1");
  const [cidr, setCidr] = useToolState("cidr", "24");
  const [iface, setIface] = useToolState("iface", "GigabitEthernet0/1");
  const [description, setDescription] = useToolState("desc", "LAN Connection");
  
  const [activeTab, setActiveTab] = useState<"cisco" | "mikrotik" | "fortigate">("cisco");

  const parsedCidr = parseInt(cidr, 10);
  const isValidCidr = !isNaN(parsedCidr) && parsedCidr >= 0 && parsedCidr <= 32;
  const mask = isValidCidr ? cidrToMask(parsedCidr) : "";

  const generateCisco = () => {
    return `interface ${iface}
 description ${description}
 ip address ${ip} ${mask}
 no shutdown
exit`;
  };

  const generateMikrotik = () => {
    return `/ip address
add address=${ip}/${cidr} interface=${iface} comment="${description}"`;
  };

  const generateFortigate = () => {
    return `config system interface
    edit "${iface}"
        set ip ${ip} ${mask}
        set description "${description}"
        set allowaccess ping
    next
end`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ToolLayout
      title="Interface Config Generator"
      description="Generate network interface configurations for Cisco, MikroTik, and FortiGate."
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="p-4 border border-[#1a1a1a] bg-[#0a0a0a] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Interface Name</label>
              <input
                type="text"
                value={iface}
                onChange={(e) => setIface(e.target.value)}
                className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                placeholder="GigabitEthernet0/1"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">IP Address</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                placeholder="192.168.1.1"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">CIDR</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">/</span>
                <input
                  type="number"
                  value={cidr}
                  onChange={(e) => setCidr(e.target.value)}
                  min="0"
                  max="32"
                  className="w-full bg-black border border-[#1a1a1a] p-3 pl-7 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                placeholder="LAN Connection"
              />
            </div>
          </div>
        </div>

        {/* Vendors Tabs */}
        <div className="flex border-b border-[#1a1a1a] gap-1 overflow-x-auto no-scrollbar">
          {(["cisco", "mikrotik", "fortigate"] as const).map((vendor) => (
            <button
              key={vendor}
              onClick={() => setActiveTab(vendor)}
              className={`
                px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors
                ${activeTab === vendor 
                  ? "text-[#00ff9c] border-b-2 border-[#00ff9c]" 
                  : "text-zinc-500 hover:text-zinc-300"}
              `}
            >
              {vendor}
            </button>
          ))}
        </div>

        {/* Output Section */}
        <div className="relative group">
          <pre className="p-6 bg-[#050505] border border-[#1a1a1a] text-[#00ff9c] font-mono text-sm overflow-x-auto whitespace-pre">
            {activeTab === "cisco" && generateCisco()}
            {activeTab === "mikrotik" && generateMikrotik()}
            {activeTab === "fortigate" && generateFortigate()}
          </pre>
          
          <button
            onClick={() => {
              const text = 
                activeTab === "cisco" ? generateCisco() :
                activeTab === "mikrotik" ? generateMikrotik() :
                generateFortigate();
              handleCopy(text);
            }}
            className="absolute top-4 right-4 bg-[#1a1a1a] text-zinc-400 hover:text-[#00ff9c] px-3 py-1 text-xs uppercase tracking-wider transition-colors opacity-0 group-hover:opacity-100"
          >
            Copy
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
