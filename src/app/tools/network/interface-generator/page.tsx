"use client";

import { useState } from "react";
import { MultiVendorOutput, type VendorOutput } from "@/components/multi-vendor-output";
import { ToolLayout } from "@/components/tool-layout";
import { validateIp } from "@/lib/network";
import {
  ToolPanel,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolPanelBody,
  ToolField,
} from "@/components/tool-design";
import { Input } from "@/components/ui/input";

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
      title="INTERFACE CONFIG GENERATOR"
      description="Generate Layer 3 interface configurations for Cisco, MikroTik, FortiGate, Juniper, and Arista."
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN" className="text-sm text-[#ffb000] glow-amber">INPUT CONFIG</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ToolField
              htmlFor="iface"
              label="Interface name"
              helper="Letters, numbers, periods, colons, slashes, underscores, and hyphens are supported."
              error={!isValidInterface || !iface.trim() ? "Enter a valid interface name." : undefined}
            >
              <Input
                id="iface"
                value={iface}
                onChange={e => setIface(e.target.value)}
                placeholder="GigabitEthernet0/1 or ge-0/0/1"
                aria-invalid={!isValidInterface || !iface.trim()}
                className="rounded-none border-[#1a1a1a] bg-black font-mono"
              />
            </ToolField>

            <ToolField htmlFor="ip" label="IP address" helper="IPv4 address in dotted-decimal notation." error={!isValidIp ? "Enter a valid IPv4 address." : undefined}>
              <Input
                id="ip"
                value={ip}
                onChange={e => setIp(e.target.value)}
                placeholder="192.168.1.1"
                aria-invalid={!isValidIp}
                className="rounded-none border-[#1a1a1a] bg-black font-mono"
              />
            </ToolField>

            <ToolField htmlFor="cidr" label="CIDR prefix" helper="Whole-number prefix from 0 to 32." error={!isValidCidr ? "CIDR prefix must be a whole number from 0 to 32." : undefined}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-500" aria-hidden="true">/</span>
                <Input
                  id="cidr"
                  type="number"
                  min="0"
                  max="32"
                  value={cidr}
                  onChange={e => setCidr(e.target.value)}
                  aria-invalid={!isValidCidr}
                  className="rounded-none border-[#1a1a1a] bg-black pl-7 font-mono"
                />
              </div>
            </ToolField>

            <ToolField htmlFor="description" label="Description" helper="Used as the interface description or comment." error={!description.trim() ? "Enter an interface description." : undefined}>
              <Input
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="LAN Connection"
                aria-invalid={!description.trim()}
                className="rounded-none border-[#1a1a1a] bg-black font-mono"
              />
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>
        <MultiVendorOutput outputs={outputs} activeId={activeTab} onActiveChange={id => setActiveTab(id as InterfaceVendor)} />
      </div>
    </ToolLayout>
  );
}

export default function InterfaceConfigGenerator() {
  return <InterfaceConfigGeneratorContent />;
}
