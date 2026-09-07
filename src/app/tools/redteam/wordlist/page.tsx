"use client";

import React, { useState, useRef, useMemo } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Trash2, Filter, Upload, SortAsc, Search, CheckSquare } from "lucide-react";

export default function WordlistAnalyzerPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [filename, setFilename] = useState<string>('');
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [minLength, setMinLength] = useState<number | ''>('');
  const [maxLength, setMaxLength] = useState<number | ''>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Split by any newline character
      const splitLines = content.split(/\r?\n/);
      setLines(splitLines);
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    setLines([]);
    setFilename('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Operations
  const removeDuplicates = () => {
    setLines(Array.from(new Set(lines)));
  };

  const removeEmptyLines = () => {
    setLines(lines.filter(l => l.trim() !== ''));
  };

  const sortLines = () => {
    setLines([...lines].sort((a, b) => a.localeCompare(b)));
  };

  const normalizeLowercase = () => {
    setLines(lines.map(l => l.toLowerCase()));
  };

  // Filtered View for Export/Stats
  const processedLines = useMemo(() => {
    let result = lines;
    if (searchQuery) {
      result = result.filter(l => l.includes(searchQuery));
    }
    if (typeof minLength === 'number') {
      result = result.filter(l => l.length >= minLength);
    }
    if (typeof maxLength === 'number') {
      result = result.filter(l => l.length <= maxLength);
    }
    return result;
  }, [lines, searchQuery, minLength, maxLength]);

  // Statistics on original vs processed
  const stats = useMemo(() => {
    if (processedLines.length === 0) return null;
    let min = Infinity;
    let max = 0;
    let totalLen = 0;
    let emptyCount = 0;

    // Use Set to find duplicates. 
    // Optimization: for huge arrays this can be slow, but for wordlists up to 1M lines it's usually sub-second in Chrome.
    const uniqueSet = new Set<string>();

    for (const l of processedLines) {
      if (l.trim() === '') emptyCount++;
      if (l.length < min) min = l.length;
      if (l.length > max) max = l.length;
      totalLen += l.length;
      uniqueSet.add(l);
    }

    return {
      total: processedLines.length,
      unique: uniqueSet.size,
      duplicates: processedLines.length - uniqueSet.size,
      empty: emptyCount,
      minLen: min === Infinity ? 0 : min,
      maxLen: max,
      avgLen: Math.round(totalLen / processedLines.length)
    };
  }, [processedLines]);

  const exportTxt = () => {
    const content = processedLines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_${filename || 'wordlist'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="Wordlist Analyzer"
      description="Analyze, filter, and clean wordlists locally without uploading files."
    >
      <div className="w-full max-w-7xl mx-auto space-y-6">

        {/* INPUT / LOAD */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 text-center border-dashed">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".txt,.csv"
            className="hidden" 
          />
          <FileText className="w-10 h-10 mx-auto text-[#00ff9c] mb-4 opacity-80" />
          <h2 className="text-lg font-bold text-white mb-2">Select a wordlist file</h2>
          <p className="text-sm text-zinc-500 mb-6">File is processed entirely in your browser. No data leaves your machine.</p>
          <Button onClick={() => fileInputRef.current?.click()} className="bg-[#00ff9c] text-black hover:bg-[#00cc7d]">
            <Upload className="w-4 h-4 mr-2" /> Browse File
          </Button>
        </div>

        {lines.length > 0 && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* STATS PANEL */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="bg-[#111] border-b border-[#1a1a1a] p-3 flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">Stats: {filename}</h2>
                  <Button variant="ghost" size="icon" onClick={clearData} className="h-6 w-6 text-zinc-500 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  <StatRow label="Total Lines" value={stats.total.toLocaleString()} highlight />
                  <StatRow label="Unique Entries" value={stats.unique.toLocaleString()} />
                  <StatRow label="Duplicates" value={stats.duplicates.toLocaleString()} />
                  <StatRow label="Empty Lines" value={stats.empty.toLocaleString()} />
                  <div className="border-t border-[#1a1a1a] my-2 pt-2"></div>
                  <StatRow label="Min Length" value={stats.minLen.toLocaleString()} />
                  <StatRow label="Max Length" value={stats.maxLen.toLocaleString()} />
                  <StatRow label="Avg Length" value={stats.avgLen.toLocaleString()} />
                </div>
              </div>

              {/* MUTATIONS (Modify base array) */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Transformations</h3>
                <Button onClick={removeDuplicates} variant="outline" className="w-full justify-start text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white">
                  <CheckSquare className="w-3 h-3 mr-2" /> Remove Duplicates
                </Button>
                <Button onClick={removeEmptyLines} variant="outline" className="w-full justify-start text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white">
                  <Filter className="w-3 h-3 mr-2" /> Remove Empty Lines
                </Button>
                <Button onClick={sortLines} variant="outline" className="w-full justify-start text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white">
                  <SortAsc className="w-3 h-3 mr-2" /> Sort Alphabetically
                </Button>
                <Button onClick={normalizeLowercase} variant="outline" className="w-full justify-start text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white">
                  <FileText className="w-3 h-3 mr-2" /> Normalize Lowercase
                </Button>
              </div>
            </div>

            {/* PREVIEW & EXPORT PANEL */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden flex flex-col min-h-[500px]">
              
              <div className="bg-[#111] border-b border-[#1a1a1a] p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Search & Filters */}
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-zinc-500" />
                    <Input 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search lines..."
                      className="h-8 pl-8 text-xs bg-black border-[#333]"
                    />
                  </div>
                  <Input 
                    type="number"
                    value={minLength}
                    onChange={e => setMinLength(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Min Len"
                    className="h-8 w-20 text-xs bg-black border-[#333] text-center"
                  />
                  <Input 
                    type="number"
                    value={maxLength}
                    onChange={e => setMaxLength(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Max Len"
                    className="h-8 w-20 text-xs bg-black border-[#333] text-center"
                  />
                </div>

                <Button onClick={exportTxt} className="h-8 text-xs bg-[#00ff9c] text-black hover:bg-[#00cc7d]">
                  <Download className="w-3 h-3 mr-1" /> Export TXT
                </Button>
              </div>

              {/* Preview Window */}
              <div className="flex-1 p-4 bg-black overflow-y-auto">
                <div className="font-mono text-xs text-zinc-400 space-y-1">
                  {processedLines.slice(0, 1000).map((l, i) => (
                    <div key={i} className="truncate hover:bg-[#111] px-1">{l || <span className="opacity-20">&lt;empty&gt;</span>}</div>
                  ))}
                  {processedLines.length > 1000 && (
                    <div className="text-zinc-600 italic pt-4 border-t border-[#111] mt-4">
                      ... and { (processedLines.length - 1000).toLocaleString() } more lines not shown.
                    </div>
                  )}
                  {processedLines.length === 0 && (
                    <div className="text-zinc-600 italic">No lines match the current filters.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </ToolLayout>
  );
}

function StatRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`text-xs font-mono ${highlight ? 'text-[#00ff9c] font-bold' : 'text-zinc-200'}`}>{value}</span>
    </div>
  );
}
