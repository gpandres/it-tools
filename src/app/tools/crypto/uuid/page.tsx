"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from "uuid";
import { ulid } from "ulid";

export default function UuidGenerator() {
  const [output, setOutput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<"uuid-v1" | "uuid-v4" | "uuid-v7" | "ulid">("uuid-v4");
  
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generate = () => {
    const qty = Math.min(Math.max(1, quantity), 1000);
    const results: string[] = [];

    // All these generators use high-entropy Crypto APIs (CSPRNG) by default in modern environments
    for (let i = 0; i < qty; i++) {
      if (type === "uuid-v1") results.push(uuidv1());
      else if (type === "uuid-v4") results.push(uuidv4());
      else if (type === "uuid-v7") results.push(uuidv7());
      else if (type === "ulid") results.push(ulid());
    }

    setOutput(results.join("\n"));
  };

  return (
    <ToolLayout 
      title="UUID & ULID Generator" 
      description="Generate secure, high-entropy unique identifiers using cryptographically secure random number generators (CSPRNG)."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        {/* Configuration */}
        <article className="border border-[#1a1a1a] bg-[#050505] rounded-none flex flex-col h-fit">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold uppercase tracking-widest glow-amber">Configuration</span>
            </div>
          </header>
          <div className="p-6 flex flex-col gap-6">
            
            <div className="space-y-3">
              <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Format Version</Label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setType("uuid-v4")}
                  className={`text-left px-4 py-2 font-mono text-sm border transition-colors rounded-none ${type === "uuid-v4" ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                >
                  <span className="block font-bold">UUID v4</span>
                  <span className="block text-[10px] mt-1 opacity-70">100% Random (CSPRNG). Most common.</span>
                </button>
                <button
                  onClick={() => setType("uuid-v7")}
                  className={`text-left px-4 py-2 font-mono text-sm border transition-colors rounded-none ${type === "uuid-v7" ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                >
                  <span className="block font-bold">UUID v7</span>
                  <span className="block text-[10px] mt-1 opacity-70">Time-sorted + Random. Database friendly.</span>
                </button>
                <button
                  onClick={() => setType("ulid")}
                  className={`text-left px-4 py-2 font-mono text-sm border transition-colors rounded-none ${type === "ulid" ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                >
                  <span className="block font-bold">ULID</span>
                  <span className="block text-[10px] mt-1 opacity-70">Universally Unique Lexicographically Sortable.</span>
                </button>
                <button
                  onClick={() => setType("uuid-v1")}
                  className={`text-left px-4 py-2 font-mono text-sm border transition-colors rounded-none ${type === "uuid-v1" ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                >
                  <span className="block font-bold">UUID v1</span>
                  <span className="block text-[10px] mt-1 text-red-400/80">Uses MAC + Time. Privacy risks.</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Quantity</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-10 text-zinc-200"
              />
            </div>

            <Button 
              onClick={generate}
              className="mt-4 w-full rounded-none font-mono tracking-widest uppercase border border-[#ffb000] text-[#ffb000] bg-transparent hover:bg-[#ffb000]/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Generate
            </Button>

          </div>
        </article>

        {/* Output */}
        <article className="lg:col-span-2 border border-[#1a1a1a] bg-[#050505] rounded-none flex flex-col min-h-[500px]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#ffb000] text-xs">[OUT]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Generated IDs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-purple-400 mr-2 border border-purple-400/30 px-2 py-0.5 bg-purple-900/10 hidden sm:block rounded-none">
                CSPRNG / High Entropy
              </span>
              <Button 
                variant="ghost"
                size="sm"
                disabled={!output}
                className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors border border-transparent hover:border-[#00ff9c]/30 disabled:opacity-30"
                onClick={copy}
              >
                {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                disabled={!output}
                className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors disabled:opacity-30"
                onClick={() => setOutput("")}
              >
                Clear
              </Button>
            </div>
          </header>
          <div className="p-0 flex-1 flex flex-col">
            <Label htmlFor="uuid-output" className="sr-only">Output IDs</Label>
            <Textarea
              id="uuid-output"
              readOnly
              value={output}
              placeholder="Output will appear here..."
              className="flex-1 w-full p-6 font-mono text-base leading-relaxed bg-black border-none text-zinc-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none custom-scrollbar whitespace-pre"
              spellCheck={false}
            />
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}
