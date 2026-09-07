"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { AlignLeft, Clock, ArrowDownUp, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type LogEntry = {
  id: number;
  originalText: string;
  timestamp: Date | null;
  timestampStr: string;
};

// Common log timestamp patterns
const PATTERNS = [
  // ISO 8601 (e.g. 2023-10-05T14:48:00.000Z)
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/i,
  // Syslog (e.g. Oct 15 10:00:00)
  /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/i,
  // Apache/Nginx (e.g. 15/Oct/2023:10:00:00 +0000)
  /\d{2}\/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/\d{4}:\d{2}:\d{2}:\d{2}\s+[+-]\d{4}/i,
  // Standard DB/App Logs (e.g. 2023-10-05 14:48:00)
  /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?/
];

export default function LogTimelineGenerator() {
  const [rawLogs, setRawLogs] = useState("");
  const [timeline, setTimeline] = useState<LogEntry[] | null>(null);
  const [stats, setStats] = useState({ total: 0, withTime: 0, noTime: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawLogs((prev) => (prev ? prev + "\n" + text : text));
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processLogs = () => {
    if (!rawLogs.trim()) return;

    const lines = rawLogs.split('\n').filter(l => l.trim() !== '');
    const entries: LogEntry[] = [];
    
    let withTime = 0;
    let noTime = 0;

    lines.forEach((line, index) => {
      let foundDate: Date | null = null;
      let foundStr = "";

      for (const regex of PATTERNS) {
        const match = line.match(regex);
        if (match) {
          // Attempt to parse
          let dateStr = match[0];
          
          // Fix Apache format for standard Date parsing (replace first two colons with space)
          if (dateStr.includes("/") && dateStr.includes(":")) {
            dateStr = dateStr.replace(":", " ");
          }

          const parsed = new Date(dateStr);
          // Check if valid date
          if (!isNaN(parsed.getTime())) {
            foundDate = parsed;
            foundStr = match[0];
            break;
          }
        }
      }

      if (foundDate) {
        withTime++;
      } else {
        noTime++;
      }

      entries.push({
        id: index,
        originalText: line,
        timestamp: foundDate,
        timestampStr: foundStr
      });
    });

    // Sort chronologically
    entries.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
      if (a.timestamp && !b.timestamp) return -1; // Entries with time go first
      if (!a.timestamp && b.timestamp) return 1;
      return 0; // Both no time, maintain original order
    });

    setTimeline(entries);
    setStats({ total: lines.length, withTime, noTime });
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
                  className="h-7 text-xs border-[#1a1a1a] bg-black text-zinc-400 hover:text-zinc-200"
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
              className={`w-full min-h-[300px] border p-4 font-mono text-xs focus:outline-none transition-colors resize-y custom-scrollbar ${
                isDragging ? 'bg-transparent border-[#00ff9c]/50 text-[#00ff9c]' : 'bg-black border-[#1a1a1a] text-zinc-300 focus:border-[#00ff9c]'
              }`}
              placeholder="Paste logs here, or drag & drop a .log file...&#10;Oct 12 10:14:00 server sshd[123]: Accepted password for root...&#10;2023-10-12T10:14:01Z [INFO] User logged in...&#10;12/Oct/2023:10:14:05 +0000 GET /admin..."
              value={rawLogs}
              onChange={(e) => setRawLogs(e.target.value)}
            ></textarea>
            
            <div className="flex justify-between items-center mt-4">
               <p className="text-xs text-zinc-500 font-mono">Supports ISO 8601, Syslog, Apache/Nginx, and generic formats.</p>
               <Button onClick={processLogs} className="bg-[#00ff9c] hover:bg-[#00cc7d] text-black">
                 <ArrowDownUp className="w-4 h-4 mr-2" /> Extract & Sort
               </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header / Stats */}
            <div className="flex justify-between items-center bg-[#050505] border border-[#1a1a1a] p-4">
              <div className="flex gap-6 font-mono text-sm">
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
              <Button onClick={() => setTimeline(null)} variant="outline" className="border-[#1a1a1a] hover:bg-[#1a1a1a]">
                New Analysis
              </Button>
            </div>

            {/* Visual Timeline */}
            <div className="bg-[#050505] border border-[#1a1a1a] p-6 lg:p-10 relative">
               {/* Vertical Line */}
               <div className="absolute left-[50px] md:left-[220px] top-10 bottom-10 w-0.5 bg-[#1a1a1a] hidden md:block"></div>
               
               <div className="space-y-6 relative z-10">
                 {timeline.map((entry, index) => {
                   const hasTime = !!entry.timestamp;
                   
                   // Extract the message part by removing the timestamp from the original text (if possible)
                   let message = entry.originalText;
                   if (hasTime && entry.timestampStr) {
                      message = message.replace(entry.timestampStr, "").trim();
                   }

                   return (
                     <div key={index} className="flex flex-col md:flex-row gap-4 md:gap-8 group">
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
