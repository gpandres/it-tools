"use client";

import { useMemo, useRef, useState } from "react";
import cronstrue from "cronstrue";
import { Copy } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/components/notification-provider";
import { ToolActionButton, ToolConfirmDialog, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";

const examples = [
  ["Every minute", "* * * * *"], ["Every 5 minutes", "*/5 * * * *"],
  ["Hourly at minute 30", "30 * * * *"], ["Daily at 04:00", "0 4 * * *"],
  ["Sunday at midnight", "0 0 * * 0"], ["Daily at 08:00 and 18:00", "0 8,18 * * *"],
  ["First day of each month", "0 0 1 * *"],
];

export default function CronParser() {
  const [expression, setExpression] = useState("* * * * *");
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();
  const text = expression.trim();
  const result = useMemo(() => {
    if (!text) return { description: "", error: "" };
    try {
      if (text.split(/\s+/).length < 5 || text.split(/\s+/).length > 7) throw new Error("Enter an expression with 5, 6 or 7 fields.");
      return { description: cronstrue.toString(text, { throwExceptionOnParseError: true, use24HourTimeFormat: true }), error: "" };
    } catch (error) {
      return { description: "", error: error instanceof Error ? error.message : String(error) };
    }
  }, [text]);
  const parts = text.split(/\s+/);
  const hasYear = parts.length === 7 || (parts.length === 6 && (/\d{4}$/.test(parts[5]) || parts[4] === "?" || parts[2] === "?"));
  const fields = ["Minute", "Hour", "Day of month", "Month", "Day of week"];
  if (parts.length === 7 || (parts.length === 6 && !hasYear)) fields.unshift("Second");
  if (hasYear) fields.push("Year");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.description); notify("Description copied"); }
    catch { notify("Could not copy. Select the description and copy it manually.", "error"); }
  };

  return <ToolLayout title="Cron Expression Parser" description="Translate cron expressions into readable schedules locally.">
    <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="IN">Expression</ToolPanelTitle>
          <ToolConfirmDialog trigger={<ToolActionButton tone="danger" disabled={!expression}>Clear</ToolActionButton>} title="Clear cron expression?" description="The expression and its description will be removed." confirmLabel="Clear expression" onConfirm={() => setExpression("")} finalFocus={() => expression ? true : inputRef.current} />
        </ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          <ToolField htmlFor="cron-input" label="Cron expression" helper="Accepts five fields, or extended expressions with seconds and/or a year.">
            <Input id="cron-input" ref={inputRef} value={expression} onChange={event => setExpression(event.target.value)} spellCheck={false} autoComplete="off" placeholder="*/5 * * * *" aria-invalid={!!result.error} aria-describedby={result.error ? "cron-error" : undefined} className="h-10 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300" />
          </ToolField>
          {result.error && <ToolStatus id="cron-error" tone="error" title="Unable to describe expression">{result.error}</ToolStatus>}
          {text && !result.error && <dl className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
            {fields.map((field, index) => <div key={field} className="min-w-0 border border-[#1a1a1a] bg-black p-3"><dt className="text-xs text-zinc-400">{field}</dt><dd className="mt-2 break-all text-sm text-[#00ff9c]">{parts[index]}</dd></div>)}
          </dl>}
          <fieldset><legend className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Examples</legend>
            <div className="flex flex-wrap gap-2">{examples.map(([label, value]) => <ToolActionButton key={value} aria-pressed={text === value} tone={text === value ? "accent" : "neutral"} className="h-auto min-h-8 whitespace-normal text-left" onClick={() => setExpression(value)}>{label}</ToolActionButton>)}</div>
          </fieldset>
        </ToolPanelBody>
      </ToolPanel>
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="OUT">Schedule description</ToolPanelTitle><ToolActionButton disabled={!result.description} onClick={copy}><Copy aria-hidden="true" />Copy</ToolActionButton></ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          {result.description ? <p role="status" className="break-words text-base leading-relaxed text-zinc-200">{result.description}</p> : <ToolEmptyState title={text ? "Check the expression" : "Awaiting expression"}>Enter a cron expression or choose an example.</ToolEmptyState>}
          <p className="text-xs leading-relaxed text-zinc-400">This describes the expression; it does not schedule a job or verify a specific scheduler. Time zone and cron dialect depend on the system running it.</p>
        </ToolPanelBody>
      </ToolPanel>
    </div>
  </ToolLayout>;
}
