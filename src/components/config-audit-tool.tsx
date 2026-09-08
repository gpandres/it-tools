"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";

export type AuditRule = {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  pattern: RegExp;
  explanation: string;
  fix: string;
};

type ConfigAuditToolProps = {
  title: string;
  description: string;
  placeholder: string;
  rules: AuditRule[];
};

const severityStyles = {
  high: "border-red-500/40 bg-red-500/10 text-red-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  low: "border-blue-500/40 bg-blue-500/10 text-blue-300",
};

export function ConfigAuditTool({ title, description, placeholder, rules }: ConfigAuditToolProps) {
  const [input, setInput] = useState("");
  const findings = useMemo(() => rules.filter(rule => rule.pattern.test(input)), [input, rules]);

  return <ToolLayout title={title} description={description}>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
      <section className="border border-[#1a1a1a] bg-[#050505]">
        <header className="border-b border-[#1a1a1a] px-4 py-3"><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Input</h2><p className="mt-1 text-[11px] text-zinc-500">Analysis runs locally in your browser. Do not paste live secrets into shared screens.</p></header>
        <div className="p-4"><textarea value={input} onChange={event => setInput(event.target.value)} placeholder={placeholder} spellCheck={false} className="min-h-[520px] w-full resize-y border border-[#242424] bg-black p-4 font-mono text-xs leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#00ff9c]" aria-label={`${title} input`} /></div>
      </section>
      <section className="border border-[#1a1a1a] bg-[#050505]">
        <header className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3"><div><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Findings</h2><p className="mt-1 text-[11px] text-zinc-500">{input ? `${findings.length} rule${findings.length === 1 ? "" : "s"} matched` : "Paste a configuration to begin"}</p></div>{input && <span className={findings.length ? "text-amber-400" : "text-[#00ff9c]"}>{findings.length ? <ShieldAlert className="h-5 w-5" aria-label="Findings detected" /> : <CheckCircle2 className="h-5 w-5" aria-label="No findings" />}</span>}</header>
        <div className="space-y-3 p-4">{!input && <p className="py-8 text-center text-xs text-zinc-600">No configuration loaded.</p>}{input && findings.length === 0 && <div className="border border-[#00ff9c]/30 bg-[#00ff9c]/5 p-4 text-xs text-[#00ff9c]">No matching issues were found by the local ruleset. This is not a complete security guarantee.</div>}{findings.map(rule => <article key={rule.id} className={`border p-4 ${severityStyles[rule.severity]}`}><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div><h3 className="text-xs font-bold uppercase tracking-wider">{rule.severity} · {rule.label}</h3><p className="mt-2 text-xs leading-relaxed opacity-90">{rule.explanation}</p><p className="mt-2 text-[11px] opacity-75"><span className="font-bold">Remediation:</span> {rule.fix}</p></div></div></article>)}</div>
      </section>
    </div>
  </ToolLayout>;
}
