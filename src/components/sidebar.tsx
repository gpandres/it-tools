"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const categories = [
  {
    name: "NETWORKING",
    tools: [
      { name: "Subnetting Calculator", path: "/tools/network/subnet" },
      { name: "VLSM Calculator", path: "/tools/network/vlsm" },
      { name: "CIDR Converter", path: "/tools/network/cidr" },
      { name: "IP to Bin/Hex", path: "/tools/network/ip-converter" },
      { name: "MAC Validator", path: "/tools/network/mac" },
    ],
  },
  {
    name: "ENCODING / DECODING",
    tools: [
      { name: "Base64 Encoder", path: "/tools/encoding/base64" },
      { name: "URL Encoder", path: "/tools/encoding/url" },
      { name: "Number Base Converter", path: "/tools/encoding/number-base" },
      { name: "JSON / YAML Converter", path: "/tools/encoding/json-yaml" },
      { name: "JWT Master Tool", path: "/tools/encoding/jwt" },
    ],
  },
  {
    name: "TEXT",
    tools: [
      { name: "Regex Tester", path: "/tools/text/regex" },
      { name: "Text Diff", path: "/tools/text/diff" },
      { name: "JSON Formatter", path: "/tools/text/json" },
      { name: "Word Counter", path: "/tools/text/counter" },
      { name: "Lorem Ipsum", path: "/tools/text/lorem" },
    ],
  },
  {
    name: "CYBERSECURITY / BLUE TEAM",
    tools: [
      { name: "Headers & TLS Scorecard", path: "/tools/security/scorecard" },
      { name: "Local Log Parser", path: "/tools/security/log-parser" },
      { name: "PCAP Analyzer", path: "/tools/security/pcap" },
      { name: "URL Defanger", path: "/tools/security/defanger" },
    ],
  },
  {
    name: "DEVOPS",
    tools: [
      { name: "Chmod Calculator", path: "/tools/devops/chmod" },
      { name: "Docker Converter", path: "/tools/devops/docker" },
    ],
  },
  {
    name: "CRYPTOGRAPHY",
    tools: [
      { name: "Hash Generators", path: "/tools/crypto/hash" },
      { name: "File Hash Analyzer", path: "/tools/crypto/file-hash" },
      { name: "Password Gen & Audit", path: "/tools/crypto/password" },
      { name: "UUID/ULID", path: "/tools/crypto/uuid" },
    ],
  },
  {
    name: "OTHER TOOLS",
    tools: [
      { name: "Cron Parser", path: "/tools/other/cron" },
      { name: "QR Code", path: "/tools/other/qr" },
      { name: "Color Converter", path: "/tools/other/color" },
    ],
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-black">
        <span className="font-bold text-[#ffb000] glow-amber text-sm tracking-widest">IT_TOOLS<span className="cursor-blink">_</span></span>
        <button className="text-zinc-500" onClick={() => setIsOpen(!isOpen)}>
          [{isOpen ? "x" : "="}]
        </button>
      </div>

      <aside className={`
        fixed md:sticky top-0 h-screen w-64 flex-shrink-0
        bg-[#050505] border-r border-[#1a1a1a]
        overflow-y-auto z-40 transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6 hidden md:block border-b border-[#1a1a1a] bg-[#0a0a0a]">
          <Link href="/" className="font-bold text-xl text-[#ffb000] glow-amber block mb-2 tracking-widest">
            IT_TOOLS<span className="cursor-blink text-[#00ff9c]">_</span>
          </Link>
          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-[#00ff9c] animate-pulse"></span>
            ALL CLIENT-SIDE
          </div>
        </div>

        <nav className="p-4 space-y-8">
          {categories.map((category) => (
            <div key={category.name}>
              <h3 className="mb-3 text-[10px] font-bold text-[#00ff9c] uppercase tracking-widest flex items-center gap-2">
                <span className="text-zinc-600">/</span> {category.name}
              </h3>
              <div className="space-y-2">
                {category.tools.map((tool) => {
                  const isActive = pathname === tool.path;
                  return (
                    <Link
                      key={tool.name}
                      href={tool.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        block text-xs transition-colors
                        hover:text-[#00ff9c] hover:glow
                        ${isActive ? "text-[#00ff9c] glow" : "text-zinc-400"}
                      `}
                    >
                      {isActive ? "> " : "  "}{tool.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
