"use client";

import { Suspense, useState } from "react";
import { MultiVendorOutput, type VendorOutput } from "@/components/multi-vendor-output";
import { ToolLayout } from "@/components/tool-layout";

type VlanVendor = "cisco" | "mikrotik" | "fortigate" | "juniper" | "arista";

function VlanToolContent() {
  const [vlanIdStr, setVlanIdStr] = useState("10");
  const [iface, setIface] = useState("GigabitEthernet0/1");
  const [nativeVlan, setNativeVlan] = useState("1");
  const [activeTab, setActiveTab] = useState<VlanVendor>("cisco");
  const [portMode, setPortMode] = useState<"access" | "trunk">("access");

  const parsedVlanId = Number(vlanIdStr);
  const vlanId = Number.isInteger(parsedVlanId) ? parsedVlanId : 0;
  const parsedNativeVlan = Number(nativeVlan);
  const nativeVlanId = Number.isInteger(parsedNativeVlan) ? parsedNativeVlan : 0;
  const isValidVlan = vlanId >= 1 && vlanId <= 4094;
  const isValidNativeVlan = nativeVlanId >= 1 && nativeVlanId <= 4094;
  const isValidInterface = /^[A-Za-z0-9_.:/-]+$/.test(iface.trim());
  const safeInterface = isValidInterface && iface.trim() ? iface.trim() : "INTERFACE_NAME";
  const safeVlan = isValidVlan ? String(vlanId) : "VLAN_ID";
  const safeNativeVlan = isValidNativeVlan ? String(nativeVlanId) : "NATIVE_VLAN_ID";
  const vlanName = `VLAN_${safeVlan}`;

  const getVlanInfo = (id: number) => {
    if (id === 1) return { type: "Default / Native", desc: "Default VLAN on most switches; it is commonly untagged and should be changed deliberately." };
    if (id >= 2 && id <= 1001) return { type: "Standard", desc: "Normal VLAN range for general network use." };
    if (id >= 1002 && id <= 1005) return { type: "Reserved", desc: "Reserved legacy range for Token Ring and FDDI on Cisco platforms." };
    if (id >= 1006 && id <= 4094) return { type: "Extended", desc: "Extended VLAN range; platform and VTP configuration can affect support." };
    return { type: "Invalid", desc: "VLAN ID must be between 1 and 4094." };
  };

  const vlanInfo = isValidVlan ? getVlanInfo(vlanId) : null;

  const generateCisco = () => portMode === "access"
    ? `interface ${safeInterface}
 switchport mode access
 switchport access vlan ${safeVlan}
 spanning-tree portfast
 no shutdown
exit`
    : `interface ${safeInterface}
 switchport mode trunk
 switchport trunk allowed vlan ${safeVlan}
 switchport trunk native vlan ${safeNativeVlan}
 no shutdown
exit`;

  const generateMikrotik = () => portMode === "access"
    ? `/interface bridge port
add bridge=bridge interface=${safeInterface} pvid=${safeVlan}
/interface bridge vlan
add bridge=bridge tagged=bridge untagged=${safeInterface} vlan-ids=${safeVlan}`
    : `/interface bridge port
add bridge=bridge interface=${safeInterface}
/interface bridge vlan
add bridge=bridge tagged=bridge,${safeInterface} vlan-ids=${safeVlan}`;

  const generateFortigate = () => portMode === "access"
    ? `# FortiSwitch managed access port
config switch-controller managed-switch
    edit "SWITCH_SERIAL"
        config ports
            edit "${safeInterface}"
                set vlan "${safeVlan}"
            next
        end
    next
end`
    : `# FortiGate VLAN sub-interface (trunk parent)
config system interface
    edit "${safeInterface}.${safeVlan}"
        set vdom "root"
        set interface "${safeInterface}"
        set vlanid ${safeVlan}
    next
end`;

  const generateJuniper = () => portMode === "access"
    ? `set vlans ${vlanName} vlan-id ${safeVlan}
set interfaces ${safeInterface} unit 0 family ethernet-switching interface-mode access
set interfaces ${safeInterface} unit 0 family ethernet-switching vlan members ${vlanName}`
    : `set vlans ${vlanName} vlan-id ${safeVlan}
set interfaces ${safeInterface} native-vlan-id ${safeNativeVlan}
set interfaces ${safeInterface} unit 0 family ethernet-switching interface-mode trunk
set interfaces ${safeInterface} unit 0 family ethernet-switching vlan members ${vlanName}`;

  const generateArista = () => portMode === "access"
    ? `vlan ${safeVlan}
interface ${safeInterface}
 switchport mode access
 switchport access vlan ${safeVlan}
 no shutdown
exit`
    : `vlan ${safeVlan}
interface ${safeInterface}
 switchport mode trunk
 switchport trunk allowed vlan ${safeVlan}
 switchport trunk native vlan ${safeNativeVlan}
 no shutdown
exit`;

  const outputs: VendorOutput[] = [
    { id: "cisco", label: "Cisco IOS", code: generateCisco() },
    { id: "mikrotik", label: "MikroTik", code: generateMikrotik() },
    { id: "fortigate", label: "FortiGate", code: generateFortigate() },
    { id: "juniper", label: "Juniper Junos", code: generateJuniper() },
    { id: "arista", label: "Arista EOS", code: generateArista() },
  ];

  return (
    <ToolLayout title="VLAN Calculator & Config" description="Calculate VLAN ranges and generate 802.1Q access/trunk configurations for Cisco, MikroTik, FortiGate, Juniper, and Arista.">
      <div className="space-y-6">
        <div className="space-y-4 rounded border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">VLAN ID (1-4094)</span>
              <input type="number" value={vlanIdStr} onChange={e => setVlanIdStr(e.target.value)} min="1" max="4094" className="w-full border border-[#1a1a1a] bg-black p-3 font-mono text-sm text-[#00ff9c] outline-none transition-colors focus:border-[#00ff9c]" />
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Interface Name</span>
              <input type="text" value={iface} onChange={e => setIface(e.target.value)} placeholder="GigabitEthernet0/1 or ge-0/0/1" className="w-full border border-[#1a1a1a] bg-black p-3 font-mono text-sm text-[#00ff9c] outline-none transition-colors focus:border-[#00ff9c]" />
            </label>
            {portMode === "trunk" && (
              <label className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Native VLAN</span>
                <input type="number" value={nativeVlan} onChange={e => setNativeVlan(e.target.value)} min="1" max="4094" className="w-full border border-[#1a1a1a] bg-black p-3 font-mono text-sm text-[#00ff9c] outline-none transition-colors focus:border-[#00ff9c]" />
              </label>
            )}
          </div>
        </div>

        {(!isValidVlan || (portMode === "trunk" && !isValidNativeVlan) || !isValidInterface) && (
          <div className="border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs text-amber-300">
            The preview uses placeholders until the VLAN IDs and interface name are valid. VLAN IDs must be integers from 1 to 4094.
          </div>
        )}

        {vlanInfo && (
          <div className="flex flex-col justify-between gap-4 rounded border border-[#1a1a1a] bg-[#050505] p-4 md:flex-row md:items-center">
            <div><div className="text-xs font-bold uppercase tracking-wider text-zinc-500">VLAN Range Type</div><div className="font-mono text-[#00ff9c]">{vlanInfo.type}</div></div>
            <div className="text-sm text-zinc-400 md:text-right">{vlanInfo.desc}</div>
          </div>
        )}

        <div className="flex w-fit flex-wrap overflow-hidden rounded border border-[#1a1a1a] bg-black">
          {(["access", "trunk"] as const).map(mode => (
            <button key={mode} type="button" aria-pressed={portMode === mode} onClick={() => setPortMode(mode)} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${portMode === mode ? "bg-[#00ff9c] text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
              {mode === "access" ? "Access Port (Untagged)" : "Trunk Port (Tagged)"}
            </button>
          ))}
        </div>

        <MultiVendorOutput outputs={outputs} activeId={activeTab} onActiveChange={id => setActiveTab(id as VlanVendor)} />
      </div>
    </ToolLayout>
  );
}

export default function VlanTool() {
  return <Suspense fallback={<div className="p-8 text-center font-mono text-zinc-500 glow-amber">Loading...</div>}><VlanToolContent /></Suspense>;
}
