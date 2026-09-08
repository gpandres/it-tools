"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef } from "react";
import { Play, Filter, AlertCircle, Terminal, Search, Trash2, Upload, FileText } from "lucide-react";
import { useNotification } from "@/components/notification-provider";

type LogType = "nginx_combined" | "auth_log" | "custom";

interface ParsedLog {
  raw: string;
  fields: Record<string, string>;
  isError: boolean;
  sourceLine: number;
}

const MAX_LOG_INPUT_LENGTH = 5_000_000;
const MAX_RENDERED_ROWS = 10_000;

const PREDEFINED_REGEX = {
  // 127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
  nginx_combined: {
    name: "Nginx / Apache (Combined)",
    regex: '^(\\S+) \\S+ \\S+ \\[([^\\]]+)\\] "([^" ]+)\\s?([^" ]+)?\\s?([^"]+)?" (\\d+) (\\d+|-) "([^"]*)" "([^"]*)"',
    columns: ["IP", "Date", "Method", "Path", "Protocol", "Status", "Size", "Referer", "UserAgent"],
    errorCondition: (fields: Record<string, string>) => {
      const status = parseInt(fields["Status"]);
      return status >= 400;
    }
  },
  // Oct 10 13:55:36 server sshd[123]: Failed password for root from 1.2.3.4 port 1234 ssh2
  auth_log: {
    name: "Linux auth.log",
    regex: '^([A-Z][a-z]{2}\\s+\\d+\\s+\\d+:\\d+:\\d+)\\s+(\\S+)\\s+([^:\\[]+)(?:\\[\\d+\\])?:\\s+(.*)$',
    columns: ["Date", "Host", "Process", "Message"],
    errorCondition: (fields: Record<string, string>) => {
      const msg = (fields["Message"] || "").toLowerCase();
      return msg.includes("failed") || msg.includes("invalid") || msg.includes("error");
    }
  }
};

