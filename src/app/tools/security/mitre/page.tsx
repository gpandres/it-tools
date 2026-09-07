"use client";

import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { 
  Search, ExternalLink, LogIn, Terminal, Anchor, ArrowUpCircle, 
  ShieldOff, Key, Search as SearchIcon, MoveHorizontal, 
  Archive, Radio, UploadCloud, AlertTriangle 
} from "lucide-react";
import { Input } from "@/components/ui/input";

type Tactic = 
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

type MitreDef = {
  id: string;
  tactic: Tactic;
  name: string;
  description: string;
  example: string;
  icon: any;
  color: string;
};

const MITRE_DB: MitreDef[] = [
  // Initial Access
  { id: "T1566", tactic: "Initial Access", name: "Phishing", description: "Adversaries may send phishing messages to gain access to victim systems. All forms of phishing are included, such as spearphishing attachments or links.", example: "Sending an email with a malicious macro-enabled Word document.", icon: LogIn, color: "text-blue-400" },
  { id: "T1190", tactic: "Initial Access", name: "Exploit Public-Facing Application", description: "Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program using software exploits.", example: "Exploiting a vulnerability in a web server (e.g., Log4Shell, ProxyLogon).", icon: LogIn, color: "text-blue-400" },
  { id: "T1078", tactic: "Initial Access", name: "Valid Accounts", description: "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access.", example: "Using leaked VPN credentials to log into the corporate network.", icon: LogIn, color: "text-blue-400" },

  // Execution
  { id: "T1059", tactic: "Execution", name: "Command and Scripting Interpreter", description: "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.", example: "Running a base64-encoded PowerShell script to download malware.", icon: Terminal, color: "text-[#00ff9c]" },
  { id: "T1047", tactic: "Execution", name: "Windows Management Instrumentation", description: "Adversaries may abuse WMI to execute malicious commands and payloads.", example: "Using wmic.exe process call create to launch a remote process.", icon: Terminal, color: "text-[#00ff9c]" },
  { id: "T1053", tactic: "Execution", name: "Scheduled Task/Job", description: "Adversaries may abuse task scheduling functionality to facilitate initial or recurring execution of malicious code.", example: "Creating a cron job or Windows Scheduled Task to run a script daily.", icon: Terminal, color: "text-[#00ff9c]" },

  // Persistence
  { id: "T1543", tactic: "Persistence", name: "Create or Modify System Process", description: "Adversaries may create or modify system-level processes to repeatedly execute malicious payloads as part of persistence.", example: "Installing a malicious Windows Service to run persistently as SYSTEM.", icon: Anchor, color: "text-purple-400" },
  { id: "T1547", tactic: "Persistence", name: "Boot or Logon Autostart Execution", description: "Adversaries may configure system settings to automatically execute a program during system boot or logon.", example: "Adding a registry key to HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.", icon: Anchor, color: "text-purple-400" },

  // Privilege Escalation
  { id: "T1548", tactic: "Privilege Escalation", name: "Abuse Elevation Control Mechanism", description: "Adversaries may circumvent mechanisms designed to control elevate privileges to gain higher-level permissions.", example: "Bypassing UAC (User Account Control) using mock folders or DLL hijacking.", icon: ArrowUpCircle, color: "text-amber-500" },
  { id: "T1055", tactic: "Privilege Escalation", name: "Process Injection", description: "Adversaries may inject code into processes in order to evade process-based defenses as well as possibly elevate privileges.", example: "Injecting shellcode into explorer.exe or svchost.exe.", icon: ArrowUpCircle, color: "text-amber-500" },

  // Defense Evasion
  { id: "T1036", tactic: "Defense Evasion", name: "Masquerading", description: "Adversaries may attempt to manipulate features of their artifacts to make them appear legitimate or benign to users and/or security tools.", example: "Naming a malicious executable svchost.exe and running it from AppData.", icon: ShieldOff, color: "text-red-400" },
  { id: "T1562", tactic: "Defense Evasion", name: "Impair Defenses", description: "Adversaries may maliciously modify components of a victim environment to hinder or disable defensive mechanisms.", example: "Disabling Windows Defender using PowerShell cmdlets or stopping the Sysmon service.", icon: ShieldOff, color: "text-red-400" },
  { id: "T1070", tactic: "Defense Evasion", name: "Indicator Removal", description: "Adversaries may delete or modify artifacts generated within systems to remove evidence of their presence or hinder defenses.", example: "Clearing the Windows Security Event Logs using wevtutil cl Security.", icon: ShieldOff, color: "text-red-400" },

  // Credential Access
  { id: "T1003", tactic: "Credential Access", name: "OS Credential Dumping", description: "Adversaries may attempt to dump credentials to obtain account login and credential material, normally in the form of a hash or a clear text password.", example: "Dumping LSASS memory using Mimikatz or procdump to extract NTLM hashes.", icon: Key, color: "text-pink-500" },
  { id: "T1558", tactic: "Credential Access", name: "Steal or Forge Kerberos Tickets", description: "Adversaries may attempt to steal or forge Kerberos tickets to enable pass-the-ticket or Forge Golden/Silver tickets.", example: "Performing a Kerberoasting attack to request service tickets and crack them offline.", icon: Key, color: "text-pink-500" },
  { id: "T1110", tactic: "Credential Access", name: "Brute Force", description: "Adversaries may use brute force techniques to attempt access to accounts when passwords are unknown or when password hashes are obtained.", example: "Password spraying common passwords across all user accounts in Active Directory.", icon: Key, color: "text-pink-500" },

  // Lateral Movement
  { id: "T1021", tactic: "Lateral Movement", name: "Remote Services", description: "Adversaries may use Valid Accounts to log into a service specifically designed to accept remote connections, such as telnet, SSH, and RDP.", example: "Using RDP to connect to a domain controller using stolen credentials.", icon: MoveHorizontal, color: "text-indigo-400" },
  { id: "T1550", tactic: "Lateral Movement", name: "Use Alternate Authentication Material", description: "Adversaries may use alternate authentication material, such as password hashes, Kerberos tickets, and application access tokens, to bypass normal authentication requirements.", example: "Performing a Pass-the-Hash (PtH) attack to authenticate using an NTLM hash.", icon: MoveHorizontal, color: "text-indigo-400" },

  // Command and Control
  { id: "T1071", tactic: "Command and Control", name: "Application Layer Protocol", description: "Adversaries may communicate using application layer protocols to avoid detection/network filtering by blending in with existing traffic.", example: "Sending C2 beacons encapsulated within standard HTTP/HTTPS traffic.", icon: Radio, color: "text-orange-400" },
  { id: "T1105", tactic: "Command and Control", name: "Ingress Tool Transfer", description: "Adversaries may transfer tools or other files from an external system into a compromised environment.", example: "Downloading a post-exploitation framework (e.g. Cobalt Strike) via curl or wget.", icon: Radio, color: "text-orange-400" },

  // Impact
  { id: "T1486", tactic: "Impact", name: "Data Encrypted for Impact", description: "Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt availability to system and network resources.", example: "Deploying Ransomware that encrypts all files and leaves a ransom note.", icon: AlertTriangle, color: "text-red-600" }
];

