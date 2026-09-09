"use client";

import { Suspense, useState, useEffect } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Clock, Copy, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

function TimestampConverterContent() {
  const [input, setInput] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const parseInput = () => {
    if (!input.trim()) return null;
    
    const str = input.trim();
    let date = new Date(str); // Try natural parsing first (ISO, RFC, etc)

    if (isNaN(date.getTime())) {
      // It might be a number
      const num = Number(str);
      if (!isNaN(num)) {
        // Is it seconds or ms?
        // Standard heuristic: if it's < 10000000000 it's likely seconds (valid until 2286)
        if (num < 10000000000) {
          date = new Date(num * 1000);
        } else {
          date = new Date(num);
        }
      }
    }

    if (isNaN(date.getTime())) return null;
    return date;
  };

  const dateObj = parseInput();

  const handleUseCurrent = () => {
    setInput(Math.floor(Date.now() / 1000).toString());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
      
      {/* Input */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border border-[#1a1a1a] bg-[#050505] rounded-none p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Timestamp or Date String
            </h3>
            
            <div className="space-y-2">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="e.g. 1709240000 or 2024-03-01T12:00:00Z"
                className="w-full bg-black border border-[#1a1a1a] p-4 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors rounded-none focus-visible:ring-[#00ff9c]"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleUseCurrent} variant="ghost" className="text-xs font-mono bg-[#1a1a1a] hover:bg-[#00ff9c]/20 hover:text-[#00ff9c] text-zinc-400 rounded-none">
                Current Unix Time
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-none p-4 flex gap-3 text-zinc-400">
          <Info className="w-5 h-5 shrink-0 text-zinc-500" />
          <p className="text-xs font-mono leading-relaxed">
            Auto-detects Unix Epoch (seconds), JS Timestamps (milliseconds), ISO 8601, and RFC 2822 date formats.
          </p>
        </div>

        <div className="border border-[#1a1a1a] bg-black rounded-none p-4 flex justify-between items-center text-xs font-mono text-zinc-500">
          <span>Live Epoch:</span>
          <span className="text-zinc-300">{currentTime !== null ? Math.floor(currentTime / 1000) : "..."}</span>
        </div>
      </div>

      {/* Output */}
      <div className="lg:col-span-7">
        <div className="border border-[#1a1a1a] bg-[#050505] rounded-none p-6 h-full flex flex-col">
          <h3 className="text-sm font-bold text-[#00ff9c] glow uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-6">
            Converted Results
          </h3>

          {!input.trim() ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-[#1a1a1a] text-zinc-600 font-mono text-sm rounded-none">
              Waiting for input...
            </div>
          ) : !dateObj ? (
            <div className="flex-1 flex items-center justify-center border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-sm rounded-none">
              Invalid date format.
            </div>
          ) : (
            <div className="space-y-4">
              <OutputRow 
                label="Local Time (Your Browser)" 
                value={dateObj.toString()} 
                copied={copiedKey === 'local'} 
                onCopy={() => copyToClipboard(dateObj.toString(), 'local')}
                highlight
              />
              <OutputRow 
                label="UTC / GMT Time" 
                value={dateObj.toUTCString()} 
                copied={copiedKey === 'utc'} 
                onCopy={() => copyToClipboard(dateObj.toUTCString(), 'utc')}
              />
              <OutputRow 
                label="ISO 8601" 
                value={dateObj.toISOString()} 
                copied={copiedKey === 'iso'} 
                onCopy={() => copyToClipboard(dateObj.toISOString(), 'iso')}
              />
              <OutputRow 
                label="Unix Epoch (Seconds)" 
                value={Math.floor(dateObj.getTime() / 1000).toString()} 
                copied={copiedKey === 'unix'} 
                onCopy={() => copyToClipboard(Math.floor(dateObj.getTime() / 1000).toString(), 'unix')}
              />
              <OutputRow 
                label="Unix Timestamp (Milliseconds)" 
                value={dateObj.getTime().toString()} 
                copied={copiedKey === 'ms'} 
                onCopy={() => copyToClipboard(dateObj.getTime().toString(), 'ms')}
              />
              
              <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Relative Time</span>
                 <div className="text-sm text-zinc-300 font-mono">
                   {getRelativeTimeString(dateObj)}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function getRelativeTimeString(date: Date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffYear = Math.round(diffDay / 365);

  const isPast = diffMs < 0;
  const abs = Math.abs;

  if (abs(diffSec) < 60) return `${abs(diffSec)} seconds ${isPast ? 'ago' : 'from now'}`;
  if (abs(diffMin) < 60) return `${abs(diffMin)} minutes ${isPast ? 'ago' : 'from now'}`;
  if (abs(diffHour) < 24) return `${abs(diffHour)} hours ${isPast ? 'ago' : 'from now'}`;
  if (abs(diffDay) < 365) return `${abs(diffDay)} days ${isPast ? 'ago' : 'from now'}`;
  return `${abs(diffYear)} years ${isPast ? 'ago' : 'from now'}`;
}

function OutputRow({ label, value, copied, onCopy, highlight = false }: { label: string, value: string, copied: boolean, onCopy: () => void, highlight?: boolean }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className={`text-[10px] font-mono uppercase tracking-widest ${highlight ? 'text-[#00ff9c]' : 'text-zinc-500'}`}>{label}</span>
      <div className="flex bg-black border border-[#1a1a1a] p-1 items-center group relative rounded-none">
        <input 
          readOnly 
          value={value}
          className="flex-1 font-mono text-sm bg-transparent border-none px-2 text-zinc-300 focus:outline-none rounded-none focus-visible:ring-[#00ff9c]"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCopy} 
          className="h-7 w-7 text-zinc-500 hover:text-zinc-200 bg-[#1a1a1a] rounded-none"
        >
          {copied ? <Check className="w-4 h-4 text-[#00ff9c]" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function TimestampConverterTool() {
  return (
    <ToolLayout
      title="Timestamp Converter"
      description="Convert Unix epoch timestamps to human-readable dates, ISO 8601, and local time zones instantly."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <TimestampConverterContent />
      </Suspense>
    </ToolLayout>
  );
}
