import { 
  LogIn, Terminal, Anchor, ArrowUpCircle, 
  ShieldOff, Key, Search as SearchIcon, MoveHorizontal, 
  Archive, Radio, UploadCloud, AlertTriangle, Shield,
  type LucideIcon
} from "lucide-react";

export type Tactic = 
  | "All"
  | "Reconnaissance"
  | "Resource Development"
  | "Initial Access" 
  | "Execution" 
  | "Persistence" 
  | "Privilege Escalation" 
  | "Stealth"
  | "Defense Impairment"
  | "Defense Evasion" 
  | "Credential Access" 
  | "Discovery" 
  | "Lateral Movement" 
  | "Collection" 
  | "Command and Control" 
  | "Exfiltration" 
  | "Impact";

export type Platform = "Windows" | "Linux" | "macOS" | "Network Devices" | "Cross-Platform" | "PRE";

export const MITRE_VERSION = "19.2";

export type MitreDef = {
  id: string;
  tactic: Tactic;
  /** Additional ATT&CK tactics when the technique is cross-tactic. */
  tactics?: Tactic[];
  name: string;
  description: string;
  example: string;
  icon: LucideIcon;
  color: string;
  platform: Platform;
  /** Parent technique ID for sub-techniques; omitted for parent techniques. */
  parentId?: string;
};

export const hasMitreTactic = (definition: MitreDef, tactic: Tactic) =>
  definition.tactic === tactic || definition.tactics?.includes(tactic) === true;

const persistenceEntry = (id: string, name: string, platform: Platform, parentId?: string): MitreDef => ({
  id,
  ...(parentId ? { parentId } : {}),
  tactic: "Persistence",
  name,
  description: `${name} can be abused to maintain access across restarts, changed credentials, or other interruptions to an existing foothold.`,
  example: `Auditing and investigating unexpected ${name.toLowerCase()} changes on a host or service.`,
  icon: Anchor,
  color: "text-purple-400",
  platform,
});

const privilegeEscalationEntry = (id: string, name: string, platform: Platform, parentId?: string): MitreDef => ({
  id,
  ...(parentId ? { parentId } : {}),
  tactic: "Privilege Escalation",
  name,
  description: `${name} can be abused to obtain higher-level permissions or bypass access controls on a host, domain, or cloud environment.`,
  example: `Investigating unexpected ${name.toLowerCase()} activity associated with a privilege change.`,
  icon: ArrowUpCircle,
  color: "text-amber-400",
  platform,
});

const stealthEntry = (id: string, name: string, platform: Platform, parentId?: string): MitreDef => ({
  id,
  ...(parentId ? { parentId } : {}),
  tactic: "Stealth",
  name,
  description: `${name} can be abused to conceal activity, reduce observable indicators, or blend attacker behavior with legitimate system activity.`,
  example: `Hunting for unexpected ${name.toLowerCase()} behavior and correlating it with process, file, identity, and network telemetry.`,
  icon: ShieldOff,
  color: "text-red-300",
  platform,
});

const defenseImpairmentEntry = (id: string, name: string, platform: Platform, parentId?: string): MitreDef => ({
  id,
  ...(parentId ? { parentId } : {}),
  tactic: "Defense Impairment",
  name,
  description: `${name} can be abused to degrade, disable, or undermine security controls, monitoring, or response capabilities.`,
  example: `Investigating unexpected ${name.toLowerCase()} changes together with privilege, configuration, and telemetry gaps.`,
  icon: ShieldOff,
  color: "text-red-400",
  platform,
});

const credentialAccessEntry = (id: string, name: string, platform: Platform, parentId?: string): MitreDef => ({
  id,
  ...(parentId ? { parentId } : {}),
  tactic: "Credential Access",
  name,
  description: `${name} can be abused to obtain account names, passwords, hashes, tokens, keys, or other authentication material.`,
  example: `Investigating unexpected ${name.toLowerCase()} access and correlating it with process, identity, file, and network telemetry.`,
  icon: Key,
  color: "text-yellow-400",
  platform,
});

const PRIVILEGE_ESCALATION_ENTRIES: MitreDef[] = [
  privilegeEscalationEntry("T1548", "Abuse Elevation Control Mechanism", "Cross-Platform"),
  privilegeEscalationEntry("T1134", "Access Token Manipulation", "Windows"),
  privilegeEscalationEntry("T1484", "Domain or Tenant Policy Modification", "Cross-Platform"),
  privilegeEscalationEntry("T1611", "Escape to Host", "Cross-Platform"),
  privilegeEscalationEntry("T1068", "Exploitation for Privilege Escalation", "Cross-Platform"),
  privilegeEscalationEntry("T1548.001", "Setuid and Setgid", "Linux", "T1548"),
  privilegeEscalationEntry("T1548.004", "Elevated Execution with Prompt", "Cross-Platform", "T1548"),
  privilegeEscalationEntry("T1548.005", "Temporary Elevated Cloud Access", "Cross-Platform", "T1548"),
  privilegeEscalationEntry("T1548.006", "TCC Manipulation", "Cross-Platform", "T1548"),
  privilegeEscalationEntry("T1134.001", "Token Impersonation/Theft", "Windows", "T1134"),
  privilegeEscalationEntry("T1134.002", "Create Process with Token", "Windows", "T1134"),
  privilegeEscalationEntry("T1134.003", "Make and Impersonate Token", "Windows", "T1134"),
  privilegeEscalationEntry("T1134.004", "Parent PID Spoofing", "Windows", "T1134"),
  privilegeEscalationEntry("T1134.005", "SID-History Injection", "Windows", "T1134"),
  privilegeEscalationEntry("T1484.001", "Group Policy Modification", "Windows", "T1484"),
  privilegeEscalationEntry("T1484.002", "Trust Modification", "Cross-Platform", "T1484"),
  privilegeEscalationEntry("T1055.003", "Thread Execution Hijacking", "Cross-Platform", "T1055"),
  privilegeEscalationEntry("T1055.004", "Asynchronous Procedure Call", "Windows", "T1055"),
  privilegeEscalationEntry("T1055.005", "Thread Local Storage", "Windows", "T1055"),
  privilegeEscalationEntry("T1055.008", "Ptrace System Calls", "Linux", "T1055"),
  privilegeEscalationEntry("T1055.009", "Proc Memory", "Linux", "T1055"),
  privilegeEscalationEntry("T1055.011", "Extra Window Memory Injection", "Windows", "T1055"),
  privilegeEscalationEntry("T1055.012", "Process Hollowing", "Windows", "T1055"),
  privilegeEscalationEntry("T1055.013", "Process Doppelgänging", "Windows", "T1055"),
  privilegeEscalationEntry("T1055.014", "VDSO Hijacking", "Linux", "T1055"),
  privilegeEscalationEntry("T1055.015", "ListPlanting", "Windows", "T1055"),
];

// Remaining Enterprise Stealth objects in v19.2. Shared objects are linked below
// so each ID keeps one canonical definition while appearing in every ATT&CK tactic.
const STEALTH_CATALOG: Array<[string, string, Platform, string?]> = [
  ["T1612", "Build Image on Host", "Cross-Platform"],
  ["T1622", "Debugger Evasion", "Cross-Platform"],
  ["T1678", "Delay Execution", "Cross-Platform"],
  ["T1140", "Deobfuscate/Decode Files or Information", "Cross-Platform"],
  ["T1006", "Direct Volume Access", "Windows"],
  ["T1480", "Execution Guardrails", "Cross-Platform"],
  ["T1480.001", "Environmental Keying", "Cross-Platform", "T1480"],
  ["T1480.002", "Mutual Exclusion", "Cross-Platform", "T1480"],
  ["T1211", "Exploitation for Stealth", "Cross-Platform"],
  ["T1564", "Hide Artifacts", "Cross-Platform"],
  ["T1564.001", "Hidden Files and Directories", "Cross-Platform", "T1564"],
  ["T1564.002", "Hidden Users", "Cross-Platform", "T1564"],
  ["T1564.003", "Hidden Window", "Windows", "T1564"],
  ["T1564.004", "NTFS File Attributes", "Windows", "T1564"],
  ["T1564.005", "Hidden File System", "Cross-Platform", "T1564"],
  ["T1564.006", "Run Virtual Instance", "Windows", "T1564"],
  ["T1564.007", "VBA Stomping", "Windows", "T1564"],
  ["T1564.008", "Email Hiding Rules", "Windows", "T1564"],
  ["T1564.009", "Resource Forking", "Cross-Platform", "T1564"],
  ["T1564.010", "Process Argument Spoofing", "Cross-Platform", "T1564"],
  ["T1564.011", "Ignore Process Interrupts", "Linux", "T1564"],
  ["T1564.012", "File and Directory Discovery Exclusions", "Cross-Platform", "T1564"],
  ["T1564.013", "Bind Mounts", "Linux", "T1564"],
  ["T1564.014", "Extended Attributes", "Cross-Platform", "T1564"],
  ["T1070", "Indicator Removal", "Cross-Platform"],
  ["T1070.005", "Network Share Connection Removal", "Windows", "T1070"],
  ["T1070.006", "Timestomp", "Cross-Platform", "T1070"],
  ["T1070.007", "Clear Network Connection History and Configurations", "Cross-Platform", "T1070"],
  ["T1070.008", "Clear Mailbox Data", "Cross-Platform", "T1070"],
  ["T1070.009", "Clear Persistence", "Cross-Platform", "T1070"],
  ["T1070.010", "Relocate Malware", "Cross-Platform", "T1070"],
  ["T1202", "Indirect Command Execution", "Windows"],
  ["T1036", "Masquerading", "Cross-Platform"],
  ["T1036.001", "Invalid Code Signature", "Windows", "T1036"],
  ["T1036.002", "Right-to-Left Override", "Windows", "T1036"],
  ["T1036.003", "Rename Legitimate Utilities", "Cross-Platform", "T1036"],
  ["T1036.004", "Masquerade Task or Service", "Cross-Platform", "T1036"],
  ["T1036.005", "Match Legitimate Resource Name or Location", "Cross-Platform", "T1036"],
  ["T1036.006", "Space after Filename", "Windows", "T1036"],
  ["T1036.007", "Double File Extension", "Windows", "T1036"],
  ["T1036.008", "Masquerade File Type", "Cross-Platform", "T1036"],
  ["T1036.009", "Break Process Trees", "Cross-Platform", "T1036"],
  ["T1036.010", "Masquerade Account Name", "Cross-Platform", "T1036"],
  ["T1036.011", "Overwrite Process Arguments", "Linux", "T1036"],
  ["T1027", "Obfuscated Files or Information", "Cross-Platform"],
  ["T1027.001", "Binary Padding", "Cross-Platform", "T1027"],
  ["T1027.002", "Software Packing", "Cross-Platform", "T1027"],
  ["T1027.003", "Steganography", "Cross-Platform", "T1027"],
  ["T1027.004", "Compile After Delivery", "Cross-Platform", "T1027"],
  ["T1027.005", "Indicator Removal from Tools", "Cross-Platform", "T1027"],
  ["T1027.006", "HTML Smuggling", "Cross-Platform", "T1027"],
  ["T1027.007", "Dynamic API Resolution", "Cross-Platform", "T1027"],
  ["T1027.008", "Stripped Payloads", "Cross-Platform", "T1027"],
  ["T1027.009", "Embedded Payloads", "Cross-Platform", "T1027"],
  ["T1027.010", "Command Obfuscation", "Cross-Platform", "T1027"],
  ["T1027.011", "Fileless Storage", "Cross-Platform", "T1027"],
  ["T1027.012", "LNK Icon Smuggling", "Windows", "T1027"],
  ["T1027.013", "Encrypted/Encoded File", "Cross-Platform", "T1027"],
  ["T1027.014", "Polymorphic Code", "Cross-Platform", "T1027"],
  ["T1027.015", "Compression", "Cross-Platform", "T1027"],
  ["T1027.016", "Junk Code Insertion", "Cross-Platform", "T1027"],
  ["T1027.017", "SVG Smuggling", "Cross-Platform", "T1027"],
  ["T1027.018", "Invisible Unicode", "Cross-Platform", "T1027"],
  ["T1620", "Reflective Code Loading", "Cross-Platform"],
  ["T1014", "Rootkit", "Cross-Platform"],
  ["T1684", "Social Engineering", "Cross-Platform"],
  ["T1684.001", "Impersonation", "Cross-Platform", "T1684"],
  ["T1684.002", "Email Spoofing", "Cross-Platform", "T1684"],
  ["T1218", "System Binary Proxy Execution", "Windows"],
  ["T1218.001", "Compiled HTML File", "Windows", "T1218"],
  ["T1218.002", "Control Panel", "Windows", "T1218"],
  ["T1218.003", "CMSTP", "Windows", "T1218"],
  ["T1218.004", "InstallUtil", "Windows", "T1218"],
  ["T1218.005", "Mshta", "Windows", "T1218"],
  ["T1218.007", "Msiexec", "Windows", "T1218"],
  ["T1218.008", "Odbcconf", "Windows", "T1218"],
  ["T1218.009", "Regsvcs/Regasm", "Windows", "T1218"],
  ["T1218.010", "Regsvr32", "Windows", "T1218"],
  ["T1218.011", "Rundll32", "Windows", "T1218"],
  ["T1218.012", "Verclsid", "Windows", "T1218"],
  ["T1218.013", "Mavinject", "Windows", "T1218"],
  ["T1218.014", "MMC", "Windows", "T1218"],
  ["T1218.015", "Electron Applications", "Cross-Platform", "T1218"],
  ["T1216", "System Script Proxy Execution", "Windows"],
  ["T1216.001", "PubPrn", "Windows", "T1216"],
  ["T1216.002", "SyncAppvPublishingServer", "Windows", "T1216"],
  ["T1127", "Trusted Developer Utilities Proxy Execution", "Cross-Platform"],
  ["T1127.001", "MSBuild", "Windows", "T1127"],
  ["T1127.002", "ClickOnce", "Windows", "T1127"],
  ["T1127.003", "JamPlus", "Cross-Platform", "T1127"],
  ["T1220", "XSL Script Processing", "Windows"],
  ["T1221", "Template Injection", "Cross-Platform"],
  ["T1535", "Unused/Unsupported Cloud Regions", "Cross-Platform"],
  ["T1497.001", "System Checks", "Cross-Platform", "T1497"],
  ["T1497.002", "User Activity Based Checks", "Cross-Platform", "T1497"],
  ["T1497.003", "Time Based Checks", "Cross-Platform", "T1497"],
];

