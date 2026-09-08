"use client";

import { Suspense, useState } from "react";
import { MultiVendorOutput, type VendorOutput } from "@/components/multi-vendor-output";
import { ToolLayout } from "@/components/tool-layout";
import { validateIp } from "@/lib/network";

function cidrToMask(cidr: number): string {
  if (cidr < 0 || cidr > 32) return "Invalid";
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr));
  return [
    (mask >>> 24) & 255,
    (mask >>> 16) & 255,
    (mask >>> 8) & 255,
    mask & 255,
  ].join(".");
}

type InterfaceVendor = "cisco" | "mikrotik" | "fortigate" | "juniper" | "arista";

function InterfaceConfigGeneratorContent() {
  const [ip, setIp] = useState("192.168.1.1");
  const [cidr, setCidr] = useState("24");
  const [iface, setIface] = useState("GigabitEthernet0/1");
  const [description, setDescription] = useState("LAN Connection");
  const [activeTab, setActiveTab] = useState<InterfaceVendor>("cisco");

  const parsedCidr = Number(cidr);
  const isValidCidr = Number.isInteger(parsedCidr) && parsedCidr >= 0 && parsedCidr <= 32;
  const isValidIp = validateIp(ip.trim());
  const isValidInterface = /^[A-Za-z0-9_.:/-]+$/.test(iface.trim());
  const mask = isValidCidr ? cidrToMask(parsedCidr) : "SUBNET_MASK";
  const safeIp = isValidIp ? ip.trim() : "IP_ADDRESS";
  const safeCidr = isValidCidr ? String(parsedCidr) : "CIDR";
  const safeInterface = isValidInterface && iface.trim() ? iface.trim() : "INTERFACE_NAME";
  const safeDescription = description.replace(/[\r\n"]/g, " ").trim() || "INTERFACE_DESCRIPTION";

  const generateCisco = () => `interface ${safeInterface}
 description ${safeDescription}
 ip address ${safeIp} ${mask}
 no shutdown
exit`;

  const generateMikrotik = () => `/ip address
add address=${safeIp}/${safeCidr} interface=${safeInterface} comment="${safeDescription}"`;

  const generateFortigate = () => `config system interface
    edit "${safeInterface}"
        set ip ${safeIp} ${mask}
        set description "${safeDescription}"
        set allowaccess ping
    next
end`;

  const generateJuniper = () => `set interfaces ${safeInterface} description "${safeDescription}"
set interfaces ${safeInterface} unit 0 family inet address ${safeIp}/${safeCidr}`;

  const generateArista = () => `interface ${safeInterface}
 description ${safeDescription}
 no switchport
 ip address ${safeIp}/${safeCidr}
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
    <ToolLayout
      title="Interface Config Generator"
      description="Generate Layer 3 interface configurations for Cisco, MikroTik, FortiGate, Juniper, and Arista."
    >
      <div className="space-y-6">
        <div className="space-y-4 rounded border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Interface Name</span>
              <input type="text" value={iface} onChange={e => setIface(e.target.value)} placeholder="GigabitEthernet0/1 or ge-0/0/1" className="w-full border border-[#1a1a1a] bg-black p-3 font-mono text-sm text-[#00ff9c] outline-none transition-colors focus:border-[#00ff9c]" />
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">IP Address</span>
              <input type="text" value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.1" className="w-full border border-[#1a1a1a] bg-black p-3 font-mono text-sm text-[#00ff9c] outline-none transition-colors focus:border-[#00ff9c]" />
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">CIDR Prefix</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-500">/</span>
                <input type="number" value={cidr} onChange={e => setCidr(e.target.value)} min="0" max="32" className="w-full border border-[#1a1a1a] bg-black p-3 pl-7 font-mono text-sm text-[#00ff9c] outline-none transition-colors focus:border-[#00ff9c]" />
              </div>
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Description</span>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="LAN Connection" className="w-full border border-[#1a1a1a] bg-black p-3 font-mono text-sm text-[#00ff9c] outline-none transition-colors focus:border-[#00ff9c]" />
            </label>
          </div>
        </div>

        {(!isValidIp || !isValidCidr || !isValidInterface || !description.trim()) && (
          <div className="border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs text-amber-300">
            The preview uses placeholders until the IPv4 address, CIDR prefix, interface name, and description are valid.
          </div>
        )}

        <MultiVendorOutput outputs={outputs} activeId={activeTab} onActiveChange={id => setActiveTab(id as InterfaceVendor)} />
      </div>
    </ToolLayout>
  );
}

export default function InterfaceConfigGenerator() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-zinc-500 glow-amber">Loading...</div>}>
      <InterfaceConfigGeneratorContent />
    </Suspense>
  );
}
