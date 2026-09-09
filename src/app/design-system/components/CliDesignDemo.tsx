"use client";

import { FormEvent, useState } from "react";
import { ChevronRight, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolActionButton, ToolActionPanel } from "@/components/tool-action-panel";

const commandOutput: Record<string, string> = {
  help: "status    show local tool status\nhelp      show available commands\nclear     clear the terminal",
  status: "[OK] local processing enabled\n[OK] input buffer ready",
};

export function CliDesignDemo() {
  const [command, setCommand] = useState("");
  const [lines, setLines] = useState(["IT_TOOLS CLI simulator", "Type help to list safe example commands."]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = command.trim().toLowerCase();
    if (!normalized) return;
    if (normalized === "clear") {
      setLines([]);
    } else {
      setLines(current => [...current, `> ${normalized}`, commandOutput[normalized] || `[ERR] unknown command: ${normalized}`]);
    }
    setCommand("");
  };

  return (
    <div className="border border-[#1a1a1a] bg-black">
      <header className="flex items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff9c]"><Terminal className="h-3.5 w-3.5" />CLI simulator</span><span className="text-[9px] uppercase tracking-widest text-zinc-700">safe / local</span></header>
      <div className="min-h-32 space-y-1 p-3 font-mono text-[10px] leading-relaxed text-zinc-500">{lines.map((line, index) => <div key={`${line}-${index}`} className={line.startsWith("[ERR]") ? "text-red-400" : line.startsWith(">") ? "text-[#00ff9c]" : ""}>{line || " "}</div>)}</div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#1a1a1a] p-2"><ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#00ff9c]" /><Input value={command} onChange={event => setCommand(event.target.value)} className="h-7 rounded-none border-[#1a1a1a] bg-[#050505] text-xs" aria-label="CLI command" placeholder="help" /><ToolActionButton className="h-7 rounded-none" type="submit">Run</ToolActionButton></form>
      <ToolActionPanel label="EXAMPLES" className="rounded-none border-x-0 border-b-0"><ToolActionButton className="rounded-none" type="button" onClick={() => setCommand("help")}>help</ToolActionButton><ToolActionButton className="rounded-none" type="button" onClick={() => setCommand("status")}>status</ToolActionButton><ToolActionButton className="rounded-none" type="button" onClick={() => setCommand("clear")}>clear</ToolActionButton></ToolActionPanel>
    </div>
  );
}
