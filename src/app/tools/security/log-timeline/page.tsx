"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { AlignLeft, Clock, ArrowDownUp, AlertCircle, Upload, Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notification-provider";
import { downloadTextFile } from "@/lib/browser-download";
import { MAX_TIMELINE_ENTRIES, MAX_TIMELINE_INPUT_LENGTH, parseLogTimeline, timelineToCsv, type TimelineEntry } from "@/lib/log-timeline";

export default function LogTimelineGenerator() {
  const [rawLogs, setRawLogs] = useState("");
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [stats, setStats] = useState({ total: 0, withTime: 0, noTime: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_TIMELINE_INPUT_LENGTH) {
      notify("Log files are limited to 5 MB in the browser.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = typeof e.target?.result === "string" ? e.target.result : "";
      setRawLogs((prev) => `${prev ? `${prev}\n` : ""}${text}`.slice(0, MAX_TIMELINE_INPUT_LENGTH));
    };
    reader.onerror = () => notify("Could not read the log file.", "error");
    reader.readAsText(file);
  }, [notify]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processLogs = () => {
    if (!rawLogs.trim()) {
      notify("Paste or load log data before building the timeline.", "error");
      return;
    }
    const parsed = parseLogTimeline(rawLogs);
    setTimeline(parsed.entries);
    setStats({ total: parsed.total, withTime: parsed.withTime, noTime: parsed.noTime });
    if (parsed.truncated) {
      notify(`Timeline limited to ${MAX_TIMELINE_ENTRIES.toLocaleString()} lines or 5 MB.`, "error");
    } else if (parsed.withTime === 0) {
      notify("No supported timestamps were found in the supplied logs.", "error");
    }
  };

  const exportTimeline = (format: "csv" | "json") => {
    if (!timeline) return;
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      downloadTextFile(timelineToCsv(timeline), `log-timeline-${stamp}.csv`, "text/csv;charset=utf-8");
    } else {
      downloadTextFile(JSON.stringify(timeline.map(entry => ({
        timestamp: entry.timestamp?.toISOString() ?? null,
        timestampDetected: entry.timestampStr || null,
        rawLog: entry.originalText
      })), null, 2), `log-timeline-${stamp}.json`, "application/json;charset=utf-8");
    }
    notify(`Timeline exported as ${format.toUpperCase()}.`);
  };

  return (
    <ToolLayout
      title="Log Timeline Generator"
      description="Paste raw, mixed log files. This tool extracts timestamps using regex, sorts them chronologically, and visualizes the timeline."
    >
      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        
        {/* Input Area */}
        {!timeline ? (
          <div 
            className={`border-2 p-6 space-y-4 transition-colors ${
              isDragging ? 'border-[#00ff9c] bg-[#00ff9c]/5 border-dashed' : 'border-[#1a1a1a] bg-[#050505]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> Raw Logs
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 font-mono">You can also drop files here</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs border-[#1a1a1a] bg-black text-zinc-400 hover:text-zinc-200 rounded-none"
                >
                  <Upload className="w-3 h-3 mr-2" /> Upload .log
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden"
                  accept=".log,.txt"
                />
              </div>
            </div>
            
            <textarea
              className={`w-full min-h-[300px] border p-4 font-mono text-xs focus:outline-none transition-colors resize-y custom-scrollbar rounded-none ${
                isDragging ? 'bg-transparent border-[#00ff9c]/50 text-[#00ff9c]' : 'bg-black border-[#1a1a1a] text-zinc-300 focus:border-[#00ff9c]'
              }`}
              placeholder="Paste logs here, or drag & drop a .log file...&#10;Oct 12 10:14:00 server sshd[123]: Accepted password for root...&#10;2023-10-12T10:14:01Z [INFO] User logged in...&#10;12/Oct/2023:10:14:05 +0000 GET /admin..."
              value={rawLogs}
              onChange={(e) => setRawLogs(e.target.value)}
            ></textarea>
            
            <div className="flex justify-between items-center mt-4">
               <p className="text-xs text-zinc-500 font-mono">Supports ISO 8601, Syslog, Apache/Nginx, and generic formats.</p>
               <Button onClick={processLogs} className="bg-[#00ff9c] hover:bg-[#00cc7d] text-black rounded-none">
                 <ArrowDownUp className="w-4 h-4 mr-2" /> Extract & Sort
               </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header / Stats */}
            <div className="flex justify-between items-center bg-[#050505] border border-[#1a1a1a] p-4">
              <div className="flex flex-wrap gap-6 font-mono text-sm">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Total Lines</span>
                  <span className="text-zinc-200">{stats.total}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Timestamps Found</span>
                  <span className="text-[#00ff9c]">{stats.withTime}</span>
                </div>
                {stats.noTime > 0 && (
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">No Timestamp (At bottom)</span>
                    <span className="text-amber-500">{stats.noTime}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={() => exportTimeline("csv")} variant="outline" className="border-[#1a1a1a] hover:bg-[#1a1a1a] rounded-none">
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button onClick={() => exportTimeline("json")} variant="outline" className="border-[#1a1a1a] hover:bg-[#1a1a1a] rounded-none">
                  <FileJson className="mr-2 h-4 w-4" /> JSON
                </Button>
                <Button onClick={() => setTimeline(null)} variant="outline" className="border-[#1a1a1a] hover:bg-[#1a1a1a] rounded-none">
                  New Analysis
                </Button>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="bg-[#050505] border border-[#1a1a1a] p-6 lg:p-10 relative">
               {/* Vertical Line */}
               <div className="absolute left-[50px] md:left-[220px] top-10 bottom-10 w-0.5 bg-[#1a1a1a] hidden md:block"></div>
               
               <div className="space-y-6 relative z-10">
                 {timeline.map((entry) => {
                   const hasTime = !!entry.timestamp;
                   
                   // Extract the message part by removing the timestamp from the original text (if possible)
                   let message = entry.originalText;
                   if (hasTime && entry.timestampStr) {
                      message = message.replace(entry.timestampStr, "").trim();
                   }

                   return (
                     <div key={entry.id} className="flex flex-col md:flex-row gap-4 md:gap-8 group">
                        {/* Timestamp side */}
                        <div className="md:w-[200px] shrink-0 text-left md:text-right pt-1 relative">
                           {hasTime ? (
                             <div className="flex flex-col items-start md:items-end">
                               <span className="text-[#00ff9c] font-bold font-mono text-sm">{entry.timestamp?.toLocaleTimeString()}</span>
                               <span className="text-zinc-500 font-mono text-xs">{entry.timestamp?.toLocaleDateString()}</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-amber-500 md:justify-end">
                               <AlertCircle className="w-4 h-4" />
                               <span className="text-xs font-mono">No Time</span>
                             </div>
                           )}
                           
                           {/* Node marker (desktop only) */}
                           <div className="hidden md:block absolute right-[-41px] top-2 w-4 h-4 rounded-full border-2 border-[#1a1a1a] bg-black group-hover:border-[#00ff9c] transition-colors"></div>
                        </div>

                        {/* Message side */}
                        <div className={`flex-1 border p-4 font-mono text-sm break-all ${hasTime ? 'border-[#1a1a1a] bg-black text-zinc-300' : 'border-amber-500/20 bg-amber-500/5 text-amber-200/80'}`}>
                           {message}
                        </div>
                     </div>
                   );
                 })}
               </div>
            </div>

          </div>
        )}
      </div>
    </ToolLayout>
  );
}