const TACTICS: Tactic[] = [
  "All",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Lateral Movement",
  "Command and Control",
  "Impact"
];

export default function MitreLookup() {
  const [search, setSearch] = useState("");
  const [filterTactic, setFilterTactic] = useState<Tactic>("All");

  const filteredMitre = useMemo(() => {
    return MITRE_DB.filter(def => {
      if (filterTactic !== "All" && def.tactic !== filterTactic) return false;
      if (!search.trim()) return true;
      
      const term = search.toLowerCase();
      return def.id.toLowerCase().includes(term) || 
             def.name.toLowerCase().includes(term) || 
             def.description.toLowerCase().includes(term) ||
             def.tactic.toLowerCase().includes(term);
    });
  }, [search, filterTactic]);

  return (
    <ToolLayout
      title="MITRE ATT&CK Reference"
      description="Quickly search and reference common MITRE ATT&CK tactics, techniques, and procedures (TTPs)."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
        
        {/* Filters Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">
              Filters
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search T-code, technique..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black border-[#1a1a1a] focus:border-[#00ff9c] text-zinc-300 font-mono"
              />
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-xs font-mono text-zinc-500">Tactic Phase</label>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {TACTICS.map(tactic => (
                  <button
                    key={tactic}
                    onClick={() => setFilterTactic(tactic)}
                    className={`text-left px-3 py-2 text-[11px] uppercase tracking-wider font-bold border transition-colors ${
                      filterTactic === tactic 
                      ? "bg-[#00ff9c]/10 border-[#00ff9c]/50 text-[#00ff9c]" 
                      : "bg-black border-[#1a1a1a] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    {tactic === "All" ? "All Tactics" : tactic}
                  </button>
                ))}
              </div>
            </div>
            
            <a 
              href="https://attack.mitre.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1a1a1a] text-zinc-300 hover:bg-[#2a2a2a] hover:text-white transition-colors border border-zinc-800 text-xs font-bold uppercase tracking-widest"
            >
              View Full Matrix <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-[#00ff9c] font-mono text-sm">
              Found {filteredMitre.length} technique{filteredMitre.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMitre.length === 0 ? (
              <div className="p-8 border border-[#1a1a1a] bg-[#050505] text-center flex flex-col items-center">
                <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 font-mono text-sm mb-4">No techniques found matching your filters.</p>
                {search.trim().toLowerCase().match(/^t\d{4}(\.\d{3})?$/) && (
                  <a
                    href={`https://attack.mitre.org/techniques/${search.trim().toUpperCase().split('.')[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20 hover:border-[#00ff9c] transition-all font-mono text-xs uppercase tracking-widest"
                  >
                    Technique not in local DB. Search {search.trim().toUpperCase()} on MITRE website <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              filteredMitre.map((def) => {
                const Icon = def.icon;
                return (
                  <div key={def.id} className="group border border-[#1a1a1a] bg-[#050505] p-5 hover:border-[#00ff9c]/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-[#1a1a1a] rounded ${def.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <h3 className="text-lg font-bold text-zinc-200">
                            <span className={`${def.color} mr-2 font-mono`}>{def.id}</span>
                            {def.name}
                          </h3>
                          <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-black border border-[#1a1a1a] text-zinc-400 w-fit">
                            {def.tactic}
                          </span>
                        </div>
                        
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                          {def.description}
                        </p>
                        
                        <div className="bg-black border border-zinc-800 p-3 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffb000]"></div>
                          <p className="text-zinc-300 text-xs font-mono ml-2">
                            <span className="text-[#ffb000] font-bold mr-2">Example:</span>
                            {def.example}
                          </p>
                        </div>
                      </div>
                      
                      <a 
                        href={`https://attack.mitre.org/techniques/${def.id.split('.')[0]}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-600 hover:text-[#00ff9c] transition-colors shrink-0"
                        title="View on MITRE website"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
