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
    juniper?: string;
    arista?: string;
  };
};

export const COMMAND_VENDORS = [
  { id: "cisco", label: "Cisco IOS" },
  { id: "mikrotik", label: "MikroTik RouterOS" },
  { id: "fortigate", label: "FortiGate" },
  { id: "linux", label: "Linux" },
  { id: "juniper", label: "Juniper Junos" },
  { id: "arista", label: "Arista EOS" },
] as const;

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
    vendors: { cisco: "show ip route", mikrotik: "/ip route print", fortigate: "get router info routing-table all", linux: "ip route show", juniper: "show route", arista: "show ip route" },
  },
  {
    id: "show-ospf-neighbors",
    category: "Routing",
    intent: "Show OSPF neighbors",
    keywords: ["ospf", "neighbor", "peer", "adjacency"],
    vendors: { cisco: "show ip ospf neighbor", mikrotik: "/routing ospf neighbor print", fortigate: "get router info ospf neighbor", linux: "vtysh -c 'show ip ospf neighbor'", juniper: "show ospf neighbor", arista: "show ip ospf neighbor" },
  },
  {
    id: "show-bgp-summary",
    category: "Routing",
    intent: "Show BGP peers and summary",
    keywords: ["bgp", "peer", "summary", "neighbor"],
    vendors: { cisco: "show ip bgp summary", mikrotik: "/routing bgp peer print status", fortigate: "get router info bgp summary", linux: "vtysh -c 'show ip bgp summary'", juniper: "show bgp summary", arista: "show ip bgp summary" },
  },
  {
    id: "show-interfaces-brief",
    category: "Interfaces",
    intent: "Show interface status (brief)",
    keywords: ["interface", "status", "link", "brief", "ip", "address"],
    vendors: { cisco: "show ip interface brief", mikrotik: "/ip address print", fortigate: "get system interface physical", linux: "ip -br a", juniper: "show interfaces terse", arista: "show ip interface brief" },
  },
  {
    id: "show-arp-table",
    category: "Interfaces",
    intent: "Show ARP table / MAC address mapping",
    keywords: ["arp", "mac", "neighbor", "physical", "cache"],
    vendors: { cisco: "show arp", mikrotik: "/ip arp print", fortigate: "get system arp", linux: "ip neighbor show", juniper: "show arp", arista: "show arp" },
  },
  {
    id: "show-mac-address-table",
    category: "Interfaces",
    intent: "Show MAC address table (Layer 2)",
    keywords: ["mac", "table", "address-table", "cam", "layer 2", "switch"],
    vendors: { cisco: "show mac address-table", mikrotik: "/interface bridge host print", fortigate: "diagnose netlink brctl name host", linux: "bridge fdb show", juniper: "show ethernet-switching table", arista: "show mac address-table" },
  },
  {
    id: "show-firewall-rules",
    category: "Firewall & NAT",
    intent: "Show firewall policies / rules",
    keywords: ["firewall", "policy", "rule", "acl", "access-list", "filter"],
    vendors: { cisco: "show access-lists", mikrotik: "/ip firewall filter print", fortigate: "show firewall policy", linux: "iptables -L -n -v", juniper: "show configuration firewall", arista: "show ip access-lists" },
  },
  {
    id: "show-nat-translations",
    category: "Firewall & NAT",
    intent: "Show active NAT translations",
    keywords: ["nat", "translation", "pat", "masquerade", "connections"],
    vendors: { cisco: "show ip nat translations", mikrotik: "/ip firewall connection print", fortigate: "diagnose sys session list", linux: "conntrack -L", juniper: "show security flow session" },
  },
  {
    id: "ping",
    category: "Diagnostics",
    intent: "Ping an IP with source interface",
    keywords: ["ping", "icmp", "source", "test", "reachability"],
    vendors: { cisco: "ping 8.8.8.8 source eth0", mikrotik: "/ping 8.8.8.8 interface=eth0", fortigate: "execute ping-options source 10.0.0.1\nexecute ping 8.8.8.8", linux: "ping -I eth0 8.8.8.8", juniper: "ping 8.8.8.8", arista: "ping 8.8.8.8" },
  },
  {
    id: "traceroute",
    category: "Diagnostics",
    intent: "Traceroute to destination",
    keywords: ["traceroute", "trace", "path", "route"],
    vendors: { cisco: "traceroute 8.8.8.8", mikrotik: "/tool traceroute 8.8.8.8", fortigate: "execute traceroute 8.8.8.8", linux: "traceroute 8.8.8.8", juniper: "traceroute 8.8.8.8", arista: "traceroute 8.8.8.8" },
  },
  {
    id: "packet-capture",
    category: "Diagnostics",
    intent: "Run a packet capture (sniffer)",
    keywords: ["pcap", "sniffer", "packet", "capture", "tcpdump", "wireshark"],
    vendors: { cisco: "monitor capture CAP1 interface GigabitEthernet0/0 both", mikrotik: "/tool sniffer start interface=ether1", fortigate: "diagnose sniffer packet any 'host 8.8.8.8' 4 0 l", linux: "tcpdump -i eth0 host 8.8.8.8", juniper: "monitor traffic interface ge-0/0/0 matching \"host 8.8.8.8\"" },
  },
  {
    id: "show-logs",
    category: "System",
    intent: "Show system logs",
    keywords: ["log", "syslog", "events", "messages"],
    vendors: { cisco: "show logging", mikrotik: "/log print", fortigate: "execute log display", linux: "journalctl -xe", juniper: "show log messages", arista: "show logging" },
  },
  {
    id: "show-cpu-ram",
    category: "System",
    intent: "Show CPU and Memory utilization",
    keywords: ["cpu", "ram", "memory", "utilization", "resources", "top"],
    vendors: { cisco: "show processes cpu\nshow memory", mikrotik: "/system resource print", fortigate: "get system performance status", linux: "top / htop / free -m", juniper: "show chassis routing-engine", arista: "show processes top once" },
  },
  {
    id: "show-system-version",
    category: "System",
    intent: "Show system version and uptime",
    keywords: ["version", "firmware", "software", "uptime", "release"],
    vendors: { cisco: "show version", mikrotik: "/system resource print", fortigate: "get system status", linux: "uname -a\ncat /etc/os-release", juniper: "show version", arista: "show version" },
  },
  {
    id: "show-active-configuration",
    category: "System",
    intent: "Show active configuration",
    keywords: ["config", "configuration", "running", "startup", "export"],
    vendors: { cisco: "show running-config", mikrotik: "/export terse", fortigate: "show full-configuration", linux: "ip address show\nip route show", juniper: "show configuration | display set", arista: "show running-config" },
  },
  {
    id: "show-vlan-summary",
    category: "Interfaces",
    intent: "Show VLAN summary and membership",
    keywords: ["vlan", "802.1q", "switch", "membership", "tagged", "untagged"],
    vendors: { cisco: "show vlan brief", mikrotik: "/interface bridge vlan print", fortigate: "show system interface", linux: "bridge vlan show", juniper: "show vlans brief", arista: "show vlan" },
  },
  {
    id: "show-interface-errors",
    category: "Interfaces",
    intent: "Show interface errors and drops",
    keywords: ["interface", "errors", "drops", "crc", "counters", "packet loss"],
    vendors: { cisco: "show interfaces counters errors", mikrotik: "/interface ethernet print stats", fortigate: "diagnose hardware deviceinfo nic", linux: "ip -s link", juniper: "show interfaces extensive | match \"error|drops\"", arista: "show interfaces counters errors" },
  },
  {
    id: "show-lldp-neighbors",
    category: "Discovery",
    intent: "Show LLDP neighbors",
    keywords: ["lldp", "neighbors", "topology", "discovery", "adjacency"],
    vendors: { cisco: "show lldp neighbors detail", mikrotik: "/ip neighbor print", fortigate: "diagnose lldprx neighbor summary", linux: "lldpcli show neighbors", juniper: "show lldp neighbors", arista: "show lldp neighbors" },
  },
  {
    id: "show-dhcp-bindings",
    category: "Services",
    intent: "Show DHCP leases and bindings",
    keywords: ["dhcp", "lease", "binding", "address assignment", "scope"],
    vendors: { cisco: "show ip dhcp binding", mikrotik: "/ip dhcp-server lease print", fortigate: "execute dhcp lease-list", juniper: "show dhcp server binding", arista: "show ip dhcp snooping binding" },
  },
];

export const canonicalCommandText = new Set(
  COMMAND_DB.flatMap(entry => Object.values(entry.vendors).filter((command): command is string => Boolean(command)).map(command => command.trim().toLowerCase()))
);