export default function LogParser() {
  const [rawLogs, setRawLogs] = useState("");
  const [logType, setLogType] = useState<LogType>("nginx_combined");
  const [customRegex, setCustomRegex] = useState("");
  const [customCols, setCustomCols] = useState("");
  
  const [filterIp, setFilterIp] = useState("");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  
  const [parsedData, setParsedData] = useState<{ columns: string[], rows: ParsedLog[], unmatched: number } | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();

  const parseLogs = () => {
    if (!rawLogs.trim()) {
      notify("Paste or load log data before running the parser.", "error");
      return;
    }

    let regexStr = "";
    let columns: string[] = [];
    let isErrorFn: (f: Record<string, string>) => boolean = () => false;

    if (logType === "custom") {
      regexStr = customRegex;
      columns = customCols.split(",").map(s => s.trim());
      if (!regexStr || columns.length === 0 || columns.some(column => !column) || new Set(columns).size !== columns.length) {
        notify("Custom regex and unique column names are required.", "error");
        return;
      }
    } else {
      const conf = PREDEFINED_REGEX[logType];
      regexStr = conf.regex;
      columns = conf.columns;
      isErrorFn = conf.errorCondition;
    }

    try {
      if (regexStr.length > 2000) {
        notify("Regex patterns are limited to 2,000 characters.", "error");
        return;
      }
      const regex = new RegExp(regexStr);
      const lines = rawLogs.split(/\r?\n/);
      
      const rows: ParsedLog[] = [];
      let unmatched = 0;
      
      for (const [lineIndex, line] of lines.entries()) {
        if (line.trim() === "") continue;
        const match = line.match(regex);
        if (match) {
          const fields: Record<string, string> = {};
          // match[0] is the full string, match[1...n] are capture groups
          for (let i = 0; i < columns.length; i++) {
            fields[columns[i]] = match[i + 1] ?? "-";
          }
          rows.push({
            raw: line,
            fields,
            isError: isErrorFn(fields),
            sourceLine: lineIndex + 1,
          });
        } else unmatched += 1;
      }
      
      setParsedData({ columns, rows, unmatched });
      if (!rows.length) notify("No lines matched the selected format.", "error");
    } catch {
      console.error("Invalid Regex");
      notify("Invalid regular expression.", "error");
    }
  };

  const filteredRows = useMemo(() => {
    if (!parsedData) return [];
    
    return parsedData.rows.filter(row => {
      // Filter by Error
      if (showOnlyErrors && !row.isError) return false;
      
      // Filter by IP (search all fields for IP)
      if (filterIp) {
        const term = filterIp.trim().toLowerCase();
        const hasIp = Object.values(row.fields).some(val => val.toLowerCase().includes(term));
        if (!hasIp) return false;
      }
      
      return true;
    });
  }, [parsedData, showOnlyErrors, filterIp]);

  const renderedRows = filteredRows.slice(0, MAX_RENDERED_ROWS);

  const handleFileUpload = (file: File) => {
    if (file.size > MAX_LOG_INPUT_LENGTH) {
      notify("Log files are limited to 5 MB in the browser.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawLogs((prev) => {
        const next = prev ? `${prev}\n${text}` : text;
        return next.slice(0, MAX_LOG_INPUT_LENGTH);
      });
    };
    reader.onerror = () => notify("Could not read the log file.", "error");
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <ToolLayout 
      title="Local Log Parser" 
      description="Grep and parse massive access logs instantly in your browser. 100% offline analysis."
      fullWidth={true}
    >
      <div className="flex flex-col gap-6 w-full mx-auto min-h-[calc(100vh-200px)]">
        
        {/* TOP SECTION: Input & Config */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col lg:col-span-8">
            <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <span className="text-[#00ff9c] text-xs">[IN]</span>
                <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Raw Log Dump</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} 
                  className="hidden" 
                  accept=".log,.txt,text/plain"
                />
                <Button 
                  variant="ghost" size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-900/30"
                >
                  <Upload className="w-3 h-3 mr-1" /> Upload File
                </Button>
                <Button 
                  variant="ghost" size="sm"
                  onClick={() => { setRawLogs(""); setParsedData(null); }}
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>
            </header>
            <div 
              className={`p-0 flex-1 relative transition-colors ${isDragging ? "bg-blue-900/10" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed border-blue-500 bg-black/80 backdrop-blur-sm">
                  <FileText className="w-12 h-12 text-blue-400 mb-2 animate-bounce" />
                  <span className="font-mono text-blue-400 text-sm tracking-widest uppercase">Drop log file here to load securely</span>
                  <span className="font-mono text-zinc-500 text-xs mt-2">100% Offline via FileReader API</span>
                </div>
              )}
              <Textarea
                value={rawLogs}
                onChange={(e) => setRawLogs(e.target.value.slice(0, MAX_LOG_INPUT_LENGTH))}
                placeholder={'127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326\nPaste your logs here, or drag & drop a .log file...'}
                className="w-full h-[300px] p-4 font-mono text-xs bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-[#00ff9c]/50 resize-y custom-scrollbar text-zinc-300 break-pre whitespace-pre"
                spellCheck={false}
              />
            </div>
          </article>

          <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col lg:col-span-4 h-fit">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="text-blue-400 text-xs">[CFG]</span>
              <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest">Parser Engine</span>
            </header>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Log Format</Label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setLogType("nginx_combined")}
                    className={`p-2 border text-left font-mono text-xs transition-colors ${logType === "nginx_combined" ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "border-[#1a1a1a] text-zinc-400 hover:border-[#2a2a2a]"}`}
                  >
                    Nginx/Apache (Combined)
                  </button>
                  <button 
                    onClick={() => setLogType("auth_log")}
                    className={`p-2 border text-left font-mono text-xs transition-colors ${logType === "auth_log" ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "border-[#1a1a1a] text-zinc-400 hover:border-[#2a2a2a]"}`}
                  >
                    Linux auth.log (SSH)
                  </button>
                  <button 
                    onClick={() => setLogType("custom")}
                    className={`p-2 border text-left font-mono text-xs transition-colors ${logType === "custom" ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "border-[#1a1a1a] text-zinc-400 hover:border-[#2a2a2a]"}`}
                  >
                    Custom Regex Pattern
                  </button>
                </div>
              </div>

              {logType === "custom" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Regex Pattern (with capture groups)</Label>
                    <Input 
                      value={customRegex}
                      onChange={(e) => setCustomRegex(e.target.value)}
                      placeholder="^(\S+) \S+ \S+ \[(.*?)\]"
                      className="font-mono text-xs bg-black border-[#1a1a1a] rounded-none focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Column Names (comma separated)</Label>
                    <Input 
                      value={customCols}
                      onChange={(e) => setCustomCols(e.target.value)}
                      placeholder="IP, Date"
                      className="font-mono text-xs bg-black border-[#1a1a1a] rounded-none focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={parseLogs}
                disabled={!rawLogs.trim()}
                className="w-full bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20 hover:border-[#00ff9c] rounded-none font-mono uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <Terminal className="w-4 h-4 mr-2" />
                Run Parser
              </Button>
            </div>
          </article>
        </div>

        {/* BOTTOM SECTION: Data Grid */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-[500px]">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a] gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center gap-2 uppercase tracking-widest">
                Parsed Data Grid <span className="cursor-blink">_</span>
              </span>
            </div>
            
            {parsedData && (
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-black border border-[#1a1a1a]">
                  <Search className="w-3 h-3 text-zinc-500 ml-2" />
                  <input 
                    type="text"
                    placeholder="Filter by IP or String..."
                    value={filterIp}
                    onChange={(e) => setFilterIp(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-zinc-300 w-40 px-2 py-1.5 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
                
                <button
                  onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                  className={`flex items-center gap-2 px-3 py-1.5 border font-mono text-xs transition-colors ${
                    showOnlyErrors ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-[#1a1a1a] bg-black text-zinc-400 hover:text-zinc-300 hover:border-[#2a2a2a]"
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  Only Errors
                </button>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-auto bg-black custom-scrollbar">
            {!parsedData ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4 p-12">
                <Terminal className="w-12 h-12 opacity-20" />
                <p className="font-mono text-sm">Paste logs and run the parser to populate the grid.</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-12">
                <p className="font-mono text-sm">No logs match the current filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-[#0a0a0a] sticky top-0 z-10 border-b border-[#1a1a1a]">
                  <tr>
                    <th className="px-4 py-2 font-mono text-xs text-zinc-500 font-medium border-r border-[#1a1a1a] w-12 text-center">#</th>
                    {parsedData.columns.map(col => (
                      <th key={col} className="px-4 py-2 font-mono text-xs text-blue-400 uppercase tracking-wider font-semibold border-r border-[#1a1a1a] last:border-0 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-[#1a1a1a]">
                  {renderedRows.map((row) => (
                    <tr 
                      key={row.sourceLine}
                      className={`hover:bg-[#050505] transition-colors ${
                        row.isError ? "bg-red-500/5 hover:bg-red-500/10" : ""
                      }`}
                    >
                      <td className="px-4 py-2 text-zinc-600 border-r border-[#1a1a1a] text-center w-12">
                        {row.sourceLine}
                        {row.isError && <AlertCircle className="w-3 h-3 text-red-500 mt-1 mx-auto inline-block ml-1" />}
                      </td>
                      {parsedData.columns.map(col => {
                        const val = row.fields[col];
                        let colorClass = "text-zinc-300";
                        
                        // Heuristic coloring
                        if (col === "Status" && val.startsWith("4")) colorClass = "text-orange-400 font-bold";
                        if (col === "Status" && val.startsWith("5")) colorClass = "text-red-500 font-bold";
                        if (col === "Status" && val.startsWith("2")) colorClass = "text-[#00ff9c]";
                        if (col === "Method") colorClass = "text-purple-400";
                        if (col === "IP") colorClass = "text-blue-300";
                        if (col === "Message" && row.isError) colorClass = "text-red-400";
                        
                        return (
                          <td key={col} className={`px-4 py-2 border-r border-[#1a1a1a] last:border-0 max-w-sm xl:max-w-xl 2xl:max-w-none break-all ${colorClass}`} title={val}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {parsedData && (
            <footer className="shrink-0 px-4 py-2 bg-[#050505] border-t border-[#1a1a1a] flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <span>Showing {renderedRows.length}{filteredRows.length > renderedRows.length ? ` of ${filteredRows.length}` : ""} visible rows · {parsedData.rows.length} parsed logs{parsedData.unmatched ? ` · ${parsedData.unmatched} unmatched` : ""}{filteredRows.length > renderedRows.length ? ` · render limit ${MAX_RENDERED_ROWS}` : ""}</span>
              <span>100% Offline Engine</span>
            </footer>
          )}
        </article>
      </div>
    </ToolLayout>
  );
}