const STEALTH_ENTRIES = STEALTH_CATALOG.map(([id, name, platform, parentId]) =>
  stealthEntry(id, name, platform, parentId),
);

const DEFENSE_IMPAIRMENT_CATALOG: Array<[string, string, Platform, string?]> = [
  ["T1686", "Disable or Modify System Firewall", "Cross-Platform"],
  ["T1686.001", "Cloud Firewall", "Cross-Platform", "T1686"],
  ["T1686.002", "Network Device Firewall", "Cross-Platform", "T1686"],
  ["T1686.003", "Windows Host Firewall", "Windows", "T1686"],
  ["T1685", "Disable or Modify Tools", "Cross-Platform"],
  ["T1685.001", "Disable or Modify Windows Event Log", "Windows", "T1685"],
  ["T1685.002", "Disable or Modify Cloud Log", "Cross-Platform", "T1685"],
  ["T1685.003", "Modify or Spoof Tool UI", "Cross-Platform", "T1685"],
  ["T1685.004", "Disable or Modify Linux Audit System Log", "Linux", "T1685"],
  ["T1685.005", "Clear Windows Event Logs", "Windows", "T1685"],
  ["T1685.006", "Clear Linux or Mac System Logs", "Cross-Platform", "T1685"],
  ["T1689", "Downgrade Attack", "Cross-Platform"],
  ["T1687", "Exploitation for Defense Impairment", "Cross-Platform"],
  ["T1222", "File and Directory Permissions Modification", "Cross-Platform"],
  ["T1222.001", "Windows Permissions", "Windows", "T1222"],
  ["T1222.002", "Linux and Mac Permissions", "Cross-Platform", "T1222"],
  ["T1578", "Modify Cloud Compute Infrastructure", "Cross-Platform"],
  ["T1578.001", "Create Snapshot", "Cross-Platform", "T1578"],
  ["T1578.002", "Create Cloud Instance", "Cross-Platform", "T1578"],
  ["T1578.003", "Delete Cloud Instance", "Cross-Platform", "T1578"],
  ["T1578.004", "Revert Cloud Instance", "Cross-Platform", "T1578"],
  ["T1578.005", "Modify Cloud Compute Configurations", "Cross-Platform", "T1578"],
  ["T1666", "Modify Cloud Resource Hierarchy", "Cross-Platform"],
  ["T1601", "Modify System Image", "Network Devices"],
  ["T1601.001", "Patch System Image", "Network Devices", "T1601"],
  ["T1601.002", "Downgrade System Image", "Network Devices", "T1601"],
  ["T1599", "Network Boundary Bridging", "Network Devices"],
  ["T1599.001", "Network Address Translation Traversal", "Network Devices", "T1599"],
  ["T1647", "Plist File Modification", "Cross-Platform"],
  ["T1690", "Prevent Command History Logging", "Cross-Platform"],
  ["T1207", "Rogue Domain Controller", "Windows"],
  ["T1688", "Safe Mode Boot", "Windows"],
  ["T1553", "Subvert Trust Controls", "Cross-Platform"],
  ["T1553.001", "Gatekeeper Bypass", "macOS", "T1553"],
  ["T1553.002", "Code Signing", "Cross-Platform", "T1553"],
  ["T1553.003", "SIP and Trust Provider Hijacking", "Cross-Platform", "T1553"],
  ["T1553.004", "Install Root Certificate", "Cross-Platform", "T1553"],
  ["T1553.005", "Mark-of-the-Web Bypass", "Windows", "T1553"],
  ["T1553.006", "Code Signing Policy Modification", "Cross-Platform", "T1553"],
  ["T1600", "Weaken Encryption", "Network Devices"],
  ["T1600.001", "Reduce Key Space", "Network Devices", "T1600"],
  ["T1600.002", "Disable Crypto Hardware", "Network Devices", "T1600"],
];

const DEFENSE_IMPAIRMENT_ENTRIES = DEFENSE_IMPAIRMENT_CATALOG.map(([id, name, platform, parentId]) =>
  defenseImpairmentEntry(id, name, platform, parentId),
);

const CREDENTIAL_ACCESS_CATALOG: Array<[string, string, Platform, string?]> = [
  ["T1557", "Adversary-in-the-Middle", "Cross-Platform"],
  ["T1557.001", "Name Resolution Poisoning and SMB Relay", "Windows", "T1557"],
  ["T1557.002", "ARP Cache Poisoning", "Cross-Platform", "T1557"],
  ["T1557.003", "DHCP Spoofing", "Cross-Platform", "T1557"],
  ["T1557.004", "Evil Twin", "Cross-Platform", "T1557"],
  ["T1110", "Brute Force", "Cross-Platform"],
  ["T1110.001", "Password Guessing", "Cross-Platform", "T1110"],
  ["T1110.002", "Password Cracking", "Cross-Platform", "T1110"],
  ["T1110.003", "Password Spraying", "Cross-Platform", "T1110"],
  ["T1110.004", "Credential Stuffing", "Cross-Platform", "T1110"],
  ["T1555", "Credentials from Password Stores", "Cross-Platform"],
  ["T1555.001", "Keychain", "macOS", "T1555"],
  ["T1555.002", "Securityd Memory", "macOS", "T1555"],
  ["T1555.003", "Credentials from Web Browsers", "Cross-Platform", "T1555"],
  ["T1555.004", "Windows Credential Manager", "Windows", "T1555"],
  ["T1555.005", "Password Managers", "Cross-Platform", "T1555"],
  ["T1555.006", "Cloud Secrets Management Stores", "Cross-Platform", "T1555"],
  ["T1212", "Exploitation for Credential Access", "Cross-Platform"],
  ["T1187", "Forced Authentication", "Cross-Platform"],
  ["T1606", "Forge Web Credentials", "Cross-Platform"],
  ["T1606.001", "Web Cookies", "Cross-Platform", "T1606"],
  ["T1606.002", "SAML Tokens", "Cross-Platform", "T1606"],
  ["T1056", "Input Capture", "Cross-Platform"],
  ["T1056.001", "Keylogging", "Cross-Platform", "T1056"],
  ["T1056.002", "GUI Input Capture", "Cross-Platform", "T1056"],
  ["T1056.003", "Web Portal Capture", "Cross-Platform", "T1056"],
  ["T1056.004", "Credential API Hooking", "Cross-Platform", "T1056"],
  ["T1111", "Multi-Factor Authentication Interception", "Cross-Platform"],
  ["T1621", "Multi-Factor Authentication Request Generation", "Cross-Platform"],
  ["T1040", "Network Sniffing", "Cross-Platform"],
  ["T1003", "OS Credential Dumping", "Cross-Platform"],
  ["T1003.001", "LSASS Memory", "Windows", "T1003"],
  ["T1003.002", "Security Account Manager", "Windows", "T1003"],
  ["T1003.003", "NTDS", "Windows", "T1003"],
  ["T1003.004", "LSA Secrets", "Windows", "T1003"],
  ["T1003.005", "Cached Domain Credentials", "Windows", "T1003"],
  ["T1003.006", "DCSync", "Windows", "T1003"],
  ["T1003.007", "Proc Filesystem", "Linux", "T1003"],
  ["T1003.008", "/etc/passwd and /etc/shadow", "Linux", "T1003"],
  ["T1528", "Steal Application Access Token", "Cross-Platform"],
  ["T1649", "Steal or Forge Authentication Certificates", "Cross-Platform"],
  ["T1558", "Steal or Forge Kerberos Tickets", "Windows"],
  ["T1558.001", "Golden Ticket", "Windows", "T1558"],
  ["T1558.002", "Silver Ticket", "Windows", "T1558"],
  ["T1558.003", "Kerberoasting", "Windows", "T1558"],
  ["T1558.004", "AS-REP Roasting", "Windows", "T1558"],
  ["T1558.005", "Ccache Files", "Linux", "T1558"],
  ["T1539", "Steal Web Session Cookie", "Cross-Platform"],
  ["T1552", "Unsecured Credentials", "Cross-Platform"],
  ["T1552.001", "Credentials In Files", "Cross-Platform", "T1552"],
  ["T1552.002", "Credentials in Registry", "Windows", "T1552"],
  ["T1552.003", "Shell History", "Cross-Platform", "T1552"],
  ["T1552.004", "Private Keys", "Cross-Platform", "T1552"],
  ["T1552.005", "Cloud Instance Metadata API", "Cross-Platform", "T1552"],
  ["T1552.006", "Group Policy Preferences", "Windows", "T1552"],
  ["T1552.007", "Container API", "Cross-Platform", "T1552"],
  ["T1552.008", "Chat Messages", "Cross-Platform", "T1552"],
];

const CREDENTIAL_ACCESS_ENTRIES = CREDENTIAL_ACCESS_CATALOG.map(([id, name, platform, parentId]) =>
  credentialAccessEntry(id, name, platform, parentId),
);

