export type CommandEntry = {
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

/**
 * Canonical intent-based commands. Platform-first cheatsheets deliberately
 * omit commands from this catalog to keep one owner for translated examples.
 */
export const COMMAND_DB: CommandEntry[] = [
  {
    id: "show-routing-table",
    category: "Routing",
    intent: "Show full routing table",
    keywords: ["route", "routing", "table", "rib", "ip route", "show ip route"],
    vendors: { cisco: "show ip route", mikrotik: "/ip route print", fortigate: "get router info routing-table all", linux: "ip route show" },
  },
  {
    id: "show-ospf-neighbors",
    category: "Routing",
    intent: "Show OSPF neighbors",
    keywords: ["ospf", "neighbor", "peer", "adjacency"],
    vendors: { cisco: "show ip ospf neighbor", mikrotik: "/routing ospf neighbor print", fortigate: "get router info ospf neighbor", linux: "vtysh -c 'show ip ospf neighbor'" },
  },
  {
    id: "show-bgp-summary",
    category: "Routing",
    intent: "Show BGP peers and summary",
    keywords: ["bgp", "peer", "summary", "neighbor"],
    vendors: { cisco: "show ip bgp summary", mikrotik: "/routing bgp peer print status", fortigate: "get router info bgp summary", linux: "vtysh -c 'show ip bgp summary'" },
  },
  {
    id: "show-interfaces-brief",
    category: "Interfaces",
    intent: "Show interface status (brief)",
    keywords: ["interface", "status", "link", "brief", "ip", "address"],
    vendors: { cisco: "show ip interface brief", mikrotik: "/ip address print", fortigate: "get system interface physical", linux: "ip -br a" },
  },
  {
    id: "show-arp-table",
    category: "Interfaces",
    intent: "Show ARP table / MAC address mapping",
    keywords: ["arp", "mac", "neighbor", "physical", "cache"],
    vendors: { cisco: "show arp", mikrotik: "/ip arp print", fortigate: "get system arp", linux: "ip neighbor show" },
  },
  {
    id: "show-mac-address-table",
    category: "Interfaces",
    intent: "Show MAC address table (Layer 2)",
    keywords: ["mac", "table", "address-table", "cam", "layer 2", "switch"],
    vendors: { cisco: "show mac address-table", mikrotik: "/interface bridge host print", fortigate: "diagnose netlink brctl name host", linux: "bridge fdb show" },
  },
  {
    id: "show-firewall-rules",
    category: "Firewall & NAT",
    intent: "Show firewall policies / rules",
    keywords: ["firewall", "policy", "rule", "acl", "access-list", "filter"],
    vendors: { cisco: "show access-lists", mikrotik: "/ip firewall filter print", fortigate: "show firewall policy", linux: "iptables -L -n -v" },
  },
  {
    id: "show-nat-translations",
    category: "Firewall & NAT",
    intent: "Show active NAT translations",
    keywords: ["nat", "translation", "pat", "masquerade", "connections"],
    vendors: { cisco: "show ip nat translations", mikrotik: "/ip firewall connection print", fortigate: "diagnose sys session list", linux: "conntrack -L" },
  },
  {
    id: "ping",
    category: "Diagnostics",
    intent: "Ping an IP with source interface",
    keywords: ["ping", "icmp", "source", "test", "reachability"],
    vendors: { cisco: "ping 8.8.8.8 source eth0", mikrotik: "/ping 8.8.8.8 interface=eth0", fortigate: "execute ping-options source 10.0.0.1\nexecute ping 8.8.8.8", linux: "ping -I eth0 8.8.8.8" },
  },
  {
    id: "traceroute",
    category: "Diagnostics",
    intent: "Traceroute to destination",
    keywords: ["traceroute", "trace", "path", "route"],
    vendors: { cisco: "traceroute 8.8.8.8", mikrotik: "/tool traceroute 8.8.8.8", fortigate: "execute traceroute 8.8.8.8", linux: "traceroute 8.8.8.8" },
  },
  {
    id: "packet-capture",
    category: "Diagnostics",
    intent: "Run a packet capture (sniffer)",
    keywords: ["pcap", "sniffer", "packet", "capture", "tcpdump", "wireshark"],
    vendors: { cisco: "monitor capture CAP1 interface GigabitEthernet0/0 both", mikrotik: "/tool sniffer start interface=ether1", fortigate: "diagnose sniffer packet any 'host 8.8.8.8' 4 0 l", linux: "tcpdump -i eth0 host 8.8.8.8" },
  },
  {
    id: "show-logs",
    category: "System",
    intent: "Show system logs",
    keywords: ["log", "syslog", "events", "messages"],
    vendors: { cisco: "show logging", mikrotik: "/log print", fortigate: "execute log display", linux: "journalctl -xe" },
  },
  {
    id: "show-cpu-ram",
    category: "System",
    intent: "Show CPU and Memory utilization",
    keywords: ["cpu", "ram", "memory", "utilization", "resources", "top"],
    vendors: { cisco: "show processes cpu\nshow memory", mikrotik: "/system resource print", fortigate: "get system performance status", linux: "top / htop / free -m" },
  },
];

export const canonicalCommandText = new Set(
  COMMAND_DB.flatMap(entry => Object.values(entry.vendors).filter((command): command is string => Boolean(command)).map(command => command.trim().toLowerCase()))
);
