import * as React from "react";
import { Terminal } from "lucide-react";
import { cn } from "cn";
import type { ToolTone } from "@/components/tool-ui";

export type ToolTerminalLine = {
  id: string;
  content: React.ReactNode;
  tone?: ToolTone;
};

const lineTone: Record<ToolTone, string> = {
  neutral: "text-zinc-300",
  info: "text-sky-300",
  success: "text-[#9fffd1]",
  attention: "text-[#fbbf24]",
  error: "text-red-300",
};

export function ToolTerminalOutput({
  title = "Terminal output",
  status,
  lines,
  emptyMessage = "No output yet.",
  ariaLabel,
  className,
}: {
  title?: React.ReactNode;
  status?: React.ReactNode;
  lines: ToolTerminalLine[];
  emptyMessage?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  return <section aria-label={ariaLabel ?? (typeof title === "string" ? title : "Terminal output")} className={cn("overflow-hidden border border-[#1a1a1a] bg-black", className)}>
    <header className="flex min-h-9 items-center justify-between gap-4 border-b border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
      <h3 className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff9c]"><Terminal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{title}</span></h3>
      {status && <span className="shrink-0 text-[9px] uppercase tracking-widest text-zinc-400">{status}</span>}
    </header>
    <div role="log" aria-live="polite" aria-relevant="additions text" className="min-h-32 overflow-auto p-3 font-mono text-[10px] leading-relaxed">
      {lines.length > 0 ? <ol className="space-y-1">{lines.map(line => <li key={line.id} className={cn("whitespace-pre-wrap break-words", lineTone[line.tone ?? "neutral"])}>{line.content}</li>)}</ol> : <p className="text-zinc-400">{emptyMessage}</p>}
    </div>
  </section>;
}
