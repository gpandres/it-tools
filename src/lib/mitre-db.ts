import { 
  LogIn, Terminal, Anchor, ArrowUpCircle, 
  ShieldOff, Key, Search as SearchIcon, MoveHorizontal, 
  Archive, Radio, UploadCloud, AlertTriangle, Shield,
  LucideIcon
} from "lucide-react";

export type Tactic = 
  | "All"
  | "Initial Access" 
  | "Execution" 
  | "Persistence" 
  | "Privilege Escalation" 
  | "Defense Evasion" 
  | "Credential Access" 
  | "Discovery" 
  | "Lateral Movement" 
  | "Collection" 
  | "Command and Control" 
  | "Exfiltration" 
  | "Impact";

export type Platform = "Windows" | "Linux" | "Cross-Platform";

export type MitreDef = {
  id: string;
  tactic: Tactic;
  name: string;
  description: string;
  example: string;
  icon: LucideIcon;
  color: string;
  platform: Platform;
};

export const MITRE_DB: MitreDef[] = [
  // Initial Access
  { id: "T1566", tactic: "Initial Access", name: "Phishing", description: "Adversaries may send phishing messages to gain access to victim systems.", example: "Sending an email with a malicious macro-enabled Word document.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
  { id: "T1190", tactic: "Initial Access", name: "Exploit Public-Facing Application", description: "Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program using software exploits.", example: "Exploiting a vulnerability in a web server (e.g., Log4Shell).", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
  { id: "T1078", tactic: "Initial Access", name: "Valid Accounts", description: "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access.", example: "Using leaked VPN credentials to log into the corporate network.", icon: LogIn, color: "text-blue-400", platform: "Cross-Platform" },
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
  { id: "T1053.005", tactic: "Persistence", name: "Scheduled Task", description: "Adversaries may abuse the Windows Task Scheduler to perform task scheduling.", example: "Creating a Scheduled Task to run a script daily.", icon: Anchor, color: "text-purple-400", platform: "Windows" },
  { id: "T1053.003", tactic: "Persistence", name: "Cron", description: "Adversaries may abuse the cron utility to perform task scheduling for persistence.", example: "Adding an entry to /var/spool/cron/crontabs/root to run a reverse shell.", icon: Anchor, color: "text-purple-400", platform: "Linux" },

  // Privilege Escalation
  { id: "T1548.002", tactic: "Privilege Escalation", name: "Bypass User Account Control", description: "Adversaries may bypass UAC mechanisms to elevate process privileges on system.", example: "Bypassing UAC using mock folders or DLL hijacking.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Windows" },
  { id: "T1548.003", tactic: "Privilege Escalation", name: "Sudo and Sudo Caching", description: "Adversaries may perform sudo caching and/or use the sudoers file to elevate privileges.", example: "Using sudo to execute a binary that breaks out of restricted environments.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Linux" },
  { id: "T1055", tactic: "Privilege Escalation", name: "Process Injection", description: "Adversaries may inject code into processes in order to evade process-based defenses as well as possibly elevate privileges.", example: "Injecting shellcode into explorer.exe or svchost.exe.", icon: ArrowUpCircle, color: "text-amber-500", platform: "Cross-Platform" },

  // Defense Evasion
  { id: "T1036", tactic: "Defense Evasion", name: "Masquerading", description: "Adversaries may attempt to manipulate features of their artifacts to make them appear legitimate or benign to users and/or security tools.", example: "Naming a malicious executable svchost.exe and running it from AppData.", icon: ShieldOff, color: "text-red-400", platform: "Cross-Platform" },
  { id: "T1562.001", tactic: "Defense Evasion", name: "Disable or Modify Tools", description: "Adversaries may maliciously modify components of a victim environment to hinder or disable defensive mechanisms.", example: "Disabling Windows Defender or stopping the Sysmon service.", icon: ShieldOff, color: "text-red-400", platform: "Windows" },
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
  { id: "T1204.004", tactic: "Execution", name: "Malicious Copy and Paste", description: "Adversaries may rely on a user copying and pasting malicious commands or content.", example: "Tricking a user into pasting a command into a shell.", icon: Terminal, color: "text-[#00ff9c]", platform: "Cross-Platform" }
];
