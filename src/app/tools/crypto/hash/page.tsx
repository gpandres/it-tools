"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CryptoJS from "crypto-js";

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [encoding, setEncoding] = useState<"hex" | "base64">("hex");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hashes = useMemo(() => {
    if (!input) {
      return {
        MD5: "",
        "SHA-1": "",
        "SHA-256": "",
        "SHA-512": "",
        "SHA-3": "",
      };
    }

    const encode = (words: CryptoJS.lib.WordArray) => {
      if (encoding === "base64") {
        return CryptoJS.enc.Base64.stringify(words);
      }
      return CryptoJS.enc.Hex.stringify(words);
    };

    return {
      MD5: encode(CryptoJS.MD5(input)),
      "SHA-1": encode(CryptoJS.SHA1(input)),
      "SHA-256": encode(CryptoJS.SHA256(input)),
      "SHA-512": encode(CryptoJS.SHA512(input)),
      "SHA-3": encode(CryptoJS.SHA3(input)),
    };
  }, [input, encoding]);

  return (
    <ToolLayout 
      title="Hash Generators" 
      description="Generate multiple cryptographic hashes (MD5, SHA-1, SHA-2, SHA-3) simultaneously."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        
        {/* Input */}
        <article className="border border-[#1a1a1a] bg-[#050505] rounded-none flex flex-col h-[250px] lg:h-auto lg:sticky lg:top-24">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Input Text</span>
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
          <div className="p-0 flex-1 flex flex-col">
            <Label htmlFor="hash-input" className="sr-only">Input text</Label>
            <Textarea
              id="hash-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type something..."
              className="w-full flex-1 p-6 font-mono text-sm bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-[#00ff9c]/50 resize-none custom-scrollbar text-zinc-300"
              spellCheck={false}
            />
          </div>
          
          <div className="p-4 border-t border-[#1a1a1a] flex items-center justify-between bg-black">
            <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Output Encoding</Label>
            <div className="flex items-center border border-[#1a1a1a] rounded-none">
              <button 
                onClick={() => setEncoding("hex")}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors ${encoding === "hex" ? "bg-[#ffb000]/10 text-[#ffb000]" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                HEX
              </button>
              <div className="w-px h-full bg-[#1a1a1a]"></div>
              <button 
                onClick={() => setEncoding("base64")}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors ${encoding === "base64" ? "bg-[#ffb000]/10 text-[#ffb000]" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                BASE64
              </button>
            </div>
          </div>
        </article>

        {/* Outputs */}
        <div className="flex flex-col gap-4">
          {Object.entries(hashes).map(([algo, hash]) => (
            <article key={algo} className="border border-[#1a1a1a] bg-[#050505] rounded-none flex flex-col">
              <header className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <span className="text-[#00ff9c] text-xs">[OUT]</span>
                  <span className="text-[#00ff9c] text-sm font-semibold uppercase tracking-widest glow">{algo}</span>
                  {algo === "MD5" && (
                    <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 border border-red-500/20 ml-2 rounded-none">Legacy / Insecure</span>
                  )}
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  disabled={!hash}
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors disabled:opacity-30"
                  onClick={() => copy(hash, algo)}
                >
                  {copiedKey === algo ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                </Button>
              </header>
              <div className="p-4 flex items-center min-h-[60px]">
                {hash ? (
                  <span className="font-mono text-sm text-zinc-300 break-all leading-relaxed">
                    {hash}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-zinc-700 select-none">Awaiting input...</span>
                )}
              </div>
            </article>
          ))}
        </div>

      </div>
    </ToolLayout>
  );
}
