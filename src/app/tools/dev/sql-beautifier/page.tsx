"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Copy, Check, Database, RefreshCw } from "lucide-react";
import { format } from "sql-formatter";

const DIALECTS = [
  { id: "sql", name: "Standard SQL" },
  { id: "mysql", name: "MySQL / MariaDB" },
  { id: "postgresql", name: "PostgreSQL" },
  { id: "tsql", name: "SQL Server (T-SQL)" },
  { id: "plsql", name: "Oracle (PL/SQL)" },
  { id: "sqlite", name: "SQLite" }
];

export default function SqlBeautifier() {
  const [inputSql, setInputSql] = useState("");
  const [outputSql, setOutputSql] = useState("");
  const [dialect, setDialect] = useState("sql");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatSql = () => {
    if (!inputSql.trim()) {
      setOutputSql("");
      setError(null);
      return;
    }
    
    try {
      const formatted = format(inputSql, {
        language: dialect as any,
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2,
      });
      setOutputSql(formatted);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Invalid SQL syntax for the selected dialect");
    }
  };

  const copyToClipboard = async () => {
    if (!outputSql) return;
    await navigator.clipboard.writeText(outputSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="SQL Beautifier"
      description="Format and prettify raw or minified SQL queries instantly. Supports multiple dialects and standardizes keywords to uppercase."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4" /> Input SQL
            </h3>
            <select
              className="bg-black border-2 border-[#1a1a1a] text-zinc-300 text-xs p-1 focus:border-[#00ff9c] focus:outline-none transition-colors"
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
            >
              {DIALECTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <textarea
            className="w-full h-[400px] bg-black border-2 border-[#1a1a1a] p-4 text-zinc-300 font-mono text-xs focus:border-[#00ff9c] focus:outline-none transition-colors resize-none custom-scrollbar"
            placeholder="SELECT id,name,email FROM users WHERE status='active' ORDER BY created_at DESC;"
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
          />
          <Button 
            onClick={formatSql}
            className="w-full bg-[#00ff9c] hover:bg-[#00cc7d] text-black font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Format SQL
          </Button>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              Formatted Result
            </h3>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="h-7 text-xs border-[#1a1a1a] hover:bg-[#1a1a1a] text-zinc-400 hover:text-zinc-200"
              disabled={!outputSql}
            >
              {copied ? <Check className="w-3 h-3 mr-2 text-[#00ff9c]" /> : <Copy className="w-3 h-3 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          
          <div className="relative">
            <textarea
              className={`w-full h-[400px] border-2 p-4 font-mono text-xs focus:outline-none transition-colors resize-none custom-scrollbar ${
                error ? "border-red-900 bg-red-950/20 text-red-400" : "bg-[#050505] border-[#1a1a1a] text-[#00ff9c]"
              }`}
              readOnly
              value={error ? error : outputSql}
              placeholder="Formatted output will appear here..."
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
