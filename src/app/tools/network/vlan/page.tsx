"use client";

import { Suspense, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";

function VlanToolContent() {
  const [vlanIdStr, setVlanIdStr] = useState("10");
  const [iface, setIface] = useState("GigabitEthernet0/1");
  const [nativeVlan, setNativeVlan] = useState("1");
  
  const [activeTab, setActiveTab] = useState<"cisco" | "mikrotik" | "fortigate">("cisco");
  const [portMode, setPortMode] = useState<"access" | "trunk">("access");

  const vlanId = parseInt(vlanIdStr, 10);
  const isValidVlan = !isNaN(vlanId) && vlanId >= 1 && vlanId <= 4094;

  const getVlanInfo = (id: number) => {
    if (id === 1) return { type: "Default / Native", desc: "Default VLAN on most switches (Often untagged). Cannot be deleted." };
    if (id >= 2 && id <= 1001) return { type: "Standard", desc: "Normal VLAN range for general network use." };
    if (id >= 1002 && id <= 1005) return { type: "Reserved", desc: "Reserved for Token Ring and FDDI. Cannot be deleted." };
    if (id >= 1006 && id <= 4094) return { type: "Extended", desc: "Extended VLAN range. Requires VTP transparent mode on older Cisco switches." };
    return { type: "Invalid", desc: "VLAN ID must be between 1 and 4094." };
  };

  const vlanInfo = isValidVlan ? getVlanInfo(vlanId) : null;

  const generateCisco = () => {
    if (portMode === "access") {
      return `interface ${iface}
 switchport mode access
 switchport access vlan ${vlanId}
 spanning-tree portfast
 no shutdown
exit`;
    } else {
      return `interface ${iface}
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk allowed vlan ${vlanId}
 switchport trunk native vlan ${nativeVlan}
 no shutdown
exit`;
    }
  };

  const generateMikrotik = () => {
    if (portMode === "access") {
      return `/interface bridge port
add bridge=bridge interface=${iface} pvid=${vlanId}
/interface bridge vlan
add bridge=bridge tagged=bridge untagged=${iface} vlan-ids=${vlanId}`;
    } else {
      return `/interface bridge port
add bridge=bridge interface=${iface}
/interface bridge vlan
add bridge=bridge tagged=bridge,${iface} vlan-ids=${vlanId}`;
    }
  };

  const generateFortigate = () => {
    if (portMode === "access") {
      return `config system interface
    edit "${iface}"
        set vlanforward enable
    next
end
# FortiSwitch specific access port:
config switch-controller managed-switch
    edit "S123456789"
        config ports
            edit "${iface}"
                set vlan "${vlanId}"
            next
        end
    next
end`;
    } else {
      return `config system interface
    edit "${iface}.${vlanId}"
        set vdom "root"
        set interface "${iface}"
        set vlanid ${vlanId}
    next
end`;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ToolLayout
      title="VLAN Calculator & Config"
      description="Calculate VLAN ranges and generate 802.1Q access/trunk port configurations."
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="p-4 border border-[#1a1a1a] bg-[#0a0a0a] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">VLAN ID (1-4094)</label>
              <input
                type="number"
                value={vlanIdStr}
                onChange={(e) => setVlanIdStr(e.target.value)}
                min="1"
                max="4094"
                className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
              />
            </div>
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
            {portMode === "trunk" && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Native VLAN</label>
                <input
                  type="number"
                  value={nativeVlan}
                  onChange={(e) => setNativeVlan(e.target.value)}
                  min="1"
                  max="4094"
                  className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* VLAN Info Banner */}
        {vlanInfo && (
          <div className="p-4 border border-[#1a1a1a] bg-[#050505] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">VLAN Range Type</div>
              <div className="text-[#00ff9c] font-mono">{vlanInfo.type}</div>
            </div>
            <div className="text-sm text-zinc-400 md:text-right">
              {vlanInfo.desc}
            </div>
          </div>
        )}

        {/* Port Mode Toggle */}
        <div className="flex border border-[#1a1a1a] rounded-sm overflow-hidden bg-black w-fit">
          <button
            onClick={() => setPortMode("access")}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              portMode === "access" ? "bg-[#00ff9c] text-black" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Access Port (Untagged)
          </button>
          <button
            onClick={() => setPortMode("trunk")}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              portMode === "trunk" ? "bg-[#00ff9c] text-black" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Trunk Port (Tagged)
          </button>
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

export default function VlanTool() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
      <VlanToolContent />
    </Suspense>
  );
}
