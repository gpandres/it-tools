"use client";

import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Search, Monitor, Shield, Network, Terminal, FileCode, Clock, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

type EventDef = {
  id: string;
  source: "Sysmon" | "Security" | "System";
  title: string;
  description: string;
  mitre?: string; // MITRE ATT&CK Tactic/Technique
  icon: any;
  color: string;
};

const EVENTS_DB: EventDef[] = [
  // Sysmon
  { id: "1", source: "Sysmon", title: "Process creation", description: "Provides extended information about a newly created process, including its command line and hashes.", mitre: "T1059 (Command and Scripting Interpreter)", icon: Terminal, color: "text-[#00ff9c]" },
  { id: "3", source: "Sysmon", title: "Network connection", description: "Logs TCP/UDP connections on the machine, including source/destination IP, port, and the process that initiated it.", mitre: "T1043 (Commonly Used Port)", icon: Network, color: "text-blue-400" },
  { id: "5", source: "Sysmon", title: "Process terminated", description: "Reports when a process terminates.", mitre: "", icon: Terminal, color: "text-zinc-400" },
  { id: "7", source: "Sysmon", title: "Image loaded", description: "Logs when a module (DLL) is loaded in a specific process. Useful for detecting DLL injection.", mitre: "T1055 (Process Injection)", icon: FileCode, color: "text-amber-400" },
  { id: "8", source: "Sysmon", title: "CreateRemoteThread", description: "Detects when a process creates a thread in another process. High fidelity for malware injection.", mitre: "T1055 (Process Injection)", icon: Shield, color: "text-red-500" },
  { id: "10", source: "Sysmon", title: "ProcessAccess", description: "Logs when a process opens another process, an operation often followed by information queries or reading memory (like reading lsass.exe).", mitre: "T1003 (OS Credential Dumping)", icon: Shield, color: "text-red-500" },
  { id: "11", source: "Sysmon", title: "FileCreate", description: "Operations when a file is created or overwritten. Useful for monitoring startup folders and temp directories.", mitre: "T1036 (Masquerading)", icon: FileCode, color: "text-zinc-300" },
  { id: "22", source: "Sysmon", title: "DNSEvent", description: "Logs DNS queries, whether they succeed or fail, authenticated or not.", mitre: "T1071 (Application Layer Protocol)", icon: Network, color: "text-blue-400" },

  // Windows Security
  { id: "4624", source: "Security", title: "Successful Logon", description: "An account was successfully logged on. Pay attention to Logon Type (e.g. Type 3 for Network, Type 10 for RDP).", mitre: "T1078 (Valid Accounts)", icon: Monitor, color: "text-[#00ff9c]" },
  { id: "4625", source: "Security", title: "Failed Logon", description: "An account failed to log on. Multiple failures can indicate brute force attacks.", mitre: "T1110 (Brute Force)", icon: Shield, color: "text-red-500" },
  { id: "4688", source: "Security", title: "Process Created", description: "A new process has been created. If command line auditing is enabled, this is invaluable for tracking attacker activity.", mitre: "T1059 (Command and Scripting)", icon: Terminal, color: "text-amber-400" },
  { id: "4698", source: "Security", title: "Scheduled Task Created", description: "A scheduled task was created. Often used for persistence by attackers.", mitre: "T1053 (Scheduled Task/Job)", icon: Clock, color: "text-amber-500" },
  { id: "4720", source: "Security", title: "User Account Created", description: "A user account was created. Anomalous account creation is a classic backdoor.", mitre: "T1136 (Create Account)", icon: Shield, color: "text-red-500" },
  { id: "5140", source: "Security", title: "Network Share Accessed", description: "A network share object was accessed.", mitre: "T1021 (Remote Services)", icon: Network, color: "text-blue-400" },
  { id: "4768", source: "Security", title: "Kerberos TGT Requested", description: "A Kerberos authentication ticket (TGT) was requested. Useful for detecting Golden Ticket attacks.", mitre: "T1558 (Steal or Forge Kerberos Tickets)", icon: Shield, color: "text-red-500" },
  { id: "4769", source: "Security", title: "Kerberos Service Ticket Requested", description: "A Kerberos service ticket was requested. Essential for detecting Kerberoasting.", mitre: "T1558.003 (Kerberoasting)", icon: Shield, color: "text-red-500" },
  { id: "7045", source: "System", title: "Service Installed", description: "A new service was installed in the system. High signal for privilege escalation or persistence.", mitre: "T1543.003 (Windows Service)", icon: Shield, color: "text-red-500" }
];

export default function EventIdLookup() {
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<"All" | "Sysmon" | "Security" | "System">("All");

  const filteredEvents = useMemo(() => {
    return EVENTS_DB.filter(ev => {
      if (filterSource !== "All" && ev.source !== filterSource) return false;
      if (!search.trim()) return true;
      
      const term = search.toLowerCase();
      return ev.id.includes(term) || 
             ev.title.toLowerCase().includes(term) || 
             ev.description.toLowerCase().includes(term) ||
             (ev.mitre && ev.mitre.toLowerCase().includes(term));
    });
  }, [search, filterSource]);

  return (
    <ToolLayout
      title="Windows Event ID & Sysmon Lookup"
      description="Quickly search and reference critical Windows Security Event IDs and Sysmon events for incident response."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
        
        {/* Filters Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">
              Filters
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search ID, title, technique..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black border-[#1a1a1a] focus:border-[#00ff9c] text-zinc-300 font-mono"
              />
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-xs font-mono text-zinc-500">Log Source</label>
              <div className="flex flex-col gap-2">
                {["All", "Security", "Sysmon", "System"].map(src => (
                  <button
                    key={src}
                    onClick={() => setFilterSource(src as any)}
                    className={`text-left px-3 py-2 text-sm font-mono border transition-colors ${
                      filterSource === src 
                      ? "bg-[#00ff9c]/10 border-[#00ff9c]/50 text-[#00ff9c]" 
                      : "bg-black border-[#1a1a1a] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {src === "All" ? "All Sources" : src}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#1a1a1a] text-xs text-zinc-500 leading-relaxed font-mono">
              <BookOpen className="w-4 h-4 mb-2" />
              Use this tool to quickly map an event ID from your SIEM to a description and MITRE ATT&CK technique.
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex justify-between items-center bg-[#050505] border border-[#1a1a1a] p-4">
            <span className="text-sm font-mono text-zinc-400">
              Showing {filteredEvents.length} events
            </span>
          </div>

          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="border border-[#1a1a1a] bg-[#050505] p-12 text-center text-zinc-500">
                <Search className="w-8 h-8 mx-auto mb-4 opacity-20" />
                No events found matching your search.
              </div>
            ) : (
              filteredEvents.map(ev => {
                const Icon = ev.icon;
                return (
                  <div key={ev.source + ev.id} className="border border-[#1a1a1a] bg-[#050505] p-5 flex flex-col md:flex-row gap-5 transition-colors hover:border-zinc-800">
                    
                    {/* ID & Source Bubble */}
                    <div className="flex flex-col items-center justify-center bg-black border border-[#1a1a1a] w-24 h-24 shrink-0 gap-1">
                       <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{ev.source}</span>
                       <span className={`text-2xl font-bold font-mono ${ev.color}`}>{ev.id}</span>
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${ev.color}`} />
                        <h4 className="text-lg font-bold text-zinc-200">{ev.title}</h4>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {ev.description}
                      </p>
                      
                      {ev.mitre && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-sm">
                          <Shield className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs font-mono text-zinc-300">
                            {ev.mitre}
                          </span>
                        </div>
                      )}
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
