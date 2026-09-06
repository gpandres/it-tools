"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import * as diff from "diff";
import { Button } from "@/components/ui/button";

export default function TextDiffChecker() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  
  const [diffMode, setDiffMode] = useState<"words" | "lines">("lines");

  const diffResult = useMemo(() => {
    if (!original && !modified) return [];
    
    if (diffMode === "words") {
      return diff.diffWordsWithSpace(original, modified);
    } else {
      return diff.diffLines(original, modified);
    }
  }, [original, modified, diffMode]);

  const hasDifferences = diffResult.some(part => part.added || part.removed);
  const additions = diffResult.filter(p => p.added).length;
  const deletions = diffResult.filter(p => p.removed).length;

  return (
    <ToolLayout 
      title="Text Diff Checker" 
      description="Compare two text snippets to see added, removed, or modified content."
    >
      <div className="flex flex-col gap-6 h-[calc(100vh-180px)]">
        
        {/* Input Textareas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[250px]">
          <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-full">
            <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">Original Text</span>
              {original && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  onClick={() => setOriginal("")}
                >
                  Clear
                </Button>
              )}
            </header>
            <div className="p-0 flex-1 flex flex-col">
              <Label htmlFor="original-input" className="sr-only">Original Text</Label>
              <Textarea
                id="original-input"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Paste original text here..."
                className="w-full flex-1 p-4 font-mono text-sm bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-red-500/50 resize-none custom-scrollbar text-red-100"
                spellCheck={false}
              />
            </div>
          </article>

          <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-full">
            <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">Modified Text</span>
              {modified && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  onClick={() => setModified("")}
                >
                  Clear
                </Button>
              )}
            </header>
            <div className="p-0 flex-1 flex flex-col">
              <Label htmlFor="modified-input" className="sr-only">Modified Text</Label>
              <Textarea
                id="modified-input"
                value={modified}
                onChange={(e) => setModified(e.target.value)}
                placeholder="Paste modified text here..."
                className="w-full flex-1 p-4 font-mono text-sm bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-[#00ff9c]/50 resize-none custom-scrollbar text-[#00ff9c]/90"
                spellCheck={false}
              />
            </div>
          </article>
        </div>

        {/* Diff Output */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col flex-1 min-h-[300px]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-4">
              <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest">Diff Result</span>
              {(original || modified) && (
                <div className="flex items-center gap-3 text-xs font-mono">
                  {hasDifferences ? (
                    <>
                      <span className="text-red-400">-{deletions}</span>
                      <span className="text-[#00ff9c]">+{additions}</span>
                    </>
                  ) : (
                    <span className="text-zinc-500">Identical files</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center bg-black border border-[#1a1a1a]">
              <button 
                onClick={() => setDiffMode("lines")}
                className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${diffMode === "lines" ? "text-blue-400 bg-blue-400/10" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                By Line
              </button>
              <div className="w-px h-full bg-[#1a1a1a]" />
              <button 
                onClick={() => setDiffMode("words")}
                className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${diffMode === "words" ? "text-blue-400 bg-blue-400/10" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                By Word
              </button>
            </div>
          </header>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-black font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {diffResult.length === 0 ? (
              <span className="text-zinc-700 select-none">Waiting for input...</span>
            ) : (
              <div>
                {diffResult.map((part, index) => {
                  let className = "text-zinc-400";
                  let prefix = "";
                  
                  if (part.added) {
                    className = "text-[#00ff9c] bg-[#00ff9c]/10";
                    if (diffMode === "lines") prefix = "+ ";
                  } else if (part.removed) {
                    className = "text-red-400 bg-red-400/10";
                    if (diffMode === "lines") prefix = "- ";
                  } else {
                    if (diffMode === "lines") prefix = "  ";
                  }

                  if (diffMode === "lines") {
                    // Split part into individual lines to prefix each one properly
                    const lines = part.value.split('\n');
                    // diffLines often leaves a trailing newline on parts
                    if (lines[lines.length - 1] === '') lines.pop();

                    return (
                      <span key={index} className={className + " block"}>
                        {lines.map((l, i) => (
                          <div key={i} className="flex">
                            <span className="w-6 shrink-0 opacity-50 select-none">{prefix}</span>
                            <span className="break-all">{l}</span>
                          </div>
                        ))}
                      </span>
                    );
                  } else {
                    return <span key={index} className={className}>{part.value}</span>;
                  }
                })}
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}
