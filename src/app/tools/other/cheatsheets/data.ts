import { canonicalCommandText } from "@/lib/network-command-catalog";

export interface CheatSheetEntry {
  id: string;
  platform: 'Cisco' | 'MikroTik' | 'FortiGate' | 'Linux' | 'Windows' | 'Docker' | 'Kubernetes' | 'Git' | 'Nmap' | 'OpenSSL' | 'Other';
  category: string;
  command: string;
  description: string;
  tags: string[];
  aliases: string[];
}

const PLATFORM_CHEATSHEETS: CheatSheetEntry[] = [
  // ==========================================
  // LINUX
  // ==========================================
  {
    id: "linux-net-2",
    platform: "Linux",
    category: "Networking",
    command: "ip addr show",
    description: "Display interface IP addresses",
    tags: ["interfaces", "ip", "addr", "show"],
    aliases: ["ifconfig", "ip address", "interfaces"]
  },
  {
    id: "linux-net-3",
    platform: "Linux",
    category: "Networking",
    command: "ss -tulpn",
    description: "List all listening ports and their associated process IDs",
    tags: ["ports", "listening", "netstat", "security", "ss"],
    aliases: ["open ports", "listening ports", "services", "netstat -tulpn"]
  },
  {
    id: "linux-net-4",
    platform: "Linux",
    category: "Networking",
    command: "dig @8.8.8.8 example.com",
    description: "Query specific DNS server for domain information",
    tags: ["dns", "dig", "resolve", "query"],
    aliases: ["nslookup", "name resolution", "dns query"]
  },
  {
    id: "linux-net-5",
    platform: "Linux",
    category: "Networking",
    command: "resolvectl flush-caches",
    description: "Flush the systemd-resolved DNS cache",
    tags: ["dns", "flush", "cache", "systemd"],
    aliases: ["clear dns", "reset dns", "systemd-resolve"]
  },
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
  {
    id: "linux-find-1",
    platform: "Linux",
    category: "System Administration",
    command: "find /var/log -type f -name \"*.log\" -mtime +30 -exec rm {} \\;",
    description: "Find and delete log files older than 30 days",
    tags: ["find", "delete", "logs", "cleanup"],
    aliases: ["delete old files", "clear old logs"]
  },
  {
    id: "linux-find-2",
    platform: "Linux",
    category: "System Administration",
    command: "find . -type d -empty -delete",
    description: "Find and delete empty directories",
    tags: ["find", "empty", "directories", "delete"],
    aliases: ["remove empty folders", "clean empty dirs"]
  },
  {
    id: "linux-sys-1",
    platform: "Linux",
    category: "System Administration",
    command: "htop",
    description: "Interactive process viewer and system monitor",
    tags: ["monitor", "cpu", "ram", "processes"],
    aliases: ["task manager", "top"]
  },
  {
    id: "linux-sys-2",
    platform: "Linux",
    category: "System Administration",
    command: "df -h",
    description: "Report file system disk space usage in human-readable format",
    tags: ["disk", "space", "storage", "df"],
    aliases: ["check space", "hard drive"]
  },
  {
    id: "linux-sys-3",
    platform: "Linux",
    category: "System Administration",
    command: "du -sh *",
    description: "Estimate file space usage for all files in current directory",
    tags: ["disk", "size", "folder", "du"],
    aliases: ["folder size", "directory size"]
  },
  {
    id: "linux-sys-4",
    platform: "Linux",
    category: "System Administration",
    command: "journalctl -xeu service_name",
    description: "View the end of the logs for a specific systemd service",
    tags: ["systemd", "journal", "logs", "service"],
    aliases: ["service logs", "check service", "systemctl logs"]
  },
  {
    id: "linux-fw-1",
    platform: "Linux",
    category: "Security",
    command: "ufw allow 22/tcp",
    description: "Allow incoming SSH traffic using UFW",
    tags: ["firewall", "ufw", "ssh", "allow"],
    aliases: ["open port", "allow ssh"]
  },
  {
    id: "linux-fw-2",
    platform: "Linux",
    category: "Security",
    command: "iptables -L -v -n",
    description: "List all iptables rules with packet counts (no DNS resolution)",
    tags: ["firewall", "iptables", "list", "rules"],
    aliases: ["show iptables", "firewall rules"]
  },
  {
    id: "linux-sec-1",
    platform: "Linux",
    category: "Security",
    command: "grep \"Failed password\" /var/log/auth.log",
    description: "Find failed SSH login attempts",
    tags: ["ssh", "logs", "security", "brute force"],
    aliases: ["failed logins", "ssh attempts"]
  },
  {
    id: "linux-tar-1",
    platform: "Linux",
    category: "System Administration",
    command: "tar -czvf archive.tar.gz /path/to/folder",
    description: "Compress a folder into a gzip tarball",
    tags: ["compress", "tar", "gzip", "archive"],
    aliases: ["zip folder", "make tar"]
  },

  // ==========================================
  // WINDOWS
  // ==========================================
  {
    id: "win-net-1",
    platform: "Windows",
    category: "Networking",
    command: "route print",
    description: "Display the current IP routing table",
    tags: ["routing", "network", "route", "print"],
    aliases: ["routing table", "routes", "netstat -rn"]
  },
  {
    id: "win-net-2",
    platform: "Windows",
    category: "Networking",
    command: "ipconfig /all",
    description: "Display full TCP/IP configuration for all adapters",
    tags: ["interfaces", "ip", "config", "all"],
    aliases: ["ip address", "interfaces", "ifconfig"]
  },
  {
    id: "win-net-3",
    platform: "Windows",
    category: "Networking",
    command: "nslookup example.com 8.8.8.8",
    description: "Query specific DNS server for domain information",
    tags: ["dns", "nslookup", "resolve", "query"],
    aliases: ["dig", "name resolution", "dns query"]
  },
  {
    id: "win-net-4",
    platform: "Windows",
    category: "Networking",
    command: "ipconfig /flushdns",
    description: "Flush and reset the DNS client resolver cache",
    tags: ["dns", "flush", "cache"],
    aliases: ["clear dns", "reset dns"]
  },
  {
    id: "win-net-5",
    platform: "Windows",
    category: "Networking",
    command: "Test-NetConnection -ComputerName 8.8.8.8 -Port 53",
    description: "Test network connectivity and specific port (PowerShell)",
    tags: ["powershell", "ping", "telnet", "port"],
    aliases: ["test port", "ping port", "nc"]
  },
  {
    id: "win-sys-1",
    platform: "Windows",
    category: "System Administration",
    command: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10",
    description: "Show top 10 processes consuming the most CPU (PowerShell)",
    tags: ["powershell", "cpu", "processes", "monitor"],
    aliases: ["task manager", "top cpu"]
  },
  {
    id: "win-sys-2",
    platform: "Windows",
    category: "System Administration",
    command: "Get-EventLog -LogName Security -Newest 50",
    description: "Get the 50 most recent security events (PowerShell)",
    tags: ["powershell", "event viewer", "logs", "security"],
    aliases: ["read logs", "eventlog"]
  },
  {
    id: "win-sys-3",
    platform: "Windows",
    category: "System Administration",
    command: "sfc /scannow",
    description: "Scan the integrity of all protected system files and replace incorrect versions",
    tags: ["cmd", "repair", "system files", "sfc"],
    aliases: ["fix windows", "repair OS"]
  },
  {
    id: "win-sys-4",
    platform: "Windows",
    category: "System Administration",
    command: "Get-LocalUser",
    description: "List all local users (PowerShell)",
    tags: ["users", "local", "powershell"],
    aliases: ["list users", "show users"]
  },
  {
    id: "win-sys-5",
    platform: "Windows",
    category: "System Administration",
    command: "Clear-DnsClientCache",
    description: "Clear the DNS cache (PowerShell)",
    tags: ["dns", "powershell", "cache", "flush"],
    aliases: ["flushdns", "reset dns"]
  },

  // ==========================================
  // CISCO
  // ==========================================
  {
    id: "cisco-net-3",
    platform: "Cisco",
    category: "Networking",
    command: "show running-config",
    description: "Show the current active configuration",
    tags: ["config", "running", "show"],
    aliases: ["sh run", "current config", "configuration"]
  },
  {
    id: "cisco-net-4",
    platform: "Cisco",
    category: "Networking",
    command: "write memory",
    description: "Save the running config to the startup config (NVRAM)",
    tags: ["save", "config", "memory", "write"],
    aliases: ["wr mem", "copy run start", "save config"]
  },
  {
    id: "cisco-net-6",
    platform: "Cisco",
    category: "Networking",
    command: "show cdp neighbors detail",
    description: "Show detailed information about directly connected Cisco devices",
    tags: ["cdp", "neighbors", "discovery"],
    aliases: ["sh cdp nei det", "discover neighbors"]
  },

  // ==========================================
  // MIKROTIK
  // ==========================================
  {
    id: "mikrotik-net-1",
    platform: "MikroTik",
    category: "Networking",
    command: "ip route print",
    description: "Display the current IP routing table",
    tags: ["routing", "network", "print", "ip"],
    aliases: ["routing table", "routes", "ip route"]
  },
  {
    id: "mikrotik-net-2",
    platform: "MikroTik",
    category: "Networking",
    command: "ip address print",
    description: "Display interface IP addresses",
    tags: ["interfaces", "ip", "address", "print"],
    aliases: ["ip address", "interfaces"]
  },
  {
    id: "mikrotik-net-3",
    platform: "MikroTik",
    category: "Networking",
    command: "export file=backup.rsc",
    description: "Export the full configuration to a readable script file",
    tags: ["export", "config", "backup", "rsc"],
    aliases: ["save config", "backup config"]
  },
  {
    id: "mikrotik-sec-1",
    platform: "MikroTik",
    category: "Security",
    command: "ip firewall filter print",
    description: "Print firewall filter rules",
    tags: ["firewall", "rules", "filter"],
    aliases: ["show firewall", "iptables"]
  },
  {
    id: "mikrotik-sys-1",
    platform: "MikroTik",
    category: "System Administration",
    command: "system resource print",
    description: "Show system resources (CPU, RAM, Uptime)",
    tags: ["cpu", "ram", "uptime", "resources"],
    aliases: ["htop", "task manager", "stats"]
  },

  // ==========================================
  // FORTIGATE
  // ==========================================
  {
    id: "fortigate-sys-1",
    platform: "FortiGate",
    category: "System Administration",
    command: "get system status",
    description: "Display general system status, firmware version, and uptime",
    tags: ["status", "system", "version", "uptime"],
    aliases: ["show version", "uptime", "firmware"]
  },
  {
    id: "fortigate-sec-1",
    platform: "FortiGate",
    category: "Security",
    command: "diag sniffer packet any 'host 1.1.1.1' 4 0 l",
    description: "Capture packets (tcpdump equivalent) for a specific IP with high verbosity",
    tags: ["packet", "sniffer", "capture", "pcap"],
    aliases: ["tcpdump", "capture packets", "wireshark"]
  },

  // ==========================================
  // DOCKER
  // ==========================================
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
  {
    id: "docker-4",
    platform: "Docker",
    category: "Containers",
    command: "docker logs -f <container_name>",
    description: "Follow log output of a container",
    tags: ["logs", "tail", "follow", "docker"],
    aliases: ["tail logs", "read logs"]
  },
  {
    id: "docker-5",
    platform: "Docker",
    category: "Containers",
    command: "docker compose up -d",
    description: "Build, (re)create, start, and detach for containers using docker-compose",
    tags: ["compose", "start", "daemon"],
    aliases: ["docker-compose up", "run compose"]
  },

  // ==========================================
  // GIT
  // ==========================================
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
  {
    id: "git-4",
    platform: "Git",
    category: "Version Control",
    command: "git stash",
    description: "Stash changes in a dirty working directory",
    tags: ["git", "stash", "save"],
    aliases: ["save for later", "hide changes"]
  },
  {
    id: "git-5",
    platform: "Git",
    category: "Version Control",
    command: "git checkout -b <new-branch-name>",
    description: "Create and switch to a new branch",
    tags: ["git", "branch", "checkout"],
    aliases: ["new branch", "create branch"]
  },

  // ==========================================
  // OTHER (K8s, Nmap, OpenSSL, etc)
  // ==========================================
  {
    id: "k8s-1",
    platform: "Kubernetes",
    category: "Kubernetes",
    command: "kubectl get pods --all-namespaces",
    description: "List all pods in all namespaces",
    tags: ["kubernetes", "kubectl", "pods", "namespaces"],
    aliases: ["show all pods", "k8s pods"]
  },
  {
    id: "k8s-2",
    platform: "Kubernetes",
    category: "Kubernetes",
    command: "kubectl logs -f <pod-name>",
    description: "Tail the logs for a specific pod",
    tags: ["kubernetes", "kubectl", "logs", "tail"],
    aliases: ["k8s logs", "follow logs"]
  },
  {
    id: "nmap-1",
    platform: "Nmap",
    category: "Security",
    command: "nmap -A -T4 <ip>",
    description: "Aggressive, fast scan with OS detection, version detection, script scanning, and traceroute",
    tags: ["nmap", "scan", "ports", "security"],
    aliases: ["port scan", "aggressive scan", "os detection"]
  },
  {
    id: "nmap-2",
    platform: "Nmap",
    category: "Security",
    command: "nmap -p- <ip>",
    description: "Scan all 65535 ports",
    tags: ["nmap", "scan", "all ports"],
    aliases: ["full scan", "scan all"]
  },
  {
    id: "openssl-1",
    platform: "OpenSSL",
    category: "Security",
    command: "openssl x509 -in cert.pem -text -noout",
    description: "View the contents of a PEM encoded certificate",
    tags: ["openssl", "certificate", "x509", "read"],
    aliases: ["view cert", "read certificate", "decode pem"]
  },
  {
    id: "openssl-2",
    platform: "OpenSSL",
    category: "Security",
    command: "openssl genrsa -out private.key 2048",
    description: "Generate a new 2048-bit RSA private key",
    tags: ["openssl", "generate", "key", "rsa"],
    aliases: ["create key", "new private key"]
  }
];

// The cross-vendor catalog owns exact intent translations. Keep this sheet
// focused on platform-specific workflows instead of showing the same command twice.
export const CHEATSHEETS = PLATFORM_CHEATSHEETS.filter(entry => !canonicalCommandText.has(entry.command.trim().toLowerCase()));
