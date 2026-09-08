"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { analyzeConfig, MAX_AUDIT_INPUT_LENGTH, type AuditFinding, type AuditRule } from "@/lib/config-audit";

export type { AuditRule } from "@/lib/config-audit";

type ConfigAuditToolProps = {
  title: string;
  description: string;
  placeholder: string;
  rules?: AuditRule[];
  analyzer?: (input: string) => AuditFinding[];
};

const severityStyles = {
  high: "border-red-500/40 bg-red-500/10 text-red-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  low: "border-blue-500/40 bg-blue-500/10 text-blue-300",
};

export function ConfigAuditTool({ title, description, placeholder, rules = [], analyzer }: ConfigAuditToolProps) {
  const [input, setInput] = useState("");
  const [inputTruncated, setInputTruncated] = useState(false);
  const findings = useMemo(() => analyzer ? analyzer(input) : analyzeConfig(input, rules), [analyzer, input, rules]);

  const handleInputChange = (value: string) => {
    const truncated = value.length > MAX_AUDIT_INPUT_LENGTH;
    setInputTruncated(truncated);
    setInput(value.slice(0, MAX_AUDIT_INPUT_LENGTH));
  };

  return <ToolLayout title={title} description={description}>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
      <section className="border border-[#1a1a1a] bg-[#050505]">
        <header className="border-b border-[#1a1a1a] px-4 py-3"><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Input</h2><p className="mt-1 text-[11px] text-zinc-500">Analysis runs locally in your browser. Do not paste live secrets into shared screens.</p></header>
        <div className="p-4"><textarea value={input} onChange={event => handleInputChange(event.target.value)} placeholder={placeholder} spellCheck={false} maxLength={MAX_AUDIT_INPUT_LENGTH} className="min-h-[520px] w-full resize-y border border-[#242424] bg-black p-4 font-mono text-xs leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#00ff9c]" aria-label={`${title} input`} />{inputTruncated && <p className="mt-2 text-[11px] text-amber-300">Input truncated at {MAX_AUDIT_INPUT_LENGTH.toLocaleString()} characters to keep browser analysis responsive.</p>}<p className="mt-2 text-right text-[10px] text-zinc-700">{input.length.toLocaleString()} / {MAX_AUDIT_INPUT_LENGTH.toLocaleString()}</p></div>
      </section>
      <section className="border border-[#1a1a1a] bg-[#050505]">
        <header className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3"><div><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Findings</h2><p className="mt-1 text-[11px] text-zinc-500">{input ? `${findings.length} rule${findings.length === 1 ? "" : "s"} matched` : "Paste a configuration to begin"}</p></div>{input && <span className={findings.length ? "text-amber-400" : "text-[#00ff9c]"}>{findings.length ? <ShieldAlert className="h-5 w-5" aria-label="Findings detected" /> : <CheckCircle2 className="h-5 w-5" aria-label="No findings" />}</span>}</header>
        <div className="space-y-3 p-4">{!input && <p className="py-8 text-center text-xs text-zinc-600">No configuration loaded.</p>}{input && findings.length === 0 && <div className="border border-[#00ff9c]/30 bg-[#00ff9c]/5 p-4 text-xs text-[#00ff9c]">No matching issues were found by the local ruleset. This is not a complete security guarantee.</div>}{findings.map(finding => <article key={finding.id} className={`border p-4 ${severityStyles[finding.severity]}`}><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div className="min-w-0"><h3 className="text-xs font-bold uppercase tracking-wider">{finding.severity} · {finding.label}</h3><p className="mt-1 text-[10px] text-current/70">Line {finding.line}, column {finding.column}</p>{finding.excerpt && <code className="mt-2 block max-h-16 overflow-auto whitespace-pre-wrap break-words border border-current/15 bg-black/20 p-2 text-[10px] opacity-80">{finding.excerpt}</code>}<p className="mt-2 text-xs leading-relaxed opacity-90">{finding.explanation}</p><p className="mt-2 text-[11px] opacity-75"><span className="font-bold">Remediation:</span> {finding.fix}</p></div></div></article>)}</div>
      </section>
    </div>
  </ToolLayout>;
}