// The entries below are the remaining Enterprise Persistence objects in v19.2.
// Names and hierarchy follow MITRE's TA0003 tactic page; descriptions are deliberately
// concise but operational so the local reference remains usable without a remote feed.
const PERSISTENCE_ENTRIES: MitreDef[] = [
  persistenceEntry("T1547", "Boot or Logon Autostart Execution", "Cross-Platform"),
  persistenceEntry("T1037", "Boot or Logon Initialization Scripts", "Cross-Platform"),
  persistenceEntry("T1671", "Cloud Application Integration", "Cross-Platform"),
  persistenceEntry("T1554", "Compromise Host Software Binary", "Cross-Platform"),
  persistenceEntry("T1136", "Create Account", "Cross-Platform"),
  persistenceEntry("T1543", "Create or Modify System Process", "Cross-Platform"),
  persistenceEntry("T1668", "Exclusive Control", "Cross-Platform"),
  persistenceEntry("T1525", "Implant Internal Image", "Cross-Platform"),
  persistenceEntry("T1556", "Modify Authentication Process", "Cross-Platform"),
  persistenceEntry("T1137", "Office Application Startup", "Windows"),
  persistenceEntry("T1653", "Power Settings", "Cross-Platform"),
  persistenceEntry("T1542", "Pre-OS Boot", "Cross-Platform"),
  persistenceEntry("T1505", "Server Software Component", "Cross-Platform"),
  persistenceEntry("T1176", "Software Extensions", "Cross-Platform"),
  persistenceEntry("T1205", "Traffic Signaling", "Cross-Platform"),
  // T1053.003/.005, T1197, T1133, T1112 and T1078 are already declared above;
  // their secondary Persistence membership is represented by `tactics`.
  persistenceEntry("T1098.001", "Additional Cloud Credentials", "Cross-Platform", "T1098"),
  persistenceEntry("T1098.002", "Additional Email Delegate Permissions", "Cross-Platform", "T1098"),
  persistenceEntry("T1098.003", "Additional Cloud Roles", "Cross-Platform", "T1098"),
  persistenceEntry("T1098.004", "SSH Authorized Keys", "Linux", "T1098"),
  persistenceEntry("T1098.005", "Device Registration", "Cross-Platform", "T1098"),
  persistenceEntry("T1098.006", "Additional Container Cluster Roles", "Cross-Platform", "T1098"),
  persistenceEntry("T1098.007", "Additional Local or Domain Groups", "Cross-Platform", "T1098"),
  persistenceEntry("T1547.002", "Authentication Package", "Windows", "T1547"),
  persistenceEntry("T1547.003", "Time Providers", "Windows", "T1547"),
  persistenceEntry("T1547.004", "Winlogon Helper DLL", "Windows", "T1547"),
  persistenceEntry("T1547.005", "Security Support Provider", "Windows", "T1547"),
  persistenceEntry("T1547.006", "Kernel Modules and Extensions", "Cross-Platform", "T1547"),
  persistenceEntry("T1547.007", "Re-opened Applications", "Cross-Platform", "T1547"),
  persistenceEntry("T1547.008", "LSASS Driver", "Windows", "T1547"),
  persistenceEntry("T1547.009", "Shortcut Modification", "Cross-Platform", "T1547"),
  persistenceEntry("T1547.010", "Port Monitors", "Windows", "T1547"),
  persistenceEntry("T1547.012", "Print Processors", "Windows", "T1547"),
  persistenceEntry("T1547.013", "XDG Autostart Entries", "Linux", "T1547"),
  persistenceEntry("T1547.014", "Active Setup", "Windows", "T1547"),
  persistenceEntry("T1547.015", "Login Items", "Cross-Platform", "T1547"),
  persistenceEntry("T1037.001", "Logon Script (Windows)", "Windows", "T1037"),
  persistenceEntry("T1037.002", "Login Hook", "Cross-Platform", "T1037"),
  persistenceEntry("T1037.003", "Network Logon Script", "Windows", "T1037"),
  persistenceEntry("T1037.004", "RC Scripts", "Linux", "T1037"),
  persistenceEntry("T1037.005", "Startup Items", "Cross-Platform", "T1037"),
  persistenceEntry("T1136.001", "Local Account", "Cross-Platform", "T1136"),
  persistenceEntry("T1136.002", "Domain Account", "Windows", "T1136"),
  persistenceEntry("T1136.003", "Cloud Account", "Cross-Platform", "T1136"),
  persistenceEntry("T1543.001", "Launch Agent", "Cross-Platform", "T1543"),
  persistenceEntry("T1543.004", "Launch Daemon", "Cross-Platform", "T1543"),
  persistenceEntry("T1543.005", "Container Service", "Cross-Platform", "T1543"),
  persistenceEntry("T1546.001", "Change Default File Association", "Windows", "T1546"),
  persistenceEntry("T1546.002", "Screensaver", "Windows", "T1546"),
  persistenceEntry("T1546.003", "Windows Management Instrumentation Event Subscription", "Windows", "T1546"),
  persistenceEntry("T1546.004", "Unix Shell Configuration Modification", "Linux", "T1546"),
  persistenceEntry("T1546.005", "Trap", "Linux", "T1546"),
  persistenceEntry("T1546.006", "LC_LOAD_DYLIB Addition", "Cross-Platform", "T1546"),
  persistenceEntry("T1546.007", "Netsh Helper DLL", "Windows", "T1546"),
  persistenceEntry("T1546.008", "Accessibility Features", "Windows", "T1546"),
  persistenceEntry("T1546.009", "AppCert DLLs", "Windows", "T1546"),
  persistenceEntry("T1546.010", "AppInit DLLs", "Windows", "T1546"),
  persistenceEntry("T1546.011", "Application Shimming", "Windows", "T1546"),
  persistenceEntry("T1546.013", "PowerShell Profile", "Windows", "T1546"),
  persistenceEntry("T1546.014", "Emond", "Cross-Platform", "T1546"),
  persistenceEntry("T1546.015", "Component Object Model Hijacking", "Windows", "T1546"),
  persistenceEntry("T1546.016", "Installer Packages", "Cross-Platform", "T1546"),
  persistenceEntry("T1546.017", "Udev Rules", "Linux", "T1546"),
  persistenceEntry("T1556.001", "Domain Controller Authentication", "Windows", "T1556"),
  persistenceEntry("T1556.002", "Password Filter DLL", "Windows", "T1556"),
  persistenceEntry("T1556.003", "Pluggable Authentication Modules", "Linux", "T1556"),
  persistenceEntry("T1556.004", "Network Device Authentication", "Cross-Platform", "T1556"),
  persistenceEntry("T1556.005", "Reversible Encryption", "Windows", "T1556"),
  persistenceEntry("T1556.006", "Multi-Factor Authentication", "Cross-Platform", "T1556"),
  persistenceEntry("T1556.007", "Hybrid Identity", "Cross-Platform", "T1556"),
  persistenceEntry("T1556.008", "Network Provider DLL", "Windows", "T1556"),
  persistenceEntry("T1556.009", "Conditional Access Policies", "Cross-Platform", "T1556"),
  persistenceEntry("T1137.001", "Office Template Macros", "Windows", "T1137"),
  persistenceEntry("T1137.002", "Office Test", "Windows", "T1137"),
  persistenceEntry("T1137.003", "Outlook Forms", "Windows", "T1137"),
  persistenceEntry("T1137.004", "Outlook Home Page", "Windows", "T1137"),
  persistenceEntry("T1137.005", "Outlook Rules", "Windows", "T1137"),
  persistenceEntry("T1137.006", "Add-ins", "Windows", "T1137"),
  persistenceEntry("T1542.001", "System Firmware", "Cross-Platform", "T1542"),
  persistenceEntry("T1542.002", "Component Firmware", "Cross-Platform", "T1542"),
  persistenceEntry("T1542.003", "Bootkit", "Cross-Platform", "T1542"),
  persistenceEntry("T1542.004", "ROMMONkit", "Cross-Platform", "T1542"),
  persistenceEntry("T1542.005", "TFTP Boot", "Cross-Platform", "T1542"),
  persistenceEntry("T1505.001", "SQL Stored Procedures", "Cross-Platform", "T1505"),
  persistenceEntry("T1505.002", "Transport Agent", "Windows", "T1505"),
  persistenceEntry("T1505.004", "IIS Components", "Windows", "T1505"),
  persistenceEntry("T1505.005", "Terminal Services DLL", "Windows", "T1505"),
  persistenceEntry("T1505.006", "vSphere Installation Bundles", "Cross-Platform", "T1505"),
  persistenceEntry("T1176.001", "Browser Extensions", "Cross-Platform", "T1176"),
  persistenceEntry("T1176.002", "IDE Extensions", "Cross-Platform", "T1176"),
  persistenceEntry("T1205.001", "Port Knocking", "Cross-Platform", "T1205"),
  persistenceEntry("T1205.002", "Socket Filters", "Linux", "T1205"),
];

