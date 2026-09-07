"use client";

import { Suspense, useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Search, Server, Shield, Activity, Share2, FileText, ChevronRight } from "lucide-react";

type CommandEntry = {
  id: string;
  category: string;
  intent: string;
  keywords: string[];
  vendors: {
    cisco?: string;
    mikrotik?: string;
    fortigate?: string;
    linux?: string;
  };
};

const COMMAND_DB: CommandEntry[] = [
  // ROUTING
  {
    id: "show-routing-table",
    category: "Routing",
    intent: "Show full routing table",
    keywords: ["route", "routing", "table", "rib", "ip route", "show ip route"],
    vendors: {
      cisco: "show ip route",
      mikrotik: "/ip route print",
      fortigate: "get router info routing-table all",
      linux: "ip route show"
    }
  },
  {
    id: "show-ospf-neighbors",
    category: "Routing",
    intent: "Show OSPF neighbors",
    keywords: ["ospf", "neighbor", "peer", "adjacency"],
    vendors: {
      cisco: "show ip ospf neighbor",
      mikrotik: "/routing ospf neighbor print",
      fortigate: "get router info ospf neighbor",
      linux: "vtysh -c 'show ip ospf neighbor'"
    }
  },
  {
    id: "show-bgp-summary",
    category: "Routing",
    intent: "Show BGP peers and summary",
    keywords: ["bgp", "peer", "summary", "neighbor"],
    vendors: {
      cisco: "show ip bgp summary",
      mikrotik: "/routing bgp peer print status",
      fortigate: "get router info bgp summary",
      linux: "vtysh -c 'show ip bgp summary'"
    }
  },
  
  // INTERFACES
  {
    id: "show-interfaces-brief",
    category: "Interfaces",
    intent: "Show interface status (brief)",
    keywords: ["interface", "status", "link", "brief", "ip", "address"],
    vendors: {
      cisco: "show ip interface brief",
      mikrotik: "/ip address print",
      fortigate: "get system interface physical",
      linux: "ip -br a"
    }
  },
  {
    id: "show-arp-table",
    category: "Interfaces",
    intent: "Show ARP table / MAC address mapping",
    keywords: ["arp", "mac", "neighbor", "physical", "cache"],
    vendors: {
      cisco: "show arp",
      mikrotik: "/ip arp print",
      fortigate: "get system arp",
      linux: "ip neighbor show"
    }
  },
  {
    id: "show-mac-address-table",
    category: "Interfaces",
    intent: "Show MAC address table (Layer 2)",
    keywords: ["mac", "table", "address-table", "cam", "layer 2", "switch"],
    vendors: {
      cisco: "show mac address-table",
      mikrotik: "/interface bridge host print",
      fortigate: "diagnose netlink brctl name host",
      linux: "bridge fdb show"
    }
  },

  // FIREWALL / NAT
  {
    id: "show-firewall-rules",
    category: "Firewall & NAT",
    intent: "Show firewall policies / rules",
    keywords: ["firewall", "policy", "rule", "acl", "access-list", "filter"],
    vendors: {
      cisco: "show access-lists",
      mikrotik: "/ip firewall filter print",
      fortigate: "show firewall policy",
      linux: "iptables -L -n -v"
    }
  },
  {
    id: "show-nat-translations",
    category: "Firewall & NAT",
    intent: "Show active NAT translations",
    keywords: ["nat", "translation", "pat", "masquerade", "connections"],
    vendors: {
      cisco: "show ip nat translations",
      mikrotik: "/ip firewall connection print",
      fortigate: "diagnose sys session list",
      linux: "conntrack -L"
    }
  },

  // DIAGNOSTICS
  {
    id: "ping",
    category: "Diagnostics",
    intent: "Ping an IP with source interface",
    keywords: ["ping", "icmp", "source", "test", "reachability"],
    vendors: {
      cisco: "ping 8.8.8.8 source eth0",
      mikrotik: "/ping 8.8.8.8 interface=eth0",
      fortigate: "execute ping-options source 10.0.0.1\nexecute ping 8.8.8.8",
      linux: "ping -I eth0 8.8.8.8"
    }
  },
  {
    id: "traceroute",
    category: "Diagnostics",
    intent: "Traceroute to destination",
    keywords: ["traceroute", "trace", "path", "route"],
    vendors: {
      cisco: "traceroute 8.8.8.8",
      mikrotik: "/tool traceroute 8.8.8.8",
      fortigate: "execute traceroute 8.8.8.8",
      linux: "traceroute 8.8.8.8"
    }
  },
  {
    id: "packet-capture",
    category: "Diagnostics",
    intent: "Run a packet capture (sniffer)",
    keywords: ["pcap", "sniffer", "packet", "capture", "tcpdump", "wireshark"],
    vendors: {
      cisco: "monitor capture CAP1 interface GigabitEthernet0/0 both",
      mikrotik: "/tool sniffer start interface=ether1",
      fortigate: "diagnose sniffer packet any 'host 8.8.8.8' 4 0 l",
      linux: "tcpdump -i eth0 host 8.8.8.8"
    }
  },

  // SYSTEM / LOGS
  {
    id: "show-logs",
    category: "System",
    intent: "Show system logs",
    keywords: ["log", "syslog", "events", "messages"],
    vendors: {
      cisco: "show logging",
      mikrotik: "/log print",
      fortigate: "execute log display",
      linux: "journalctl -xe"
    }
  },
  {
    id: "show-cpu-ram",
    category: "System",
    intent: "Show CPU and Memory utilization",
    keywords: ["cpu", "ram", "memory", "utilization", "resources", "top"],
    vendors: {
      cisco: "show processes cpu\nshow memory",
      mikrotik: "/system resource print",
      fortigate: "get system performance status",
      linux: "top / htop / free -m"
    }
  }
];

