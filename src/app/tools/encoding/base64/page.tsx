"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowDownUp } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

// Helpers for Unicode-safe Base64
function utf8ToBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
  } catch (e) {
    return "";
  }
}

function base64ToUtf8(str: string): string {
  try {
    return decodeURIComponent(atob(str).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    throw new Error("Invalid Base64 sequence");
  }
}

export default function Base64Converter() {
  const [raw, setRaw] = useState("");
  const [base64, setBase64] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedB64, setCopiedB64] = useState(false);

  const handleRawChange = (value: string) => {
    setRaw(value);
    setError(null);
    setBase64(utf8ToBase64(value));
  };

  const handleBase64Change = (value: string) => {
    setBase64(value);
    if (!value) {
      setRaw("");
      setError(null);
      return;
    }
    
    try {
      const decoded = base64ToUtf8(value);
      setRaw(decoded);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const copy = (text: string, isRaw: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isRaw) {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } else {
      setCopiedB64(true);
      setTimeout(() => setCopiedB64(false), 2000);
    }
  };

  return (
    <ToolLayout 
      title="Base64 Encoder/Decoder" 
      description="Convert text or data to and from Base64 encoding. Supports UTF-8 characters."
    >
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
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
              <span className="text-[#00ff9c] text-sm font-semibold glow uppercase tracking-widest">Base64 Encoded</span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors"
              onClick={() => copy(base64, false)}
            >
              {copiedB64 ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </header>
          <div className="p-4 relative">
            <Label htmlFor="b64-text" className="sr-only">Base64 text</Label>
            <Textarea
              id="b64-text"
              placeholder="Type or paste Base64 here..."
              value={base64}
              onChange={(e) => handleBase64Change(e.target.value)}
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
