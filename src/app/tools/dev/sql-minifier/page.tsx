"use client";
import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolStatus, ToolCodeField, ToolEmptyState } from "@/components/tool-design";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { minifySql, type MinifyDialect } from "@/lib/sql-minifier";

const dialects = { sql: "Standard SQL", postgresql: "PostgreSQL", mysql: "MySQL" };
export default function SqlMinifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [removeComments, setRemoveComments] = useState(true);
  const [dialect, setDialect] = useState<MinifyDialect>("sql");
  const [error, setError] = useState("");
  const invalidate = () => { setOutput(null); setError(""); };
  const run = () => {
    try { setOutput(minifySql(input, removeComments, dialect)); setError(""); }
    catch (error) { setOutput(null); setError(error instanceof Error ? error.message : "Unable to minify SQL."); }
  };
  return <ToolLayout title="SQL Minifier" description="Reduce SQL whitespace while preserving quoted values and identifiers. Processing stays in your browser.">
    <div className="mx-auto grid w-full max-w-6xl min-w-0 items-start gap-6 lg:grid-cols-2">
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="IN">Input SQL</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-4">
          <ToolField htmlFor="minify-dialect" label="SQL dialect">
            <Select value={dialect} onValueChange={value => { if (value && value in dialects) { setDialect(value as MinifyDialect); invalidate(); } }}>
              <SelectTrigger id="minify-dialect" className="w-full rounded-none border-[#1a1a1a] bg-black!"><SelectValue>{dialects[dialect]}</SelectValue></SelectTrigger>
              <SelectContent>{(Object.keys(dialects) as MinifyDialect[]).map(key => <SelectItem key={key} value={key}>{dialects[key]}</SelectItem>)}</SelectContent>
            </Select>
          </ToolField>
          <div className="flex items-center gap-3 text-xs text-zinc-300"><Checkbox id="sql-comments" checked={removeComments} onCheckedChange={value => { setRemoveComments(value === true); invalidate(); }} /><label htmlFor="sql-comments">Remove ordinary comments</label></div>
          <ToolField htmlFor="minify-input" label="SQL to minify">
            <Textarea id="minify-input" value={input} onChange={event => { setInput(event.target.value); invalidate(); }} placeholder="SELECT id, name FROM users WHERE status = 'active';" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? "minify-error" : undefined} className="h-72 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
          </ToolField>
          <ToolActionButton tone="accent" disabled={!input.trim()} onClick={run}>Minify SQL</ToolActionButton>
          {error && <ToolStatus id="minify-error" tone="error">{error}</ToolStatus>}
          <p className="text-xs leading-relaxed text-zinc-400">Hints and executable comments are retained. Line breaks inside strings and after retained line comments remain. PostgreSQL assumes standard_conforming_strings is on; MySQL assumes default backslash escaping. This compacts text, not validates SQL syntax.</p>
        </ToolPanelBody>
      </ToolPanel>
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="OUT">Minified SQL</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-4">
          {output === null ? <ToolEmptyState title="No current result">Enter SQL and select Minify SQL. Editing the input or options clears the previous result.</ToolEmptyState> : output ? <><ToolCodeField language="SQL" code={output} filename="minified.sql" /><p className="text-xs text-zinc-400">{input.length.toLocaleString()} → {output.length.toLocaleString()} characters</p></> : <ToolStatus tone="neutral">No SQL remains after removing comments.</ToolStatus>}
        </ToolPanelBody>
      </ToolPanel>
    </div>
  </ToolLayout>;
}
