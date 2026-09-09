"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, ShieldAlert } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton } from "@/components/tool-design";
import { Textarea } from "@/components/ui/textarea";
import { analyzeConfig, MAX_AUDIT_INPUT_LENGTH, type AuditFinding, type AuditRule, type AuditSeverity } from "@/lib/config-audit";

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

const EMPTY_RULES: AuditRule[] = [];
const severityOptions: Array<AuditSeverity | "all"> = ["all", "high", "medium", "low"];

export function ConfigAuditTool({ title, description, placeholder, rules = EMPTY_RULES, analyzer }: ConfigAuditToolProps) {
  const [input, setInput] = useState("");
  const [inputTruncated, setInputTruncated] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | "all">("all");
  const [copied, setCopied] = useState(false);
  const findings = useMemo(() => analyzer ? analyzer(input) : analyzeConfig(input, rules), [analyzer, input, rules]);
  const visibleFindings = severityFilter === "all" ? findings : findings.filter(finding => finding.severity === severityFilter);
  const counts = findings.reduce<Record<AuditSeverity, number>>((total, finding) => {
    total[finding.severity] += 1;
    return total;
  }, { high: 0, medium: 0, low: 0 });

  const handleInputChange = (value: string) => {
    const truncated = value.length > MAX_AUDIT_INPUT_LENGTH;
    setInputTruncated(truncated);
    setSeverityFilter("all");
    setInput(value.slice(0, MAX_AUDIT_INPUT_LENGTH));
  };

  const copyReport = async () => {
    if (!findings.length) return;
    const report = findings.map(finding => [
      `[${finding.severity.toUpperCase()}] ${finding.label}`,
      `Location: line ${finding.line}, column ${finding.column}`,
      `Finding: ${finding.explanation}`,
      `Remediation: ${finding.fix}`,
    ].join("\n")).join("\n\n");
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ToolLayout title={title} description={description}>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        
        <ToolPanel className="flex h-[min(680px,calc(100vh-240px))] min-h-[420px] flex-col">
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN">Input</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="flex min-h-0 flex-1 flex-col p-4">
            <ToolField htmlFor="audit-input" label="CONFIGURATION / HEADERS" helper="Analysis runs locally. Do not paste live secrets into shared screens." className="flex min-h-0 flex-1 flex-col">
              <Textarea 
                id="audit-input"
                value={input} 
                onChange={event => handleInputChange(event.target.value)} 
                placeholder={placeholder} 
                spellCheck={false} 
                maxLength={MAX_AUDIT_INPUT_LENGTH} 
                className="mt-2 min-h-0 flex-1 resize-none overflow-auto rounded-none border-[#1a1a1a] bg-black p-4 font-mono text-sm text-zinc-300 focus-visible:ring-1 focus-visible:ring-[#00ff9c] outline-none" 
                aria-label={`${title} input`} 
              />
            </ToolField>
            {inputTruncated && (
              <p className="mt-2 shrink-0 text-[11px] text-amber-300">Input truncated at {MAX_AUDIT_INPUT_LENGTH.toLocaleString()} characters to keep browser analysis responsive.</p>
            )}
            <p className="mt-2 shrink-0 text-right text-[10px] text-zinc-700">{input.length.toLocaleString()} / {MAX_AUDIT_INPUT_LENGTH.toLocaleString()}</p>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel className="flex h-[min(680px,calc(100vh-240px))] min-h-[420px] flex-col">
          <ToolPanelHeader className="flex-col items-stretch gap-4">
            <div className="flex items-start justify-between gap-3 w-full">
              <div>
                <ToolPanelTitle marker="OUT">Findings</ToolPanelTitle>
                <p className="mt-1 text-[11px] text-zinc-500">{input ? `${findings.length} rule${findings.length === 1 ? "" : "s"} matched` : "Paste a configuration to begin"}</p>
              </div>
              <div className="flex items-center gap-2">
                {input && <span className={findings.length ? "text-amber-400" : "text-[#00ff9c]"}>{findings.length ? <ShieldAlert className="h-5 w-5" aria-label="Findings detected" /> : <CheckCircle2 className="h-5 w-5" aria-label="No findings" />}</span>}
                <ToolActionButton onClick={copyReport} disabled={!findings.length} tone="neutral" title="Copy findings report">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy report"}
                </ToolActionButton>
              </div>
            </div>
            {input && findings.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Filter findings by severity">
                {severityOptions.map(option => {
                  const count = option === "all" ? findings.length : counts[option];
                  return (
                    <button 
                      key={option} 
                      type="button" 
                      onClick={() => setSeverityFilter(option)} 
                      className={`border px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${severityFilter === option ? "border-[#00ff9c] bg-[#00ff9c]/10 text-[#00ff9c]" : "border-[#242424] text-zinc-600 hover:border-zinc-500 hover:text-zinc-300"}`}
                    >
                      {option} <span className="ml-1 opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </ToolPanelHeader>
          <ToolPanelBody className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {!input && <p className="py-8 text-center text-xs text-zinc-600">No configuration loaded.</p>}
            {input && findings.length === 0 && (
              <div className="border border-[#00ff9c]/30 bg-[#00ff9c]/5 p-4 text-xs text-[#00ff9c]">No matching issues were found by the local ruleset. This is not a complete security guarantee.</div>
            )}
            {input && findings.length > 0 && visibleFindings.length === 0 && <p className="py-8 text-center text-xs text-zinc-600">No findings match this severity filter.</p>}
            {visibleFindings.map(finding => (
              <article key={finding.id} className={`border p-4 ${severityStyles[finding.severity]}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider">{finding.severity} · {finding.label}</h3>
                    <p className="mt-1 text-[10px] text-current/70">Line {finding.line}, column {finding.column}</p>
                    {finding.excerpt && <code className="mt-2 block max-h-16 overflow-auto whitespace-pre-wrap break-words border border-current/15 bg-black/20 p-2 text-[10px] opacity-80">{finding.excerpt}</code>}
                    <p className="mt-2 text-xs leading-relaxed opacity-90">{finding.explanation}</p>
                    <p className="mt-2 text-[11px] opacity-75"><span className="font-bold">Remediation:</span> {finding.fix}</p>
                  </div>
                </div>
              </article>
            ))}
          </ToolPanelBody>
        </ToolPanel>

      </div>
    </ToolLayout>
  );
}