function CommandReferenceContent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(COMMAND_DB.map(c => c.category)))];

  const filteredCommands = useMemo(() => {
    let filtered = COMMAND_DB;

    if (activeCategory !== "All") {
      filtered = filtered.filter(c => c.category === activeCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(c => 
        c.intent.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.keywords.some(k => k.includes(q)) ||
        Object.values(c.vendors).some(v => v?.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [query, activeCategory]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search Header */}
      <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search intent, concept, or command (e.g. 'routing table', 'nat', 'ospf')"
            className="w-full bg-black border border-[#1a1a1a] p-4 pl-12 text-[#00ff9c] font-mono text-lg focus:border-[#00ff9c] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
                activeCategory === cat 
                  ? "bg-[#00ff9c]/10 border-[#00ff9c]/50 text-[#00ff9c]" 
                  : "bg-black border-[#1a1a1a] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {filteredCommands.length === 0 ? (
          <div className="text-center p-12 border border-[#1a1a1a] bg-[#050505] text-zinc-500 font-mono text-sm">
            No commands found matching "{query}"
          </div>
        ) : (
          filteredCommands.map((cmd) => (
            <div key={cmd.id} className="border border-[#1a1a1a] bg-[#050505] overflow-hidden">
              <header className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center gap-3">
                <div className="p-2 bg-[#00ff9c]/10 text-[#00ff9c] rounded-sm">
                  {cmd.category === "Routing" && <Share2 className="w-4 h-4" />}
                  {cmd.category === "Interfaces" && <Server className="w-4 h-4" />}
                  {cmd.category === "Firewall & NAT" && <Shield className="w-4 h-4" />}
                  {cmd.category === "Diagnostics" && <Activity className="w-4 h-4" />}
                  {cmd.category === "System" && <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-[#00ff9c] font-bold tracking-wide">{cmd.intent}</h3>
                  <div className="flex gap-2 mt-1">
                    {cmd.keywords.slice(0, 3).map(k => (
                      <span key={k} className="text-[10px] text-zinc-500 font-mono uppercase bg-black px-1 border border-[#1a1a1a]">#{k}</span>
                    ))}
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]">
                
                {/* Cisco */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    Cisco IOS
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.cisco || "-"}</code>
                </div>

                {/* MikroTik */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    MikroTik RouterOS
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.mikrotik || "-"}</code>
                </div>

                {/* FortiGate */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    FortiGate
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.fortigate || "-"}</code>
                </div>

                {/* Linux */}
                <div className="p-4 flex flex-col hover:bg-[#00ff9c]/5 transition-colors group bg-[#050505]">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-[#00ff9c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    Linux (iproute2/etc)
                  </span>
                  <code className="text-sm text-zinc-300 font-mono whitespace-pre-wrap flex-1">{cmd.vendors.linux || "-"}</code>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default function CommandReferenceTool() {
  return (
    <ToolLayout
      title="Cross-Vendor Command Reference"
      description="Translate operational intents into the exact CLI commands for Cisco, MikroTik, FortiGate, and Linux."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading database...</div>}>
        <CommandReferenceContent />
      </Suspense>
    </ToolLayout>
  );
}
