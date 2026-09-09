"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function WordCounter() {
  const [text, setText] = useState("");

  const charCount = text.length;
  const charNoSpacesCount = text.replace(/\s+/g, '').length;
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lineCount = text === "" ? 0 : text.split(/\r\n|\r|\n/).length;
  const paragraphCount = text === "" ? 0 : text.split(/\n\s*\n/).filter(p => p.trim() !== "").length;
  const sentenceCount = text === "" ? 0 : (text.match(/[^.!?]+[.!?]+/g) || []).length;
  
  // Avg reading speed is ~200 words per minute
  const readingTimeMinutes = wordCount / 200;
  const readingTime = readingTimeMinutes < 1 
    ? "< 1 min" 
    : `~${Math.ceil(readingTimeMinutes)} min`;

  return (
    <ToolLayout 
      title="Word & Character Counter" 
      description="Calculate word count, character count, and reading time metrics."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2 border border-[#1a1a1a] bg-[#050505] flex flex-col h-[calc(100vh-200px)] rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Text Input</span>
            </div>
            {text && (
              <Button 
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                onClick={() => setText("")}
              >
                Clear
              </Button>
            )}
          </header>
          <div className="flex-1 flex flex-col">
            <Label htmlFor="text-input" className="sr-only">Text Input</Label>
            <Textarea
              id="text-input"
              placeholder="Start typing or paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 w-full p-4 font-mono text-sm bg-black border-none text-zinc-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              spellCheck={false}
            />
          </div>
        </article>

        <article className="lg:col-span-1 border border-[#1a1a1a] bg-[#050505] flex flex-col h-fit sticky top-24 rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow uppercase tracking-widest">
                Statistics <span className="cursor-blink">_</span>
              </span>
            </div>
          </header>
          <div className="p-0">
            <div className="grid grid-cols-2 divide-x divide-y divide-[#1a1a1a] border-b border-[#1a1a1a]">
              <StatBox label="Words" value={wordCount} highlight />
              <StatBox label="Characters" value={charCount} highlight />
              <StatBox label="Chars (No Space)" value={charNoSpacesCount} />
              <StatBox label="Sentences" value={sentenceCount} />
              <StatBox label="Paragraphs" value={paragraphCount} />
              <StatBox label="Lines" value={lineCount} />
            </div>
            
            <div className="p-4 bg-[#0a0a0a]">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Est. Reading Time</span>
                <span className="text-[#00ff9c] font-mono text-sm">{readingTime}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) {
  return (
    <div className={`p-4 flex flex-col justify-center items-center gap-1 ${highlight ? 'bg-[#00ff9c]/5' : ''}`}>
      <span className={`text-2xl md:text-3xl font-mono ${highlight ? 'text-[#00ff9c]' : 'text-zinc-200'}`}>
        {value.toLocaleString()}
      </span>
      <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">{label}</span>
    </div>
  );
}
