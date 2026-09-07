import { Terminal, ShieldAlert, Monitor, Key, FileWarning, Search, Cpu, FolderOpen } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type WinEventType = 
  | "All"
  | "Process Creation" 
  | "Network Connection" 
  | "File System" 
  | "Registry" 
  | "Authentication" 
  | "System"
  | "Object Access";

export type WinEventDef = {
  id: string;
  type: WinEventType;
  name: string;
  description: string;
  fields: string[];
  maliciousUse: string;
  mitre: string[];
  icon: LucideIcon;
  color: string;
};

export const WIN_EVENTS_DB: WinEventDef[] = [
  // Process Creation
  { id: "Sysmon 1", type: "Process Creation", name: "Process Creation", description: "Provides detailed information about newly created processes. It is equivalent to Windows Event 4688 but includes the command line and parent-child process relationships.", fields: ["Image", "CommandLine", "ParentImage", "Hashes", "User"], maliciousUse: "Detecting execution of malicious payloads, LOLBins like PowerShell or cmd.exe, and suspicious parent-child chains (e.g. Word spawning cmd.exe).", mitre: ["T1059.001", "T1059.003", "T1204.002", "T1566.001"], icon: Cpu, color: "text-blue-400" },
  { id: "4688", type: "Process Creation", name: "A new process has been created", description: "Generated every time a new process starts. Requires Command Line auditing to be enabled via GPO for full visibility.", fields: ["New Process Name", "Creator Process ID", "Process Command Line"], maliciousUse: "Tracking attacker execution and lateral movement tools.", mitre: ["T1059.001", "T1059.003", "T1204.002"], icon: Cpu, color: "text-blue-400" },
  { id: "Sysmon 8", type: "Process Creation", name: "CreateRemoteThread", description: "Detects when a process creates a thread in another process, a common technique for process injection.", fields: ["SourceImage", "TargetImage", "StartAddress", "StartFunction"], maliciousUse: "Identifying process injection techniques like DLL injection or shellcode execution.", mitre: ["T1055.001", "T1055.002"], icon: ShieldAlert, color: "text-red-500" },
  { id: "Sysmon 10", type: "Process Creation", name: "ProcessAccess", description: "Logs when a process opens another process, which is often used for credential dumping or memory reading.", fields: ["SourceImage", "TargetImage", "CallTrace", "GrantedAccess"], maliciousUse: "Detecting credential dumping tools like Mimikatz or procdump targeting LSASS.", mitre: ["T1003.001"], icon: ShieldAlert, color: "text-red-500" },

  // Network Connection
  { id: "Sysmon 3", type: "Network Connection", name: "Network Connection", description: "Logs TCP/UDP connections on the machine.", fields: ["Image", "DestinationIp", "DestinationPort", "Protocol"], maliciousUse: "Identifying C2 beaconing, lateral movement via RDP/SMB, or exfiltration.", mitre: ["T1071", "T1570", "T1021.001", "T1021.002"], icon: Monitor, color: "text-indigo-400" },
  { id: "Sysmon 22", type: "Network Connection", name: "DNSEvent (DNS query)", description: "Logs DNS queries, regardless of whether they succeed or fail, and what process performed them.", fields: ["Image", "QueryName", "QueryStatus", "QueryResults"], maliciousUse: "Detecting DNS tunneling, C2 domains, and DGA (Domain Generation Algorithms).", mitre: ["T1071.004", "T1568", "T1483"], icon: Monitor, color: "text-indigo-400" },

  // File System
  { id: "Sysmon 11", type: "File System", name: "FileCreate", description: "Logs when a file is created or overwritten.", fields: ["Image", "TargetFilename", "CreationUtcTime"], maliciousUse: "Tracking malware drops, web shell uploads, or ransomware activity.", mitre: ["T1105", "T1505.003", "T1486"], icon: FileWarning, color: "text-yellow-500" },
  { id: "Sysmon 23", type: "File System", name: "FileDelete", description: "Logs when a file is deleted. Can capture the deleted file if configured.", fields: ["Image", "TargetFilename", "Hashes", "IsExecutable"], maliciousUse: "Detecting attackers wiping their tools, clearing logs, or ransomware removing volume shadow copies.", mitre: ["T1070.004", "T1485"], icon: FileWarning, color: "text-yellow-500" },

  // Registry
  { id: "Sysmon 13", type: "Registry", name: "RegistryEvent (Value Set)", description: "Logs registry value modifications.", fields: ["Image", "TargetObject", "Details"], maliciousUse: "Identifying persistence mechanisms (e.g. Run keys) or UAC bypass attempts.", mitre: ["T1547.001", "T1546.012", "T1112"], icon: FolderOpen, color: "text-orange-400" },

  // Authentication
  { id: "4624", type: "Authentication", name: "Logon Success", description: "An account was successfully logged on. Key indicator of valid user activity or compromised accounts.", fields: ["Logon Type", "Account Name", "Source Network Address"], maliciousUse: "Tracking lateral movement via compromised credentials, Pass-the-Hash (Type 3), or RDP (Type 10).", mitre: ["T1078", "T1021.001", "T1021.002", "T1550.002"], icon: Key, color: "text-pink-400" },
  { id: "4625", type: "Authentication", name: "Logon Failure", description: "An account failed to log on. Essential for detecting brute force attacks.", fields: ["Logon Type", "Account Name", "Failure Reason", "Source Network Address"], maliciousUse: "Detecting password spraying or brute force attacks.", mitre: ["T1110.001", "T1110.003"], icon: Key, color: "text-pink-400" },
  { id: "4724", type: "Authentication", name: "Password Reset Attempt", description: "An attempt was made to reset an account's password by an administrator.", fields: ["Target Account Name", "Subject Account Name"], maliciousUse: "Attackers resetting admin passwords to maintain persistent access to a compromised domain.", mitre: ["T1098"], icon: Key, color: "text-pink-400" },

  // System
  { id: "1102", type: "System", name: "Audit Log Cleared", description: "The audit log was cleared. This is highly suspicious if performed outside of regular maintenance.", fields: ["Subject User", "Log Name"], maliciousUse: "Defense evasion. Attackers covering their tracks by wiping the Security Event Log.", mitre: ["T1070.001"], icon: ShieldAlert, color: "text-red-500" },
  { id: "7045", type: "System", name: "Service Installed", description: "A service was installed in the system.", fields: ["Service Name", "Service File Name", "Service Start Type"], maliciousUse: "Detecting persistence via malicious Windows Services.", mitre: ["T1543.003"], icon: Cpu, color: "text-blue-400" },
  { id: "4698", type: "System", name: "Scheduled Task Created", description: "A scheduled task was created.", fields: ["Task Name", "Task Content"], maliciousUse: "Detecting persistence via malicious Scheduled Tasks.", mitre: ["T1053.005"], icon: Cpu, color: "text-blue-400" },

  // Object Access
  { id: "5140", type: "Object Access", name: "Network Share Access", description: "A network share object was accessed.", fields: ["Share Name", "Share Local Path", "Account Name"], maliciousUse: "Tracking lateral movement, access to sensitive shares (e.g. C$, ADMIN$), or data staging.", mitre: ["T1021.002"], icon: Search, color: "text-teal-400" }
];
