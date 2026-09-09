"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Copy, Check, Minimize2, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<number | string>(2);
  const [copied, setCopied] = useState(false);

  let output = "";
  let error = "";

  if (input.trim()) {
    try {
      const parsed = JSON.parse(input);
      output = JSON.stringify(parsed, null, indent === "tab" ? "\t" : Number(indent));
    } catch (e) {
      error = (e as Error).message;
    }
  }

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout 
      title="JSON Formatter" 
      description="Format, validate, and minify JSON data."
    >
      <div className="flex justify-end mb-4 gap-2">
        <div className="flex bg-black border border-[#1a1a1a] rounded-none">
          <button 
            onClick={() => setIndent(2)}
            className={`font-mono text-xs px-3 py-1.5 transition-colors ${indent === 2 ? "bg-[#00ff9c]/10 text-[#00ff9c]" : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]"}`}
          >
            2 Spaces
          </button>
          <div className="w-px bg-[#1a1a1a]" />
          <button 
            onClick={() => setIndent(4)}
            className={`font-mono text-xs px-3 py-1.5 transition-colors ${indent === 4 ? "bg-[#00ff9c]/10 text-[#00ff9c]" : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]"}`}
          >
            4 Spaces
          </button>
          <div className="w-px bg-[#1a1a1a]" />
          <button 
            onClick={() => setIndent("tab")}
            className={`font-mono text-xs px-3 py-1.5 transition-colors ${indent === "tab" ? "bg-[#00ff9c]/10 text-[#00ff9c]" : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]"}`}
          >
            Tabs
          </button>
          <div className="w-px bg-[#1a1a1a]" />
          <button 
            onClick={() => setIndent(0)}
            className={`flex items-center gap-1 font-mono text-xs px-3 py-1.5 transition-colors ${indent === 0 ? "bg-[#ffb000]/10 text-[#ffb000]" : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]"}`}
          >
            <Minimize2 className="w-3 h-3" /> Minify
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-[calc(100vh-250px)] rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Raw JSON</span>
            </div>
            {input && (
              <Button 
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                onClick={() => setInput("")}
              >
                Clear
              </Button>
            )}
          </header>
          <div className="flex-1 flex flex-col">
            <Label htmlFor="json-input" className="sr-only">Raw JSON</Label>
            <Textarea
              id="json-input"
              placeholder="Paste your unformatted JSON here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 w-full p-4 font-mono text-sm bg-black border-none text-zinc-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              spellCheck={false}
            />
          </div>
        </article>

        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-[calc(100vh-250px)] rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center gap-2 uppercase tracking-widest">
                Formatted <span className="cursor-blink">_</span>
              </span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors"
              onClick={copy}
            >
              {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </header>
          <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
            {!input ? (
              <div className="p-6 text-zinc-600 font-mono text-sm">
                [WAITING] Awaiting JSON input...
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-none">
                  <h3 className="text-red-400 font-mono text-sm mb-2 flex items-center gap-2">
                    <span className="bg-red-500 text-white px-1 text-xs rounded-none">ERROR</span> Invalid JSON
                  </h3>
                  <p className="text-red-300/70 font-mono text-xs">{error}</p>
                </div>
              </div>
            ) : (
              <Textarea
                readOnly
                value={output}
                className="flex-1 w-full p-4 font-mono text-sm bg-transparent border-none text-[#00ff9c]/80 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none whitespace-pre"
                spellCheck={false}
              />
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}
