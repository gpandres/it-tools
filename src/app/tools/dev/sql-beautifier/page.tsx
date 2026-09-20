"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useNotification } from "@/components/notification-provider";
import { Copy, RefreshCw } from "lucide-react";
import { format, type SqlLanguage } from "sql-formatter";

const DIALECTS = [
  { id: "sql", name: "Standard SQL" },
  { id: "mysql", name: "MySQL / MariaDB" },
  { id: "postgresql", name: "PostgreSQL" },
  { id: "tsql", name: "SQL Server (T-SQL)" },
  { id: "plsql", name: "Oracle (PL/SQL)" },
  { id: "sqlite", name: "SQLite" },
] as const;

export default function SqlBeautifier() {
  const [inputSql, setInputSql] = useState("");
  const [outputSql, setOutputSql] = useState("");
  const [dialect, setDialect] = useState<SqlLanguage>("sql");
  const [error, setError] = useState("");
  const { notify } = useNotification();

  const invalidateResult = () => {
    setOutputSql("");
    setError("");
  };

  const formatSql = () => {
    if (!inputSql.trim()) return;
    try {
      setOutputSql(format(inputSql, { language: dialect, tabWidth: 2, keywordCase: "upper", linesBetweenQueries: 2 }));
      setError("");
    } catch (exception) {
      setOutputSql("");
      setError(exception instanceof Error ? exception.message : "Unable to format SQL for the selected dialect.");
    }
  };

  const copyToClipboard = async () => {
    if (!outputSql) return;
    try {
      await navigator.clipboard.writeText(outputSql);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the formatted SQL and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="SQL Beautifier" description="Format SQL with two-space indentation and uppercase keywords. Choose the dialect used by your database.">
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN">Input SQL</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolField htmlFor="sql-dialect" label="SQL dialect">
              <Select value={dialect} onValueChange={value => {
                const selected = DIALECTS.find(option => option.id === value);
                if (selected) { setDialect(selected.id); invalidateResult(); }
              }}>
                <SelectTrigger id="sql-dialect" className="w-full rounded-none border-[#1a1a1a] bg-black!">
                  <SelectValue>{DIALECTS.find(option => option.id === dialect)?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>{DIALECTS.map(option => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent>
              </Select>
            </ToolField>
            <ToolField htmlFor="sql-input" label="SQL to format" helper="Formatting does not execute queries or validate them against a database.">
              <Textarea id="sql-input" value={inputSql} onChange={event => { setInputSql(event.target.value); invalidateResult(); }}
                placeholder="SELECT id,name FROM users WHERE status='active';" spellCheck={false}
                aria-invalid={!!error} aria-describedby={error ? "sql-error" : undefined}
                className="h-80 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
            </ToolField>
            {error && <ToolStatus id="sql-error" tone="error" title="Unable to format SQL" className="break-all">{error}</ToolStatus>}
            <ToolActionButton tone="accent" disabled={!inputSql.trim()} onClick={formatSql}><RefreshCw aria-hidden="true" /> Format SQL</ToolActionButton>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Formatted Result</ToolPanelTitle>
            <ToolActionButton aria-label="Copy formatted SQL" disabled={!outputSql} onClick={copyToClipboard}><Copy aria-hidden="true" /> Copy</ToolActionButton>
          </ToolPanelHeader>
          <ToolPanelBody>
            {outputSql ? (
              <ToolField htmlFor="sql-output" label="Formatted SQL" helper="Read-only result. Changing the input or dialect clears this result until you format again.">
                <Textarea id="sql-output" value={outputSql} readOnly spellCheck={false} wrap="off"
                  className="h-96 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
              </ToolField>
            ) : (
              <ToolEmptyState title={error ? "Fix the input to continue" : "Awaiting formatted SQL"}>
                {error ? "Check the expression and selected dialect, then format again." : "Enter SQL, choose a dialect and select Format SQL."}
              </ToolEmptyState>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
