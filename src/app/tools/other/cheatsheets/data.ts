export interface CheatSheetEntry {
  id: string;
  platform: 'Cisco' | 'MikroTik' | 'FortiGate' | 'Linux' | 'Windows' | 'Docker' | 'Git' | 'Other';
  category: string;
  command: string;
  description: string;
  tags: string[];
  aliases: string[];
}

export const CHEATSHEETS: CheatSheetEntry[] = [
  // -------------------------
  // Routing Table
  // -------------------------
  {
    id: "route-cisco-1",
    platform: "Cisco",
    category: "Networking",
    command: "show ip route",
    description: "Display the current IP routing table",
    tags: ["routing", "network", "show", "ip"],
    aliases: ["routing table", "routes", "ip route", "sh ip ro"]
  },
  {
    id: "route-mikrotik-1",
    platform: "MikroTik",
    category: "Networking",
    command: "ip route print",
    description: "Display the current IP routing table",
    tags: ["routing", "network", "print", "ip"],
    aliases: ["routing table", "routes", "ip route"]
  },
  {
    id: "route-linux-1",
    platform: "Linux",
    category: "Networking",
    command: "ip route show",
    description: "Display the current IP routing table",
    tags: ["routing", "network", "ip", "route"],
    aliases: ["routing table", "routes", "netstat -rn", "route -n"]
  },
  {
    id: "route-windows-1",
    platform: "Windows",
    category: "Networking",
    command: "route print",
    description: "Display the current IP routing table",
    tags: ["routing", "network", "route", "print"],
    aliases: ["routing table", "routes", "netstat -rn"]
  },
  
  // -------------------------
  // Interfaces / IP Addresses
  // -------------------------
  {
    id: "ip-cisco-1",
    platform: "Cisco",
    category: "Networking",
    command: "show ip interface brief",
    description: "Display a brief summary of interface statuses and IP addresses",
    tags: ["interfaces", "ip", "status", "brief"],
    aliases: ["sh ip int br", "interfaces", "ip address", "status"]
  },
  {
    id: "ip-mikrotik-1",
    platform: "MikroTik",
    category: "Networking",
    command: "ip address print",
    description: "Display interface IP addresses",
    tags: ["interfaces", "ip", "address", "print"],
    aliases: ["ip address", "interfaces"]
  },
  {
    id: "ip-linux-1",
    platform: "Linux",
    category: "Networking",
    command: "ip addr show",
    description: "Display interface IP addresses",
    tags: ["interfaces", "ip", "addr", "show"],
    aliases: ["ifconfig", "ip address", "interfaces"]
  },
  {
    id: "ip-windows-1",
    platform: "Windows",
    category: "Networking",
    command: "ipconfig /all",
    description: "Display full TCP/IP configuration for all adapters",
    tags: ["interfaces", "ip", "config", "all"],
    aliases: ["ip address", "interfaces", "ifconfig"]
  },

  // -------------------------
  // DNS / Name Resolution
  // -------------------------
  {
    id: "dns-linux-1",
    platform: "Linux",
    category: "Networking",
    command: "dig @8.8.8.8 example.com",
    description: "Query specific DNS server for domain information",
    tags: ["dns", "dig", "resolve", "query"],
    aliases: ["nslookup", "name resolution", "dns query"]
  },
  {
    id: "dns-windows-1",
    platform: "Windows",
    category: "Networking",
    command: "nslookup example.com 8.8.8.8",
    description: "Query specific DNS server for domain information",
    tags: ["dns", "nslookup", "resolve", "query"],
    aliases: ["dig", "name resolution", "dns query"]
  },
  {
    id: "dns-windows-2",
    platform: "Windows",
    category: "Networking",
    command: "ipconfig /flushdns",
    description: "Flush and reset the DNS client resolver cache",
    tags: ["dns", "flush", "cache"],
    aliases: ["clear dns", "reset dns"]
  },
  {
    id: "dns-linux-2",
    platform: "Linux",
    category: "Networking",
    command: "resolvectl flush-caches",
    description: "Flush the systemd-resolved DNS cache",
    tags: ["dns", "flush", "cache", "systemd"],
    aliases: ["clear dns", "reset dns", "systemd-resolve"]
  },

  // -------------------------
  // Docker
  // -------------------------
  {
    id: "docker-1",
    platform: "Docker",
    category: "Containers",
    command: "docker ps -a",
    description: "List all containers (running and stopped)",
    tags: ["docker", "list", "containers", "ps"],
    aliases: ["show containers", "all containers"]
  },
  {
    id: "docker-2",
    platform: "Docker",
    category: "Containers",
    command: "docker exec -it <container_name> /bin/bash",
    description: "Get an interactive shell inside a running container",
    tags: ["docker", "exec", "shell", "bash"],
    aliases: ["ssh container", "enter container", "login container"]
  },
  {
    id: "docker-3",
    platform: "Docker",
    category: "Containers",
    command: "docker system prune -a",
    description: "Remove all unused containers, networks, images, and volumes",
    tags: ["docker", "cleanup", "prune", "disk space"],
    aliases: ["clear docker", "delete all docker", "free space"]
  },

  // -------------------------
  // Git
  // -------------------------
  {
    id: "git-1",
    platform: "Git",
    category: "Version Control",
    command: "git log --oneline --graph --decorate --all",
    description: "View a visual tree of all branches and commits",
    tags: ["git", "log", "tree", "branch"],
    aliases: ["show history", "visualize git", "git tree"]
  },
  {
    id: "git-2",
    platform: "Git",
    category: "Version Control",
    command: "git reset --hard HEAD",
    description: "Discard all local changes in the working directory",
    tags: ["git", "reset", "hard", "discard"],
    aliases: ["undo changes", "revert all", "clean workspace"]
  },
  {
    id: "git-3",
    platform: "Git",
    category: "Version Control",
    command: "git clean -fd",
    description: "Remove all untracked files and directories",
    tags: ["git", "clean", "untracked"],
    aliases: ["delete new files", "purge untracked"]
  },

  // -------------------------
  // Linux User Management & Permissions
  // -------------------------
  {
    id: "linux-user-1",
    platform: "Linux",
    category: "System Administration",
    command: "usermod -aG sudo username",
    description: "Add an existing user to the sudo group",
    tags: ["user", "group", "sudo", "usermod"],
    aliases: ["add admin", "make admin", "give sudo"]
  },
  {
    id: "linux-perm-1",
    platform: "Linux",
    category: "System Administration",
    command: "chmod -R 755 /path/to/dir",
    description: "Recursively set directory permissions to rwxr-xr-x",
    tags: ["permissions", "chmod", "recursive"],
    aliases: ["fix permissions", "change permissions"]
  },
  {
    id: "linux-perm-2",
    platform: "Linux",
    category: "System Administration",
    command: "chown -R user:group /path/to/dir",
    description: "Recursively change the owner and group of a directory",
    tags: ["permissions", "chown", "owner", "recursive"],
    aliases: ["change owner", "take ownership"]
  },

  // -------------------------
  // Linux Firewalls (iptables / ufw)
  // -------------------------
  {
    id: "fw-linux-1",
    platform: "Linux",
    category: "Security",
    command: "ufw allow 22/tcp",
    description: "Allow incoming SSH traffic using UFW",
    tags: ["firewall", "ufw", "ssh", "allow"],
    aliases: ["open port", "allow ssh"]
  },
  {
    id: "fw-linux-2",
    platform: "Linux",
    category: "Security",
    command: "iptables -L -v -n",
    description: "List all iptables rules with packet counts (no DNS resolution)",
    tags: ["firewall", "iptables", "list", "rules"],
    aliases: ["show iptables", "firewall rules"]
  }
];