export const MITRE_DB: MitreDef[] = [
  // Initial Access
  { id: "T1566", tactic: "Initial Access", name: "Phishing", description: "Adversaries may send phishing messages to gain access to victim systems.", example: "Sending an email with a malicious macro-enabled Word document.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
  { id: "T1190", tactic: "Initial Access", name: "Exploit Public-Facing Application", description: "Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program using software exploits.", example: "Exploiting a vulnerability in a web server (e.g., Log4Shell).", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
  { id: "T1078", tactic: "Initial Access", tactics: ["Initial Access", "Persistence"], name: "Valid Accounts", description: "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access.", example: "Using leaked VPN credentials to log into the corporate network.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
  { id: "T1195", tactic: "Initial Access", name: "Supply Chain Compromise", description: "Adversaries may manipulate products or product delivery mechanisms prior to receipt.", example: "A trusted vendor update introduces a backdoor into the network.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },

  // Execution
  { id: "T1059.001", tactic: "Execution", name: "PowerShell", description: "Adversaries may abuse PowerShell commands and scripts for execution.", example: "Running a base64-encoded PowerShell script to download malware.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" },
  { id: "T1059.004", tactic: "Execution", name: "Unix Shell", description: "Adversaries may abuse Unix shell commands and scripts for execution.", example: "Executing a malicious bash script via curl or wget.", icon: Terminal, color: "text-[#00ff9c]", platform: "Linux" },
  { id: "T1047", tactic: "Execution", name: "Windows Management Instrumentation", description: "Adversaries may abuse WMI to execute malicious commands and payloads.", example: "Using wmic.exe process call create to launch a remote process.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" },
  { id: "T1204", tactic: "Execution", name: "User Execution", description: "Adversaries may rely on specific actions by a user in order to gain execution.", example: "A user double-clicks a malicious executable disguised as a PDF document.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" },

  // Persistence
  { id: "T1543.003", tactic: "Persistence", name: "Windows Service", description: "Adversaries may create or modify Windows services to repeatedly execute malicious payloads.", example: "Installing a malicious Windows Service to run persistently as SYSTEM.", icon: Anchor, color: "text-purple-400", platform: "Windows" },
  { id: "T1543.002", tactic: "Persistence", name: "Systemd Service", description: "Adversaries may create or modify systemd services to repeatedly execute malicious payloads.", example: "Creating a malicious systemd unit file in /etc/systemd/system/.", icon: Anchor, color: "text-purple-400", platform: "Linux" },
  { id: "T1547.001", tactic: "Persistence", name: "Registry Run Keys / Startup Folder", description: "Adversaries may configure system settings to automatically execute a program during system boot or logon.", example: "Adding a registry key to HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.", icon: Anchor, color: "text-purple-400", platform: "Windows" },
  { id: "T1505.003", tactic: "Persistence", name: "Web Shell", description: "Adversaries may backdoor web servers with web shells to establish persistent access.", example: "Uploading a PHP web shell to an Apache server directory.", icon: Anchor, color: "text-purple-400", platform: "Cross-Platform" },
  { id: "T1053.005", tactic: "Persistence", tactics: ["Persistence", "Execution"], name: "Scheduled Task", description: "Adversaries may abuse the Windows Task Scheduler to perform task scheduling.", example: "Creating a Scheduled Task to run a script daily.", icon: Anchor, color: "text-purple-400", platform: "Windows" },
  { id: "T1053.003", tactic: "Persistence", tactics: ["Persistence", "Execution"], name: "Cron", description: "Adversaries may abuse the cron utility to perform task scheduling for persistence.", example: "Adding an entry to /var/spool/cron/crontabs/root to run a reverse shell.", icon: Anchor, color: "text-purple-400", platform: "Linux" },

  // Privilege Escalation
  { id: "T1548.002", tactic: "Privilege Escalation", name: "Bypass User Account Control", description: "Adversaries may bypass UAC mechanisms to elevate process privileges on system.", example: "Bypassing UAC using mock folders or DLL hijacking.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Windows" },
  { id: "T1548.003", tactic: "Privilege Escalation", name: "Sudo and Sudo Caching", description: "Adversaries may perform sudo caching and/or use the sudoers file to elevate privileges.", example: "Using sudo to execute a binary that breaks out of restricted environments.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Linux" },
  { id: "T1055", tactic: "Privilege Escalation", name: "Process Injection", description: "Adversaries may inject code into processes in order to evade process-based defenses as well as possibly elevate privileges.", example: "Injecting shellcode into explorer.exe or svchost.exe.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Cross-Platform" },

  // Defense Evasion
  { id: "T1036", tactic: "Defense Evasion", name: "Masquerading", description: "Adversaries may attempt to manipulate features of their artifacts to make them appear legitimate or benign to users and/or security tools.", example: "Naming a malicious executable svchost.exe and running it from AppData.", icon: ShieldOff, color: "text-red-400", platform: "Cross-Platform" },
  { id: "T1562.001", tactic: "Defense Impairment", name: "Disable or Modify Tools", description: "Adversaries may impair defensive mechanisms by disabling or modifying security tools.", example: "Disabling Windows Defender or stopping the Sysmon service.", icon: ShieldOff, color: "text-red-400", platform: "Windows" },
  { id: "T1070.001", tactic: "Defense Evasion", name: "Clear Windows Event Logs", description: "Adversaries may clear Windows Event Logs to hide the activity of an intrusion.", example: "Clearing the Windows Security Event Logs using wevtutil cl Security.", icon: ShieldOff, color: "text-red-400", platform: "Windows" },
  { id: "T1070.002", tactic: "Defense Evasion", name: "Clear Linux or Mac System Logs", description: "Adversaries may clear system logs to hide the activity of an intrusion.", example: "Clearing or echoing an empty string into /var/log/auth.log.", icon: ShieldOff, color: "text-red-400", platform: "Linux" },
  { id: "T1070.003", tactic: "Defense Evasion", name: "Clear Command History", description: "Adversaries may clear the command history of a compromised account to hide the actions performed.", example: "Deleting the ~/.bash_history file or running history -c.", icon: ShieldOff, color: "text-red-400", platform: "Linux" },

  // Credential Access
  { id: "T1003.001", tactic: "Credential Access", name: "LSASS Memory", description: "Adversaries may attempt to access credential material stored in the process memory of the Local Security Authority Subsystem Service (LSASS).", example: "Dumping LSASS memory using Mimikatz or procdump to extract NTLM hashes.", icon: Key, color: "text-pink-500", platform: "Windows" },
  { id: "T1003.008", tactic: "Credential Access", name: "/etc/passwd and /etc/shadow", description: "Adversaries may attempt to access the /etc/passwd and /etc/shadow files to discover credentials.", example: "Reading /etc/shadow to crack user passwords offline.", icon: Key, color: "text-pink-500", platform: "Linux" },
  { id: "T1558", tactic: "Credential Access", name: "Steal or Forge Kerberos Tickets", description: "Adversaries may attempt to steal or forge Kerberos authentication tickets.", example: "Use the relevant sub-technique, such as T1558.003 for Kerberoasting.", icon: Key, color: "text-pink-500", platform: "Windows" },
  { id: "T1110", tactic: "Credential Access", name: "Brute Force", description: "Adversaries may use brute force techniques to attempt access to accounts when passwords are unknown.", example: "Password spraying common passwords across all SSH users or Active Directory accounts.", icon: Key, color: "text-pink-500", platform: "Cross-Platform" },
  { id: "T1555", tactic: "Credential Access", name: "Credentials from Password Stores", description: "Adversaries may search for common password storage locations to obtain user credentials.", example: "Extracting saved passwords from Google Chrome or Firefox databases.", icon: Key, color: "text-pink-500", platform: "Cross-Platform" },

  // Discovery
  { id: "T1016", tactic: "Discovery", name: "System Network Configuration Discovery", description: "Adversaries may look for details about the network configuration and settings.", example: "Running ipconfig /all or ip a to understand the local network.", icon: SearchIcon, color: "text-teal-400", platform: "Cross-Platform" },
  { id: "T1083", tactic: "Discovery", name: "File and Directory Discovery", description: "Adversaries may enumerate files and directories or search specific locations.", example: "Searching for documents containing the word 'confidential'.", icon: SearchIcon, color: "text-teal-400", platform: "Cross-Platform" },
  { id: "T1069.002", tactic: "Discovery", name: "Domain Groups", description: "Adversaries may attempt to find domain-level groups and permission settings.", example: "Querying LDAP to find all members of the Domain Admins group.", icon: SearchIcon, color: "text-teal-400", platform: "Windows" },

  // Lateral Movement
  { id: "T1021.001", tactic: "Lateral Movement", name: "Remote Desktop Protocol", description: "Adversaries may use Valid Accounts to log into a service specifically designed to accept remote connections via RDP.", example: "Using RDP to connect to a domain controller using stolen credentials.", icon: MoveHorizontal, color: "text-indigo-400", platform: "Windows" },
  { id: "T1021.004", tactic: "Lateral Movement", name: "SSH", description: "Adversaries may use Valid Accounts to log into remote machines using Secure Shell (SSH).", example: "Using SSH to pivot from a compromised web server to an internal database server.", icon: MoveHorizontal, color: "text-indigo-400", platform: "Linux" },
  { id: "T1550.002", tactic: "Lateral Movement", name: "Pass the Hash", description: "Adversaries may use stolen password hashes to bypass normal authentication.", example: "Performing a Pass-the-Hash (PtH) attack to authenticate using an NTLM hash.", icon: MoveHorizontal, color: "text-indigo-400", platform: "Windows" },

  // Collection
  { id: "T1560", tactic: "Collection", name: "Archive Collected Data", description: "Adversaries may compress and/or encrypt data that is collected prior to exfiltration.", example: "Compressing a folder of sensitive documents into a password-protected ZIP/tar file.", icon: Archive, color: "text-yellow-600", platform: "Cross-Platform" },

  // Command and Control
  { id: "T1071", tactic: "Command and Control", name: "Application Layer Protocol", description: "Adversaries may communicate using application layer protocols to avoid detection.", example: "Sending C2 beacons encapsulated within standard HTTP/HTTPS or DNS traffic.", icon: Radio, color: "text-orange-400", platform: "Cross-Platform" },
  { id: "T1105", tactic: "Command and Control", name: "Ingress Tool Transfer", description: "Adversaries may transfer tools or other files from an external system into a compromised environment.", example: "Downloading a post-exploitation framework via curl or wget.", icon: Radio, color: "text-orange-400", platform: "Cross-Platform" },

  // Exfiltration
  { id: "T1567", tactic: "Exfiltration", name: "Exfiltration Over Web Service", description: "Adversaries may use an existing, legitimate external Web service to exfiltrate data.", example: "Uploading stolen company databases to a MEGA or Dropbox account.", icon: UploadCloud, color: "text-cyan-400", platform: "Cross-Platform" },
  { id: "T1048", tactic: "Exfiltration", name: "Exfiltration Over Alternative Protocol", description: "Adversaries may steal data by exfiltrating it over a different protocol than that of the C2 channel.", example: "Exfiltrating sensitive files via ICMP packets or DNS TXT queries.", icon: UploadCloud, color: "text-cyan-400", platform: "Cross-Platform" },

  // Impact
  { id: "T1486", tactic: "Impact", name: "Data Encrypted for Impact", description: "Adversaries may encrypt data on target systems to interrupt availability.", example: "Deploying Ransomware that encrypts all files and leaves a ransom note.", icon: AlertTriangle, color: "text-red-600", platform: "Cross-Platform" },
  { id: "T1485", tactic: "Impact", name: "Data Destruction", description: "Adversaries may destroy data and files on specific systems.", example: "Using a wiper malware or permanently deleting financial databases.", icon: AlertTriangle, color: "text-red-600", platform: "Cross-Platform" },
  { id: "T1098", tactic: "Persistence", name: "Account Manipulation", description: "Adversaries may manipulate accounts to maintain or elevate access to victim systems.", example: "Adding an adversary-controlled credential or group membership to preserve access.", icon: AlertTriangle, color: "text-red-600", platform: "Cross-Platform" },
  { id: "T1558.003", tactic: "Credential Access", name: "Kerberoasting", description: "Adversaries may request service tickets and crack vulnerable service-account material offline.", example: "Requesting a TGS for an SPN and cracking the returned material offline.", icon: Key, color: "text-pink-500", platform: "Windows" },
  { id: "T1555.003", tactic: "Credential Access", name: "Credentials from Web Browsers", description: "Adversaries may search web-browser data stores for credentials.", example: "Searching browser credential stores on a compromised endpoint.", icon: Key, color: "text-pink-500", platform: "Cross-Platform" },
  { id: "T1135", tactic: "Discovery", name: "Network Share Discovery", description: "Adversaries may identify shared folders and drives on local or remote systems.", example: "Enumerating SMB shares before collection or lateral movement.", icon: SearchIcon, color: "text-teal-400", platform: "Cross-Platform" },
  { id: "T1070.004", tactic: "Defense Evasion", name: "File Deletion", description: "Adversaries may delete files to remove artifacts or tools.", example: "Deleting a dropped payload after execution.", icon: ShieldOff, color: "text-red-400", platform: "Cross-Platform" },
  { id: "T1059.003", tactic: "Execution", name: "Windows Command Shell", description: "Adversaries may abuse cmd.exe and its commands for execution.", example: "Launching a command through cmd.exe.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" },
  { id: "T1071.004", tactic: "Command and Control", name: "DNS", description: "Adversaries may communicate using DNS to avoid or blend with normal traffic.", example: "Embedding beacon data in DNS queries.", icon: Radio, color: "text-orange-400", platform: "Cross-Platform" },
  { id: "T1204.001", tactic: "Execution", name: "Malicious Link", description: "Adversaries may rely on a user clicking a malicious link to gain execution.", example: "A victim follows a link to a fake authentication page.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" },
  { id: "T1204.002", tactic: "Execution", name: "Malicious File", description: "Adversaries may rely on a user opening a malicious file to gain execution.", example: "A victim opens a weaponized document or executable.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" },
  { id: "T1566.001", tactic: "Initial Access", name: "Spearphishing Attachment", description: "Adversaries may send spearphishing emails with malicious attachments.", example: "Delivering a weaponized document as an email attachment.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
  { id: "T1566.002", tactic: "Initial Access", name: "Spearphishing Link", description: "Adversaries may send spearphishing messages containing malicious links.", example: "Sending a link to a credential-harvesting page.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
  { id: "T1003.002", tactic: "Credential Access", name: "Security Account Manager", description: "Adversaries may obtain credentials from the Security Account Manager database.", example: "Accessing the SAM database to obtain local account hashes.", icon: Key, color: "text-pink-500", platform: "Windows" },
  { id: "T1567.002", tactic: "Exfiltration", name: "Exfiltration to Cloud Storage", description: "Adversaries may exfiltrate data to a cloud storage service.", example: "Uploading collected archives to an external cloud-storage account.", icon: UploadCloud, color: "text-cyan-400", platform: "Cross-Platform" },
  { id: "T1204.004", tactic: "Execution", name: "Malicious Copy and Paste", description: "Adversaries may rely on a user copying and pasting malicious commands or content.", example: "Tricking a user into pasting a command into a shell.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" },
  { id: "T1595", tactic: "Reconnaissance", name: "Active Scanning", description: "Adversaries may execute active reconnaissance scans to gather information that can be used during targeting.", example: "Scanning public IP ranges for exposed services before an intrusion.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" },
  { id: "T1592", tactic: "Reconnaissance", name: "Gather Victim Host Information", description: "Adversaries may gather information about victim hosts that can be used during targeting.", example: "Profiling public host hardware, software, firmware and client configuration.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" },
  { id: "T1583.001", parentId: "T1583", tactic: "Resource Development", name: "Domains", description: "Adversaries may acquire domains that can be used during targeting.", example: "Registering a lookalike domain for phishing or command and control.", icon: Anchor, color: "text-violet-400", platform: "PRE" },
  { id: "T1588", tactic: "Resource Development", name: "Obtain Capabilities", description: "Adversaries may buy and/or steal capabilities that can be used during targeting.", example: "Acquiring malware, tools, certificates, exploits or vulnerability information.", icon: Key, color: "text-violet-400", platform: "PRE" },
  { id: "T1497", tactic: "Stealth", name: "Virtualization/Sandbox Evasion", description: "Adversaries may detect analysis environments and change or suppress malicious behavior.", example: "Checking for virtual-machine artifacts before executing the payload.", icon: ShieldOff, color: "text-red-300", platform: "Cross-Platform" },
  { id: "T1021.002", tactic: "Lateral Movement", name: "SMB/Windows Admin Shares", description: "Adversaries may use SMB and Windows administrative shares to move laterally or execute tools.", example: "Writing a payload to ADMIN$ or accessing a remote share with stolen credentials.", icon: MoveHorizontal, color: "text-indigo-400", platform: "Windows" },
  { id: "T1055.001", parentId: "T1055", tactic: "Privilege Escalation", name: "Dynamic-link Library Injection", description: "Adversaries may inject a dynamic-link library into a process to execute code in its context.", example: "Injecting a DLL into a trusted process to evade controls.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Windows" },
  { id: "T1055.002", parentId: "T1055", tactic: "Privilege Escalation", name: "Portable Executable Injection", description: "Adversaries may inject a portable executable image into a process.", example: "Reflectively loading a PE image into a running process.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Windows" },
  { id: "T1110.001", tactic: "Credential Access", name: "Password Guessing", description: "Adversaries may guess passwords to gain access to accounts.", example: "Trying a small set of likely passwords against an exposed service.", icon: Key, color: "text-pink-500", platform: "Cross-Platform" },
  { id: "T1110.003", tactic: "Credential Access", name: "Password Spraying", description: "Adversaries may use one or a few common passwords against many accounts.", example: "Testing a common password across a large set of user accounts.", icon: Key, color: "text-pink-500", platform: "Cross-Platform" },
  { id: "T1112", tactic: "Defense Evasion", tactics: ["Defense Evasion", "Persistence"], name: "Modify Registry", description: "Adversaries may interact with the Windows Registry to hide configuration or establish behavior.", example: "Changing a registry value to configure persistence or weaken controls.", icon: ShieldOff, color: "text-red-400", platform: "Windows" },
  { id: "T1568.002", tactic: "Command and Control", name: "Dynamic Resolution: Domain Generation Algorithms", description: "Adversaries may use algorithmically generated domains to dynamically locate command and control infrastructure.", example: "Generating pseudo-random domains for periodic beacon resolution.", icon: Radio, color: "text-orange-400", platform: "Cross-Platform" },
  { id: "T1570", tactic: "Lateral Movement", name: "Lateral Tool Transfer", description: "Adversaries may transfer tools or files between systems in a compromised environment.", example: "Copying a payload between hosts using SMB, SCP or a remote share.", icon: MoveHorizontal, color: "text-indigo-400", platform: "Cross-Platform" },
  { id: "T1546.012", tactic: "Persistence", name: "Image File Execution Options Injection", description: "Adversaries may abuse Image File Execution Options to execute code when a target application starts.", example: "Registering a debugger value for a commonly launched executable.", icon: Anchor, color: "text-purple-400", platform: "Windows" }
  ,{ id: "T1059.013", tactic: "Execution", name: "Container CLI/API", description: "Adversaries may abuse container command-line interfaces and APIs to execute commands or manage workloads.", example: "Using a container runtime or orchestration API to execute a command in a workload.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1213.006", tactic: "Collection", name: "Data from Information Repositories: Databases", description: "Adversaries may leverage databases to mine valuable information hosted on-premises or in the cloud.", example: "Querying a production database for credentials, customer data or sensitive records.", icon: Archive, color: "text-yellow-600", platform: "Cross-Platform" }
  ,{ id: "T1546.018", tactic: "Persistence", name: "Python Startup Hooks", description: "Adversaries may abuse .pth files, sitecustomize.py or usercustomize.py to execute code when Python starts.", example: "Placing an import statement in a site-packages .pth file to execute on interpreter startup.", icon: Anchor, color: "text-purple-400", platform: "Cross-Platform" }
  ,{ id: "T1677", tactic: "Execution", name: "Poisoned Pipeline Execution", description: "Adversaries may manipulate CI/CD processes by injecting malicious code into build workflows or referenced files.", example: "Modifying a workflow or build script to exfiltrate CI secrets or alter a released artifact.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1680", tactic: "Discovery", name: "Local Storage Discovery", description: "Adversaries may enumerate local storage, disks and volumes to profile a system or prepare follow-on activity.", example: "Enumerating disks and mounted volumes before targeting backups or encrypting data.", icon: SearchIcon, color: "text-teal-400", platform: "Cross-Platform" }
  ,{ id: "T1518.002", tactic: "Discovery", name: "Backup Software Discovery", description: "Adversaries may identify installed backup software and configurations to shape destruction or recovery-inhibition activity.", example: "Enumerating Veeam, Acronis or system backup services before ransomware deployment.", icon: SearchIcon, color: "text-teal-400", platform: "Cross-Platform" }
  ,{ id: "T1679", tactic: "Stealth", name: "Selective Exclusion", description: "Adversaries may exclude specific files, directories or system components from encryption or tampering to evade detection or preserve operations.", example: "Skipping security-tool paths and executable files during a destructive file operation.", icon: ShieldOff, color: "text-red-300", platform: "Windows" }
  ,{ id: "T1681", tactic: "Reconnaissance", name: "Search Threat Vendor Data", description: "Adversaries may search threat-intelligence sources for information about campaigns, victims and defensive responses.", example: "Using closed or open threat reports to refine targeting and change operational behavior.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1036.012", parentId: "T1036", tactic: "Stealth", name: "Browser Fingerprint", description: "Adversaries may spoof browser and system attributes to blend malicious traffic with legitimate user activity.", example: "A script sends a browser-like User-Agent inconsistent with its process lineage.", icon: ShieldOff, color: "text-red-300", platform: "Cross-Platform" }
  ,{ id: "T1686.002", parentId: "T1686", tactic: "Defense Impairment", name: "Network Device Firewall", description: "Adversaries may disable or modify network-device firewall rules to bypass controls or create paths for command and control.", example: "Adding an allow rule to a perimeter appliance from an unusual management session.", icon: ShieldOff, color: "text-red-400", platform: "Cross-Platform" }
  ,{ id: "T1686.003", parentId: "T1686", tactic: "Defense Impairment", name: "Windows Host Firewall", description: "Adversaries may disable or modify Windows host firewall profiles and rules.", example: "Adding a Windows Firewall rule to expose a remote service during an intrusion.", icon: ShieldOff, color: "text-red-400", platform: "Windows" }
  ,{ id: "T1204.005", parentId: "T1204", tactic: "Execution", name: "Malicious Library", description: "Adversaries may rely on a user installing a malicious library to facilitate execution.", example: "A typosquatted npm or PyPI package runs a loader during installation.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1059", tactic: "Execution", name: "Command and Scripting Interpreter", description: "Adversaries may abuse command and scripting interpreters to execute commands, scripts and payloads.", example: "Selecting the interpreter that matches the process and script evidence.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1518", tactic: "Discovery", name: "Software Discovery", description: "Adversaries may attempt to get a listing of software and software versions installed on a system or in a cloud environment.", example: "Inventorying installed backup and security software before follow-on activity.", icon: SearchIcon, color: "text-teal-400", platform: "Cross-Platform" }
  ,{ id: "T1546", tactic: "Persistence", name: "Event Triggered Execution", description: "Adversaries may establish persistence or privilege escalation by executing malicious code when a defined event occurs.", example: "Abusing a startup hook or application event to load attacker-controlled code.", icon: Anchor, color: "text-purple-400", platform: "Cross-Platform" }
  ,{ id: "T1686", tactic: "Defense Impairment", name: "Disable or Modify System Firewall", description: "Adversaries may disable or modify system firewall controls to weaken network defenses.", example: "Changing host or network-device firewall rules to expose a service.", icon: ShieldOff, color: "text-red-400", platform: "Cross-Platform" }
  ,{ id: "T1213", tactic: "Collection", name: "Data from Information Repositories", description: "Adversaries may leverage information repositories to mine valuable data.", example: "Querying a database or shared repository for sensitive records.", icon: Archive, color: "text-yellow-600", platform: "Cross-Platform" }
  ,{ id: "T1003", tactic: "Credential Access", name: "OS Credential Dumping", description: "Adversaries may attempt to dump credentials to obtain account and authentication material.", example: "Selecting the credential-dumping sub-technique that matches the artifact.", icon: Key, color: "text-pink-500", platform: "Cross-Platform" }
  ,{ id: "T1021", tactic: "Lateral Movement", name: "Remote Services", description: "Adversaries may use valid accounts to log into remote services and move laterally.", example: "Correlating remote service authentication with host and network telemetry.", icon: MoveHorizontal, color: "text-indigo-400", platform: "Cross-Platform" }
  // Reconnaissance (TA0043), Enterprise ATT&CK v19.2. Source: MITRE tactic page.
  ,{ id: "T1589", tactic: "Reconnaissance", name: "Gather Victim Identity Information", description: "Adversaries may gather information about victim identities that can be used during targeting.", example: "Collecting public employee names, email addresses or exposed credentials before a lure.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1590", tactic: "Reconnaissance", name: "Gather Victim Network Information", description: "Adversaries may gather information about victim networks that can be used during targeting.", example: "Mapping domains, IP ranges, DNS, topology and network security appliances.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1591", tactic: "Reconnaissance", name: "Gather Victim Org Information", description: "Adversaries may gather information about a victim organization that can be used during targeting.", example: "Profiling departments, business relationships, locations and operational roles.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1598", tactic: "Reconnaissance", name: "Phishing for Information", description: "Adversaries may send phishing messages to elicit sensitive information for targeting.", example: "Using a convincing service, attachment, link or voice pretext to obtain information.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1682", tactic: "Reconnaissance", name: "Query Public AI Services", description: "Adversaries may query publicly accessible AI services to support targeting and operations.", example: "Using a public AI service to aggregate information about an organization or its personnel.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1597", tactic: "Reconnaissance", name: "Search Closed Sources", description: "Adversaries may search closed, paid or private sources for information about victims.", example: "Using a paid intelligence feed or illicit marketplace to obtain targeting data.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1596", tactic: "Reconnaissance", name: "Search Open Technical Databases", description: "Adversaries may search freely available technical databases for information about victims.", example: "Querying WHOIS, certificate, passive DNS or scan databases for exposed infrastructure.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1593", tactic: "Reconnaissance", name: "Search Open Websites/Domains", description: "Adversaries may search freely available websites and domains for information about victims.", example: "Mining social media, search engines and public code repositories for targeting data.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1594", tactic: "Reconnaissance", name: "Search Victim-Owned Websites", description: "Adversaries may search websites owned by the victim for information used during targeting.", example: "Reviewing offices, departments, staff roles and technology clues on public websites.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1592.001", parentId: "T1592", tactic: "Reconnaissance", name: "Hardware", description: "Adversaries may gather information about victim host hardware used during targeting.", example: "Identifying host types, versions and defensive hardware components.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1592.002", parentId: "T1592", tactic: "Reconnaissance", name: "Software", description: "Adversaries may gather information about software installed on victim hosts.", example: "Identifying operating systems, applications and security products by version.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1592.003", parentId: "T1592", tactic: "Reconnaissance", name: "Firmware", description: "Adversaries may gather information about firmware on victim hosts.", example: "Profiling firmware type and version to infer host configuration or patch level.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1592.004", parentId: "T1592", tactic: "Reconnaissance", name: "Client Configurations", description: "Adversaries may gather information about victim client configurations.", example: "Inferring operating system, architecture, language, virtualization or time zone.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1589.001", parentId: "T1589", tactic: "Reconnaissance", name: "Credentials", description: "Adversaries may gather credentials that can be used during targeting.", example: "Finding exposed credentials associated with a target organization or reused personal account.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1589.002", parentId: "T1589", tactic: "Reconnaissance", name: "Email Addresses", description: "Adversaries may gather email addresses that can be used during targeting.", example: "Building a target list from public staff pages and published contact details.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1589.003", parentId: "T1589", tactic: "Reconnaissance", name: "Employee Names", description: "Adversaries may gather employee names that can guide reconnaissance and lures.", example: "Deriving likely account naming conventions from public employee names.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1590.001", parentId: "T1590", tactic: "Reconnaissance", name: "Domain Properties", description: "Adversaries may gather information about victim domains and their administrative properties.", example: "Collecting registrar, name server, contact and ownership information.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1590.002", parentId: "T1590", tactic: "Reconnaissance", name: "DNS", description: "Adversaries may gather DNS data about a victim and its infrastructure.", example: "Reviewing MX, TXT, SPF, NS and subdomain records to identify providers and hosts.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1590.003", parentId: "T1590", tactic: "Reconnaissance", name: "Network Trust Dependencies", description: "Adversaries may gather information about organizations and domains with network trust dependencies.", example: "Identifying managed service providers, contractors and connected third parties.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1590.004", parentId: "T1590", tactic: "Reconnaissance", name: "Network Topology", description: "Adversaries may gather information about the physical or logical arrangement of victim networks.", example: "Inferring gateways, routers and external-to-internal network relationships.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1590.005", parentId: "T1590", tactic: "Reconnaissance", name: "IP Addresses", description: "Adversaries may gather victim IP addresses and their assignments.", example: "Enumerating public address space to identify active hosts and hosting providers.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1590.006", parentId: "T1590", tactic: "Reconnaissance", name: "Network Security Appliances", description: "Adversaries may gather information about victim firewalls, filters, proxies and other security appliances.", example: "Fingerprinting a perimeter firewall or bastion host from exposed services and banners.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1591.001", parentId: "T1591", tactic: "Reconnaissance", name: "Determine Physical Locations", description: "Adversaries may gather the physical locations of victim resources and infrastructure.", example: "Identifying offices, data centers or facilities relevant to targeting.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1591.002", parentId: "T1591", tactic: "Reconnaissance", name: "Business Relationships", description: "Adversaries may gather information about victim business relationships and supply chains.", example: "Profiling suppliers, partners, contractors or managed service providers.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1591.003", parentId: "T1591", tactic: "Reconnaissance", name: "Identify Business Tempo", description: "Adversaries may gather information about the victim's operational tempo.", example: "Learning operating hours, purchase cycles or shipment schedules to time activity.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1591.004", parentId: "T1591", tactic: "Reconnaissance", name: "Identify Roles", description: "Adversaries may gather information about roles and responsibilities inside a victim organization.", example: "Finding personnel who control sensitive systems, data or approvals.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1598.001", parentId: "T1598", tactic: "Reconnaissance", name: "Spearphishing Service", description: "Adversaries may use third-party services to send spearphishing messages seeking information.", example: "Using a hosted form or messaging platform to collect target information.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1598.002", parentId: "T1598", tactic: "Reconnaissance", name: "Spearphishing Attachment", description: "Adversaries may use an attachment to elicit sensitive information.", example: "Sending a document that requests credentials or other actionable details.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1598.003", parentId: "T1598", tactic: "Reconnaissance", name: "Spearphishing Link", description: "Adversaries may use a link in a spearphishing message to elicit sensitive information.", example: "Directing a target to a lookalike portal or collection form.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1598.004", parentId: "T1598", tactic: "Reconnaissance", name: "Spearphishing Voice", description: "Adversaries may use voice communications to elicit sensitive information.", example: "Impersonating a trusted caller to request account or operational details.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1597.001", parentId: "T1597", tactic: "Reconnaissance", name: "Threat Intel Vendors", description: "Adversaries may search private threat intelligence vendor data for information used during targeting.", example: "Reviewing paid reporting about victims, campaigns, indicators and defensive responses.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1597.002", parentId: "T1597", tactic: "Reconnaissance", name: "Purchase Technical Data", description: "Adversaries may purchase technical information about victims.", example: "Buying scan results, infrastructure data or aggregated technical records.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1596.001", parentId: "T1596", tactic: "Reconnaissance", name: "DNS/Passive DNS", description: "Adversaries may search DNS and passive DNS data for information about victims.", example: "Enumerating historical DNS resolutions and names associated with a domain.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1596.002", parentId: "T1596", tactic: "Reconnaissance", name: "WHOIS", description: "Adversaries may search public WHOIS data for information about victims.", example: "Reviewing registration, registrar, contact and name server records.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1596.003", parentId: "T1596", tactic: "Reconnaissance", name: "Digital Certificates", description: "Adversaries may search public certificate data for information about victims.", example: "Finding subdomains and organization names in publicly logged TLS certificates.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1596.004", parentId: "T1596", tactic: "Reconnaissance", name: "CDNs", description: "Adversaries may search CDN data about victims.", example: "Using CDN metadata and edge information to identify hosted assets and providers.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1596.005", parentId: "T1596", tactic: "Reconnaissance", name: "Scan Databases", description: "Adversaries may search public scan databases for information about victims.", example: "Reviewing indexed ports, banners, certificates and exposed services.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1593.001", parentId: "T1593", tactic: "Reconnaissance", name: "Social Media", description: "Adversaries may search social media for information about victims.", example: "Collecting public announcements, personnel details and organizational interests.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1593.002", parentId: "T1593", tactic: "Reconnaissance", name: "Search Engines", description: "Adversaries may use search engines to collect information about victims.", example: "Using targeted queries to locate indexed files, hosts, documents or staff pages.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1593.003", parentId: "T1593", tactic: "Reconnaissance", name: "Code Repositories", description: "Adversaries may search public code repositories for information about victims.", example: "Reviewing public repositories for infrastructure details, credentials or build configuration.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1595.001", parentId: "T1595", tactic: "Reconnaissance", name: "Scanning IP Blocks", description: "Adversaries may scan victim IP blocks to gather information used during targeting.", example: "Probing sequential public addresses to identify active hosts and exposed services.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1595.002", parentId: "T1595", tactic: "Reconnaissance", name: "Vulnerability Scanning", description: "Adversaries may scan victims for vulnerabilities that can be used during targeting.", example: "Checking exposed software versions and configurations against known weaknesses.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  ,{ id: "T1595.003", parentId: "T1595", tactic: "Reconnaissance", name: "Wordlist Scanning", description: "Adversaries may iteratively probe infrastructure with brute-force and crawling techniques to identify content and infrastructure.", example: "Testing common paths, filenames and extensions to discover hidden web content.", icon: SearchIcon, color: "text-sky-400", platform: "PRE" }
  // Resource Development (TA0042), Enterprise ATT&CK v19.2. Source: MITRE tactic page.
  ,{ id: "T1650", tactic: "Resource Development", name: "Acquire Access", description: "Adversaries may purchase or otherwise acquire existing access to a target system or network.", example: "Obtaining access through an initial access broker before beginning an operation.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583", tactic: "Resource Development", name: "Acquire Infrastructure", description: "Adversaries may buy, lease, rent or obtain infrastructure used during targeting.", example: "Provisioning domains, cloud servers, web services or serverless infrastructure.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1586", tactic: "Resource Development", name: "Compromise Accounts", description: "Adversaries may compromise accounts with services that can be used during targeting.", example: "Taking over an existing social media, email or cloud account to abuse its trust.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584", tactic: "Resource Development", name: "Compromise Infrastructure", description: "Adversaries may compromise third-party infrastructure that can be used during targeting.", example: "Taking over a server, web service, network device or botnet for operational use.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1587", tactic: "Resource Development", name: "Develop Capabilities", description: "Adversaries may build capabilities that can be used during targeting.", example: "Developing malware, exploits or certificates in-house.", icon: Terminal, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1585", tactic: "Resource Development", name: "Establish Accounts", description: "Adversaries may create and cultivate accounts with services that can be used during targeting.", example: "Creating social, email or cloud accounts to build a credible operational persona.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1683", tactic: "Resource Development", name: "Generate Content", description: "Adversaries may create or generate content to support targeting and operations.", example: "Producing written or audio-visual material for personas, lures or influence activity.", icon: Terminal, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1608", tactic: "Resource Development", name: "Stage Capabilities", description: "Adversaries may upload, install or otherwise set up capabilities used during targeting.", example: "Staging malware, tools, certificates or link targets on controlled infrastructure.", icon: UploadCloud, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583.002", parentId: "T1583", tactic: "Resource Development", name: "DNS Server", description: "Adversaries may set up their own DNS servers used during targeting.", example: "Operating an authoritative DNS server to support infrastructure or command and control.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583.003", parentId: "T1583", tactic: "Resource Development", name: "Virtual Private Server", description: "Adversaries may rent virtual private servers used during targeting.", example: "Renting a VPS to host tooling or operational services and rapidly replace it.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583.004", parentId: "T1583", tactic: "Resource Development", name: "Server", description: "Adversaries may buy, lease, rent or obtain physical servers used during targeting.", example: "Obtaining a dedicated server for staging or launching operations.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583.005", parentId: "T1583", tactic: "Resource Development", name: "Botnet", description: "Adversaries may buy, lease or rent a network of compromised systems used during targeting.", example: "Subscribing to a botnet service for coordinated scanning or delivery activity.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583.006", parentId: "T1583", tactic: "Resource Development", name: "Web Services", description: "Adversaries may register for web services used during targeting.", example: "Registering a common file, messaging or code-hosting service to blend into expected traffic.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583.007", parentId: "T1583", tactic: "Resource Development", name: "Serverless", description: "Adversaries may purchase and configure serverless cloud infrastructure used during targeting.", example: "Deploying a Cloudflare Worker or cloud function as disposable infrastructure.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1583.008", parentId: "T1583", tactic: "Resource Development", name: "Malvertising", description: "Adversaries may purchase online advertisements to distribute malware to victims.", example: "Buying a sponsored search placement that redirects users to a malicious payload.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1586.001", parentId: "T1586", tactic: "Resource Development", name: "Social Media Accounts", description: "Adversaries may compromise social media accounts used during targeting.", example: "Taking over a trusted profile to send convincing messages to its contacts.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1586.002", parentId: "T1586", tactic: "Resource Development", name: "Email Accounts", description: "Adversaries may compromise email accounts used during targeting.", example: "Using a compromised mailbox to send phishing or acquire related infrastructure.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1586.003", parentId: "T1586", tactic: "Resource Development", name: "Cloud Accounts", description: "Adversaries may compromise cloud accounts used during targeting.", example: "Using a compromised cloud account to provision infrastructure or host data.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.001", parentId: "T1584", tactic: "Resource Development", name: "Domains", description: "Adversaries may hijack domains or subdomains used during targeting.", example: "Taking control of a domain registration or DNS management account.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.002", parentId: "T1584", tactic: "Resource Development", name: "DNS Server", description: "Adversaries may compromise third-party DNS servers used during targeting.", example: "Compromising a DNS server and using it to support operational traffic.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.003", parentId: "T1584", tactic: "Resource Development", name: "Virtual Private Server", description: "Adversaries may compromise third-party virtual private servers used during targeting.", example: "Taking over a VPS belonging to another party and repurposing it.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.004", parentId: "T1584", tactic: "Resource Development", name: "Server", description: "Adversaries may compromise third-party servers used during targeting.", example: "Using a compromised web server as staging or command infrastructure.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.005", parentId: "T1584", tactic: "Resource Development", name: "Botnet", description: "Adversaries may compromise third-party systems to form or take over a botnet used during targeting.", example: "Redirecting compromised devices to infrastructure controlled by the adversary.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.006", parentId: "T1584", tactic: "Resource Development", name: "Web Services", description: "Adversaries may compromise access to third-party web services used during targeting.", example: "Taking over a legitimate service account and using it as operational infrastructure.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.007", parentId: "T1584", tactic: "Resource Development", name: "Serverless", description: "Adversaries may compromise serverless cloud infrastructure used during targeting.", example: "Abusing a compromised cloud function as a disposable endpoint.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1584.008", parentId: "T1584", tactic: "Resource Development", name: "Network Devices", description: "Adversaries may compromise third-party network devices used during targeting.", example: "Taking over a SOHO router to support follow-on targeting activity.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1587.001", parentId: "T1587", tactic: "Resource Development", name: "Malware", description: "Adversaries may develop malware and malware components used during targeting.", example: "Building a payload, dropper, backdoor, packer or custom command protocol.", icon: Terminal, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1587.002", parentId: "T1587", tactic: "Resource Development", name: "Code Signing Certificates", description: "Adversaries may create self-signed code signing certificates used during targeting.", example: "Signing a tool with a self-created certificate to appear more legitimate.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1587.003", parentId: "T1587", tactic: "Resource Development", name: "Digital Certificates", description: "Adversaries may create self-signed SSL/TLS certificates used during targeting.", example: "Creating a self-signed certificate for an adversary-controlled service.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1587.004", parentId: "T1587", tactic: "Resource Development", name: "Exploits", description: "Adversaries may develop exploits used during targeting.", example: "Developing an exploit after fuzzing or patch analysis identifies a vulnerability.", icon: Terminal, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1585.001", parentId: "T1585", tactic: "Resource Development", name: "Social Media Accounts", description: "Adversaries may create and cultivate social media accounts used during targeting.", example: "Growing a credible persona before contacting targets.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1585.002", parentId: "T1585", tactic: "Resource Development", name: "Email Accounts", description: "Adversaries may create email accounts used during targeting.", example: "Creating throwaway mailboxes for phishing or infrastructure registration.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1585.003", parentId: "T1585", tactic: "Resource Development", name: "Cloud Accounts", description: "Adversaries may create cloud accounts used during targeting.", example: "Opening a cloud account to provision storage, VPS or serverless infrastructure.", icon: Anchor, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1683.001", parentId: "T1683", tactic: "Resource Development", name: "Written Content", description: "Adversaries may create or tailor written materials to support targeting and malicious operations.", example: "Producing a phishing lure, fake job posting or fabricated persona history.", icon: Terminal, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1683.002", parentId: "T1683", tactic: "Resource Development", name: "Audio-Visual Content", description: "Adversaries may create or manipulate audio, images and video to support targeting.", example: "Creating synthetic voice or profile imagery for impersonation.", icon: Terminal, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1588.001", parentId: "T1588", tactic: "Resource Development", name: "Malware", description: "Adversaries may buy, steal or download malware used during targeting.", example: "Obtaining a ready-made payload or backdoor from an underground source.", icon: Key, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1588.002", parentId: "T1588", tactic: "Resource Development", name: "Tool", description: "Adversaries may buy, steal or download software tools used during targeting.", example: "Acquiring a legitimate administration utility for malicious use.", icon: Key, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1588.003", parentId: "T1588", tactic: "Resource Development", name: "Code Signing Certificates", description: "Adversaries may buy or steal code signing certificates used during targeting.", example: "Using a stolen certificate to sign a malicious executable.", icon: Key, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1588.004", parentId: "T1588", tactic: "Resource Development", name: "Digital Certificates", description: "Adversaries may buy or steal SSL/TLS certificates used during targeting.", example: "Obtaining a certificate to make an adversary-controlled service appear trusted.", icon: Key, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1588.005", parentId: "T1588", tactic: "Resource Development", name: "Exploits", description: "Adversaries may buy, steal or download exploits used during targeting.", example: "Obtaining a public or private exploit for a known vulnerability.", icon: Key, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1588.006", parentId: "T1588", tactic: "Resource Development", name: "Vulnerabilities", description: "Adversaries may acquire vulnerability information used during targeting.", example: "Obtaining vulnerability details from an open or closed database.", icon: Key, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1588.007", parentId: "T1588", tactic: "Resource Development", name: "Artificial Intelligence", description: "Adversaries may obtain access to generative AI tools used during targeting.", example: "Using an AI service to assist reconnaissance, social engineering or payload development.", icon: Key, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1608.001", parentId: "T1608", tactic: "Resource Development", name: "Upload Malware", description: "Adversaries may upload malware to infrastructure under their control or to third-party infrastructure.", example: "Hosting a payload on an internet-accessible server for later delivery.", icon: UploadCloud, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1608.002", parentId: "T1608", tactic: "Resource Development", name: "Upload Tool", description: "Adversaries may upload tools to infrastructure so they are accessible during targeting.", example: "Placing an administration tool on a web server for later transfer.", icon: UploadCloud, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1608.003", parentId: "T1608", tactic: "Resource Development", name: "Install Digital Certificate", description: "Adversaries may install SSL/TLS certificates used during targeting.", example: "Installing a certificate on a server configured to host an operational service.", icon: UploadCloud, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1608.004", parentId: "T1608", tactic: "Resource Development", name: "Drive-by Target", description: "Adversaries may prepare an operational environment to infect systems that visit a website.", example: "Staging a site and exploit chain for visitors who browse to it.", icon: UploadCloud, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1608.005", parentId: "T1608", tactic: "Resource Development", name: "Link Target", description: "Adversaries may put resources in place that are referenced by a targeting link.", example: "Preparing a credential collection page before sending a spearphishing link.", icon: UploadCloud, color: "text-violet-400", platform: "PRE" }
  ,{ id: "T1608.006", parentId: "T1608", tactic: "Resource Development", name: "SEO Poisoning", description: "Adversaries may poison search-engine optimization mechanisms to direct victims toward staged capabilities.", example: "Manipulating ranking or advertisements so a malicious download appears in search results.", icon: UploadCloud, color: "text-violet-400", platform: "PRE" }
  // Initial Access (TA0001), Enterprise ATT&CK v19.2. Source: MITRE tactic page.
  ,{ id: "T1659", tactic: "Initial Access", name: "Content Injection", description: "Adversaries may gain access by injecting malicious content into systems through online network traffic or compromised data-transfer channels.", example: "Manipulating a compromised content channel to deliver attacker-controlled content to users.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1189", tactic: "Initial Access", name: "Drive-by Compromise", description: "Adversaries may gain access to a system through a user visiting a website during normal browsing.", example: "A target visits a compromised or malicious site and the browser is exploited.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1133", tactic: "Initial Access", tactics: ["Initial Access", "Persistence"], name: "External Remote Services", description: "Adversaries may leverage external-facing remote services to initially access or persist within a network.", example: "Using a compromised VPN, Citrix, VNC or WinRM account to enter the environment.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1200", tactic: "Initial Access", name: "Hardware Additions", description: "Adversaries may physically introduce computer accessories, networking hardware or other devices into a system or network to gain access.", example: "Connecting an unauthorized device or implant to a trusted network or workstation.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1091", tactic: "Initial Access", name: "Replication Through Removable Media", description: "Adversaries may move onto systems by copying malware to removable media and executing it when the media is used.", example: "Using a prepared USB device to introduce malware into a disconnected network.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1199", tactic: "Initial Access", name: "Trusted Relationship", description: "Adversaries may breach or leverage an organization that has access to intended victims.", example: "Abusing a compromised supplier, contractor or managed service provider connection.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1669", tactic: "Initial Access", name: "Wi-Fi Networks", description: "Adversaries may gain initial access by connecting to wireless networks near the target.", example: "Connecting through an exposed or compromised organization Wi-Fi network from nearby.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1566.003", parentId: "T1566", tactic: "Initial Access", name: "Spearphishing via Service", description: "Adversaries may send spearphishing messages through third-party services to gain access to victim systems.", example: "Sending a malicious message through a collaboration or social platform instead of enterprise email.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1566.004", parentId: "T1566", tactic: "Initial Access", name: "Spearphishing Voice", description: "Adversaries may use voice communications to manipulate a user into providing access to systems.", example: "Impersonating a trusted caller and directing a victim to install software or disclose access details.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1195.001", parentId: "T1195", tactic: "Initial Access", name: "Compromise Software Dependencies and Development Tools", description: "Adversaries may manipulate software dependencies and development tools before delivery to the final consumer.", example: "Publishing a typosquatted package that executes code when installed by a downstream project.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1195.002", parentId: "T1195", tactic: "Initial Access", name: "Compromise Software Supply Chain", description: "Adversaries may manipulate application software before delivery to the final consumer.", example: "Replacing a trusted release or altering its update and distribution mechanism.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1195.003", parentId: "T1195", tactic: "Initial Access", name: "Compromise Hardware Supply Chain", description: "Adversaries may manipulate hardware components before delivery to the final consumer.", example: "Introducing a hardware or firmware backdoor into a server, device or peripheral.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1078.001", parentId: "T1078", tactic: "Initial Access", tactics: ["Initial Access", "Persistence"], name: "Default Accounts", description: "Adversaries may obtain and abuse credentials of default accounts to gain access.", example: "Using an unchanged vendor, appliance, cloud or Kubernetes default account.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1078.002", parentId: "T1078", tactic: "Initial Access", tactics: ["Initial Access", "Persistence"], name: "Domain Accounts", description: "Adversaries may obtain and abuse credentials of accounts managed by Active Directory Domain Services.", example: "Using compromised domain-user credentials to access a VPN or internal service.", icon: LogIn, color: "text-blue-400", platform: "Windows" }
  ,{ id: "T1078.003", parentId: "T1078", tactic: "Initial Access", tactics: ["Initial Access", "Persistence"], name: "Local Accounts", description: "Adversaries may obtain and abuse credentials of accounts configured on a single system or service.", example: "Using a compromised local administrator account to access an exposed service.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  ,{ id: "T1078.004", parentId: "T1078", tactic: "Initial Access", tactics: ["Initial Access", "Persistence"], name: "Cloud Accounts", description: "Adversaries may abuse valid accounts in cloud environments to gain access or maintain control.", example: "Using stolen cloud credentials to access a SaaS tenant or cloud-hosted resource.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" }
  // Execution (TA0002), Enterprise ATT&CK v19.2. Source: MITRE tactic page.
  ,{ id: "T1197", tactic: "Execution", tactics: ["Execution", "Persistence"], name: "BITS Jobs", description: "Adversaries may abuse BITS jobs to persistently execute code and perform background tasks.", example: "Creating a BITS job that transfers a payload and invokes a command on completion.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1651", tactic: "Execution", name: "Cloud Administration Command", description: "Adversaries may abuse cloud management services to execute commands within virtual machines.", example: "Using AWS Systems Manager Run Command or Azure RunCommand to run a script on a VM.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1609", tactic: "Execution", name: "Container Administration Command", description: "Adversaries may abuse container administration services to execute commands within a container.", example: "Using the Kubernetes API or Docker daemon to execute a command in a workload.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1610", tactic: "Execution", name: "Deploy Container", description: "Adversaries may deploy a container to facilitate execution or evade defenses.", example: "Deploying a privileged container with an image that runs an attacker-controlled process.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1675", tactic: "Execution", name: "ESXi Administration Command", description: "Adversaries may abuse ESXi administration services to execute commands on guest machines.", example: "Using ESXi management functionality to run a command through VMware Tools on a guest.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1203", tactic: "Execution", name: "Exploitation for Client Execution", description: "Adversaries may exploit vulnerabilities in client applications to execute code.", example: "Triggering a browser or document-reader vulnerability with a crafted file or page.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1574", tactic: "Execution", name: "Hijack Execution Flow", description: "Adversaries may execute malicious payloads by hijacking how operating systems run programs.", example: "Placing a malicious DLL where a trusted application loads it first.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1674", tactic: "Execution", name: "Input Injection", description: "Adversaries may simulate keystrokes or other input to launch commands or interact with applications.", example: "Using simulated keyboard input to open a shell and paste a command.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1559", tactic: "Execution", name: "Inter-Process Communication", description: "Adversaries may abuse inter-process communication mechanisms for local code or command execution.", example: "Abusing a COM or DDE channel to make a trusted process execute a command.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1106", tactic: "Execution", name: "Native API", description: "Adversaries may interact with the native operating-system API to execute behaviors.", example: "Calling low-level Windows or Linux APIs to create a process without a shell.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1053", tactic: "Execution", tactics: ["Execution", "Persistence"], name: "Scheduled Task/Job", description: "Adversaries may abuse task scheduling functionality to facilitate initial or recurring execution.", example: "Scheduling a task, cron job or systemd timer to run an attacker-controlled script.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1648", tactic: "Execution", name: "Serverless Execution", description: "Adversaries may abuse serverless computing, integration and automation services to execute code in cloud environments.", example: "Uploading a cloud function that runs attacker-controlled code when invoked.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1129", tactic: "Execution", name: "Shared Modules", description: "Adversaries may execute malicious payloads by loading shared modules into processes.", example: "Loading a malicious shared library or DLL through a legitimate application.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1072", tactic: "Execution", name: "Software Deployment Tools", description: "Adversaries may abuse centralized software deployment tools to execute commands across an enterprise or cloud environment.", example: "Using SCCM, Intune or AWS Systems Manager to deploy an unauthorized script.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1569", tactic: "Execution", name: "System Services", description: "Adversaries may abuse system services or daemons to execute commands or programs.", example: "Starting a Windows service or invoking systemctl to launch a payload.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1127", tactic: "Execution", name: "Trusted Developer Utilities Proxy Execution", description: "Adversaries may use trusted developer utilities to proxy execution of malicious payloads.", example: "Using MSBuild to execute an embedded task through a signed developer utility.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1059.002", parentId: "T1059", tactic: "Execution", name: "AppleScript", description: "Adversaries may abuse AppleScript for execution on macOS.", example: "Using AppleScript to control an application and launch a command.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1059.005", parentId: "T1059", tactic: "Execution", name: "Visual Basic", description: "Adversaries may abuse Visual Basic for execution.", example: "Running a VBScript through a trusted Windows scripting host.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1059.006", parentId: "T1059", tactic: "Execution", name: "Python", description: "Adversaries may abuse Python commands and scripts for execution.", example: "Launching a dropped Python script with the system interpreter.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1059.007", parentId: "T1059", tactic: "Execution", name: "JavaScript", description: "Adversaries may abuse JavaScript implementations for execution outside or inside a browser.", example: "Executing a JavaScript payload with a host-based runtime.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1059.008", parentId: "T1059", tactic: "Execution", name: "Network Device CLI", description: "Adversaries may abuse command-line interpreters on network devices to execute commands.", example: "Running unauthorized configuration commands through a network-device CLI.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1059.009", parentId: "T1059", tactic: "Execution", name: "Cloud API", description: "Adversaries may abuse cloud APIs to execute malicious commands.", example: "Calling a cloud API to start a VM or run a command in a cloud shell.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1059.010", parentId: "T1059", tactic: "Execution", name: "AutoHotKey & AutoIT", description: "Adversaries may execute commands and malicious tasks with AutoHotKey or AutoIT scripts.", example: "Running an automation script that opens applications and types attacker-controlled commands.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1059.011", parentId: "T1059", tactic: "Execution", name: "Lua", description: "Adversaries may abuse Lua commands and scripts for execution.", example: "Executing a Lua script through an embedded or standalone interpreter.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1059.012", parentId: "T1059", tactic: "Execution", name: "Hypervisor CLI", description: "Adversaries may abuse hypervisor command-line interpreters to execute malicious commands.", example: "Using a hypervisor management CLI to run commands in a guest environment.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1574.004", parentId: "T1574", tactic: "Execution", name: "Dylib Hijacking", description: "Adversaries may place a malicious macOS dylib where an application will load it.", example: "Putting a malicious dylib in an application search path before launch.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1574.001", parentId: "T1574", tactic: "Execution", name: "DLL", description: "Adversaries may abuse dynamic-link library files to achieve execution, persistence or privilege escalation.", example: "Side-loading a malicious DLL through a legitimate signed executable.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.005", parentId: "T1574", tactic: "Execution", name: "Executable Installer File Permissions Weakness", description: "Adversaries may exploit weak permissions on an installer binary or its directory to replace the executable.", example: "Replacing an installer component that executes with elevated privileges.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.006", parentId: "T1574", tactic: "Execution", name: "Dynamic Linker Hijacking", description: "Adversaries may abuse dynamic-linker environment variables or configuration to load malicious libraries.", example: "Using LD_PRELOAD to load attacker-controlled code into a process.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1574.007", parentId: "T1574", tactic: "Execution", name: "Path Interception by PATH Environment Variable", description: "Adversaries may hijack the PATH search order so a malicious executable is selected.", example: "Prepending a writable directory containing a fake utility to PATH.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1574.008", parentId: "T1574", tactic: "Execution", name: "Path Interception by Search Order Hijacking", description: "Adversaries may place a malicious file where a trusted program searches for a dependency.", example: "Dropping a DLL beside an application so it is loaded before the legitimate copy.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.009", parentId: "T1574", tactic: "Execution", name: "Path Interception by Unquoted Path", description: "Adversaries may exploit an unquoted executable path to cause a different binary to run.", example: "Placing a malicious executable in a higher-level directory of an unquoted service path.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.010", parentId: "T1574", tactic: "Execution", name: "Services File Permissions Weakness", description: "Adversaries may exploit weak permissions on service files or their directories to replace a service binary.", example: "Replacing a service executable that runs as LocalSystem.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.011", parentId: "T1574", tactic: "Execution", name: "Services Registry Permissions Weakness", description: "Adversaries may exploit weak permissions on registry keys controlling service execution.", example: "Changing a service ImagePath value through a writable service registry key.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.012", parentId: "T1574", tactic: "Execution", name: "COR_PROFILER", description: "Adversaries may use COR_PROFILER to load a malicious profiler into .NET processes.", example: "Setting COR_PROFILER and related variables before launching a .NET application.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.013", parentId: "T1574", tactic: "Execution", name: "KernelCallbackTable", description: "Adversaries may abuse a process KernelCallbackTable to hijack execution flow.", example: "Modifying a GUI process callback table to redirect execution to attacker-controlled code.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1574.014", parentId: "T1574", tactic: "Execution", name: "AppDomainManager", description: "Adversaries may hijack .NET AppDomainManager loading to execute an assembly.", example: "Configuring an application to load an attacker-controlled AppDomainManager.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1559.001", parentId: "T1559", tactic: "Execution", name: "Component Object Model", description: "Adversaries may use Windows COM for local code execution.", example: "Instantiating a COM object that launches or proxies an attacker-controlled action.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1559.002", parentId: "T1559", tactic: "Execution", name: "Dynamic Data Exchange", description: "Adversaries may use Windows DDE to execute arbitrary commands.", example: "Embedding a DDE field in a document that invokes a command interpreter.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1559.003", parentId: "T1559", tactic: "Execution", name: "XPC Services", description: "Adversaries may provide malicious content to a macOS XPC service daemon for local code execution.", example: "Sending crafted content to a privileged XPC helper service.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1053.002", parentId: "T1053", tactic: "Execution", tactics: ["Execution", "Persistence"], name: "At", description: "Adversaries may abuse the at utility to schedule initial or recurring execution.", example: "Creating an at job that launches a payload at a specified time.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1204.003", parentId: "T1204", tactic: "Execution", name: "Malicious Image", description: "Adversaries may rely on a user running a malicious cloud or container image to facilitate execution.", example: "Deploying a backdoored container image from a public registry.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1053.006", parentId: "T1053", tactic: "Execution", tactics: ["Execution", "Persistence"], name: "Systemd Timers", description: "Adversaries may abuse systemd timers to schedule execution on Linux systems.", example: "Creating a timer unit that starts a malicious service after a delay.", icon: Terminal, color: "text-[#00ff9c]", platform: "Linux" }
  ,{ id: "T1053.007", parentId: "T1053", tactic: "Execution", tactics: ["Execution", "Persistence"], name: "Container Orchestration Job", description: "Adversaries may abuse orchestration jobs to schedule containers that execute malicious code.", example: "Creating a Kubernetes Job that runs a malicious image in a cluster.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1569.001", parentId: "T1569", tactic: "Execution", name: "Launchctl", description: "Adversaries may abuse launchctl to execute commands or programs on macOS.", example: "Using launchctl to load or start a malicious launchd service.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,{ id: "T1569.002", parentId: "T1569", tactic: "Execution", name: "Service Execution", description: "Adversaries may abuse the Windows Service Control Manager to execute commands or payloads.", example: "Using sc.exe to create or start a service that launches a payload.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1569.003", parentId: "T1569", tactic: "Execution", name: "Systemctl", description: "Adversaries may abuse systemctl to execute commands or programs on Linux.", example: "Starting a malicious systemd service with systemctl.", icon: Terminal, color: "text-[#00ff9c]", platform: "Linux" }
  ,{ id: "T1127.001", parentId: "T1127", tactic: "Execution", name: "MSBuild", description: "Adversaries may use MSBuild to proxy execution through a trusted Windows utility.", example: "Launching MSBuild against a project containing an inline task.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1127.002", parentId: "T1127", tactic: "Execution", name: "ClickOnce", description: "Adversaries may use ClickOnce applications to proxy execution through a trusted Windows utility.", example: "Launching a malicious .application deployment that runs through DFSVC.EXE.", icon: Terminal, color: "text-[#00ff9c]", platform: "Windows" }
  ,{ id: "T1127.003", parentId: "T1127", tactic: "Execution", name: "JamPlus", description: "Adversaries may use JamPlus to proxy execution of a malicious script.", example: "Using a JamPlus build file to invoke an attacker-controlled command.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
  ,...PERSISTENCE_ENTRIES
  ,...PRIVILEGE_ESCALATION_ENTRIES
  ,...STEALTH_ENTRIES
  ,...DEFENSE_IMPAIRMENT_ENTRIES
  ,...CREDENTIAL_ACCESS_ENTRIES
];

// A few Stealth entries already exist because they are also part of another
// tactic. Keep their existing rich definition and remove any catalog duplicate.
const seenMitreIds = new Set<string>();
for (let index = 0; index < MITRE_DB.length; index += 1) {
  if (seenMitreIds.has(MITRE_DB[index].id)) {
    MITRE_DB.splice(index, 1);
    index -= 1;
  } else {
    seenMitreIds.add(MITRE_DB[index].id);
  }
}

// ATT&CK intentionally maps several mechanisms to both Persistence and Privilege
// Escalation. Keep one canonical definition per ID while exposing both tactic filters.
const PRIVILEGE_ESCALATION_SHARED_IDS = new Set([
  "T1098", "T1098.001", "T1098.002", "T1098.003", "T1098.004", "T1098.005", "T1098.006", "T1098.007",
  "T1547", "T1547.001", "T1547.002", "T1547.003", "T1547.004", "T1547.005", "T1547.006", "T1547.007", "T1547.008", "T1547.009", "T1547.010", "T1547.012", "T1547.013", "T1547.014", "T1547.015",
  "T1037", "T1037.001", "T1037.002", "T1037.003", "T1037.004", "T1037.005",
  "T1543", "T1543.001", "T1543.002", "T1543.003", "T1543.004", "T1543.005",
  "T1546", "T1546.001", "T1546.002", "T1546.003", "T1546.004", "T1546.005", "T1546.006", "T1546.007", "T1546.008", "T1546.009", "T1546.010", "T1546.011", "T1546.012", "T1546.013", "T1546.014", "T1546.015", "T1546.016", "T1546.017", "T1546.018",
  "T1053", "T1053.002", "T1053.003", "T1053.005", "T1053.006", "T1053.007",
  "T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004",
]);

for (const definition of MITRE_DB) {
  if (!PRIVILEGE_ESCALATION_SHARED_IDS.has(definition.id)) continue;
  definition.tactics = Array.from(new Set([definition.tactic, ...(definition.tactics ?? []), "Privilege Escalation"]));
}

const STEALTH_SHARED_IDS = new Set([
  ...STEALTH_CATALOG.map(([id]) => id),
  "T1134", "T1134.001", "T1134.002", "T1134.003", "T1134.004", "T1134.005",
  "T1197", "T1036.012", "T1542", "T1542.001", "T1542.002", "T1542.003", "T1542.004", "T1542.005",
  "T1574", "T1574.001", "T1574.004", "T1574.005", "T1574.006", "T1574.007", "T1574.008", "T1574.009", "T1574.010", "T1574.011", "T1574.012", "T1574.013", "T1574.014",
  "T1055", "T1055.001", "T1055.002", "T1055.003", "T1055.004", "T1055.005", "T1055.008", "T1055.009", "T1055.011", "T1055.012", "T1055.013", "T1055.014", "T1055.015",
  "T1205", "T1205.001", "T1205.002", "T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004",
  "T1497", "T1679",
]);

for (const definition of MITRE_DB) {
  if (!STEALTH_SHARED_IDS.has(definition.id)) continue;
  definition.tactics = Array.from(new Set([definition.tactic, ...(definition.tactics ?? []), "Stealth"]));
}

const DEFENSE_IMPAIRMENT_SHARED_IDS = new Set([
  "T1562.001", "T1484", "T1484.001", "T1484.002", "T1556", "T1556.001", "T1556.002", "T1556.003", "T1556.004", "T1556.005", "T1556.006", "T1556.007", "T1556.008", "T1556.009",
  "T1112", "T1222", "T1222.001", "T1222.002",
]);

for (const definition of MITRE_DB) {
  if (!DEFENSE_IMPAIRMENT_SHARED_IDS.has(definition.id)) continue;
  definition.tactics = Array.from(new Set([definition.tactic, ...(definition.tactics ?? []), "Defense Impairment"]));
}

const CREDENTIAL_ACCESS_SHARED_IDS = new Set([
  "T1556", "T1556.001", "T1556.002", "T1556.003", "T1556.004", "T1556.005", "T1556.006", "T1556.007", "T1556.008", "T1556.009",
]);

for (const definition of MITRE_DB) {
  if (!CREDENTIAL_ACCESS_SHARED_IDS.has(definition.id)) continue;
  definition.tactics = Array.from(new Set([definition.tactic, ...(definition.tactics ?? []), "Credential Access"]));
}
