"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Check, ShieldAlert, ShieldCheck, Link2Off, Link2 } from "lucide-react";
import { useState, useMemo } from "react";

function decodeCorporateLinks(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Microsoft Safelinks
    if (urlObj.hostname.includes("safelinks.protection.outlook.com")) {
      const target = urlObj.searchParams.get("url");
      if (target) return decodeURIComponent(target);
    }
    
    // Proofpoint URLDefense v2
    if (urlObj.hostname.includes("urldefense.proofpoint.com") || urlObj.hostname.includes("urldefense.com")) {
      const target = urlObj.searchParams.get("u");
      if (target) {
        // Proofpoint v2 encodes with '-' instead of '%'
        const decoded = target.replace(/-/g, '%').replace(/_/g, '/');
        return decodeURIComponent(decoded);
      }
    }
  } catch (e) {
    // If it's not a valid URL yet, just return it
  }
  return url;
}

function defang(url: string): string {
  return url
    .replace(/http/gi, "hxxp")
    .replace(/\./g, "[.]");
}

function refang(url: string): string {
  return url
    .replace(/hxxp/gi, "http")
    .replace(/\[\.\]/g, ".");
}

function DefangerContent() {
  const [state, setState] = useState({ input: "https://nam01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fevil-phishing-site.com%2Flogin&data=05..." });
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"defang" | "refang" | "decode">("defang");

  const output = useMemo(() => {
    if (!state.input) return "";
    
    const lines = state.input.split('\n');
    return lines.map(line => {
      let processed = line.trim();
      if (!processed) return "";
      
      if (mode === "decode") {
        processed = decodeCorporateLinks(processed);
      } else if (mode === "defang") {
        processed = decodeCorporateLinks(processed); // always decode first
        processed = defang(processed);
      } else if (mode === "refang") {
        processed = refang(processed);
      }
      return processed;
    }).join('\n');
    
  }, [state.input, mode]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ToolLayout 
      title="URL Defanger & Safelink Decoder" 
      description="Extract original URLs from MS Safelinks/Proofpoint, and Defang IOCs (hxxps://evil[.]com) for safe sharing in incident reports."
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Input */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col min-h-[400px]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Input URLs</span>
            </div>
            <div className="flex bg-black border border-[#1a1a1a] rounded p-1 gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setMode("defang")}
                className={`h-7 px-3 text-xs font-mono rounded-sm transition-colors ${mode === "defang" ? "bg-[#00ff9c]/20 text-[#00ff9c]" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Link2Off className="w-3 h-3 mr-2" /> Defang
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setMode("refang")}
                className={`h-7 px-3 text-xs font-mono rounded-sm transition-colors ${mode === "refang" ? "bg-[#00ff9c]/20 text-[#00ff9c]" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Link2 className="w-3 h-3 mr-2" /> Refang
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setMode("decode")}
                className={`h-7 px-3 text-xs font-mono rounded-sm transition-colors ${mode === "decode" ? "bg-amber-500/20 text-amber-500" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <ShieldAlert className="w-3 h-3 mr-2" /> Decode Only
              </Button>
            </div>
          </header>
          <div className="p-0 flex-1">
            <Textarea 
              value={state.input}
              onChange={(e) => setState({ input: e.target.value })}
              className="w-full h-full min-h-[350px] bg-black border-none text-zinc-300 font-mono text-sm p-6 focus-visible:ring-1 focus-visible:ring-[#00ff9c] rounded-none resize-none custom-scrollbar"
              placeholder="Paste URLs here (one per line)..."
            />
          </div>
        </article>

        {/* Output */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col min-h-[400px]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow uppercase tracking-widest">
                {mode === "defang" ? "Defanged IOCs" : mode === "refang" ? "Refanged URLs" : "Original Extracted URLs"}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy}
              className="h-7 text-xs font-mono text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 rounded-none border border-transparent hover:border-[#00ff9c]/30"
            >
              {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
              Copy
            </Button>
          </header>
          <div className="p-0 flex-1 bg-black relative">
            <Textarea
              readOnly
              value={output}
              className="w-full h-full min-h-[350px] bg-transparent border-none font-mono text-sm p-6 focus-visible:ring-0 rounded-none resize-none custom-scrollbar text-[#00ff9c]"
            />
          </div>
          
          <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] p-3 flex gap-4 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500/70" /> 
              <span>Supports Microsoft Safelinks</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500/70" /> 
              <span>Supports Proofpoint URLDefense (v2)</span>
            </div>
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}

export default function DefangerTool() {
  return (
    <DefangerContent />
  );
}
