"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowDownUp } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function UrlConverter() {
  const [raw, setRaw] = useState("");
  const [encoded, setEncoded] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedEncoded, setCopiedEncoded] = useState(false);
  const [useComponent, setUseComponent] = useState(true);

  const handleRawChange = (value: string, mode: boolean = useComponent) => {
    setRaw(value);
    setError(null);
    try {
      setEncoded(mode ? encodeURIComponent(value) : encodeURI(value));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleEncodedChange = (value: string, mode: boolean = useComponent) => {
    setEncoded(value);
    if (!value) {
      setRaw("");
      setError(null);
      return;
    }
    
    try {
      const decoded = mode ? decodeURIComponent(value) : decodeURI(value);
      setRaw(decoded);
      setError(null);
    } catch (e) {
      setError("Invalid URI sequence");
    }
  };

  const toggleMode = () => {
    const newMode = !useComponent;
    setUseComponent(newMode);
    // Re-calculate based on raw
    handleRawChange(raw, newMode);
  };

  const copy = (text: string, isRaw: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isRaw) {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } else {
      setCopiedEncoded(true);
      setTimeout(() => setCopiedEncoded(false), 2000);
    }
  };

  return (
    <ToolLayout 
      title="URL Encoder/Decoder" 
      description="Safely encode and decode URL parameters or entire URIs."
    >
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex justify-end">
          <button 
            onClick={toggleMode}
            className={`font-mono text-xs px-3 py-1.5 border transition-colors rounded-none ${
              useComponent 
                ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" 
                : "border-[#1a1a1a] text-zinc-500 bg-black hover:border-zinc-700"
            }`}
          >
            Mode: {useComponent ? "encodeURIComponent" : "encodeURI"}
          </button>
        </div>

        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN/OUT]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Raw Text</span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors"
              onClick={() => copy(raw, true)}
            >
              {copiedRaw ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </header>
          <div className="p-4">
            <Label htmlFor="raw-text" className="sr-only">Raw text</Label>
            <Textarea
              id="raw-text"
              placeholder="Type or paste raw text here..."
              value={raw}
              onChange={(e) => handleRawChange(e.target.value)}
              className="min-h-[200px] font-mono bg-black border-[#1a1a1a] text-zinc-300 rounded-none focus-visible:ring-[#00ff9c] resize-y"
            />
          </div>
        </article>

        <div className="flex justify-center -my-3 z-10 relative pointer-events-none">
          <div className="bg-[#050505] border border-[#1a1a1a] p-2 text-zinc-600">
            <ArrowDownUp className="w-5 h-5" />
          </div>
        </div>

        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN/OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow uppercase tracking-widest">URL Encoded</span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors"
              onClick={() => copy(encoded, false)}
            >
              {copiedEncoded ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </header>
          <div className="p-4 relative">
            <Label htmlFor="encoded-text" className="sr-only">URL Encoded text</Label>
            <Textarea
              id="encoded-text"
              placeholder="Type or paste URL encoded text here..."
              value={encoded}
              onChange={(e) => handleEncodedChange(e.target.value)}
              className={`min-h-[200px] font-mono bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] resize-y ${
                error ? "text-red-400 border-red-500 focus-visible:ring-red-500" : "text-zinc-300"
              }`}
            />
            {error && (
              <div className="absolute bottom-6 right-6 px-3 py-1 bg-red-950/80 border border-red-500/50 text-red-400 text-xs font-mono backdrop-blur-sm pointer-events-none">
                [ERR] {error}
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}
