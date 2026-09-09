"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as yaml from "js-yaml";

export default function JsonYamlConverter() {
  const [jsonText, setJsonText] = useState("");
  const [yamlText, setYamlText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [yamlError, setYamlError] = useState<string | null>(null);
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    setJsonError(null);
    setYamlError(null);
    
    if (!val.trim()) {
      setYamlText("");
      return;
    }

    try {
      const parsed = JSON.parse(val);
      const converted = yaml.dump(parsed, { indent: 2 });
      setYamlText(converted);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleYamlChange = (val: string) => {
    setYamlText(val);
    setYamlError(null);
    setJsonError(null);
    
    if (!val.trim()) {
      setJsonText("");
      return;
    }

    try {
      const parsed = yaml.load(val);
      if (typeof parsed === "object" && parsed !== null) {
        const converted = JSON.stringify(parsed, null, 2);
        setJsonText(converted);
      } else {
        setJsonText(String(parsed));
      }
    } catch (e) {
      setYamlError((e as Error).message);
    }
  };

  return (
    <ToolLayout 
      title="JSON ⇄ YAML Converter" 
      description="Bidirectional converter between JSON and YAML. Type in either box to convert instantly."
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        
        {/* JSON Side */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-full rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN/OUT]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">JSON</span>
            </div>
            <div className="flex items-center gap-2">
              {jsonText && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors border border-transparent hover:border-[#00ff9c]/30"
                  onClick={() => copy(jsonText, "json")}
                >
                  {copiedKey === "json" ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                </Button>
              )}
              {jsonText && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  onClick={() => handleJsonChange("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </header>
          <div className="p-0 flex-1 flex flex-col relative">
            <Label htmlFor="json-input" className="sr-only">JSON Input</Label>
            <Textarea
              id="json-input"
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Paste JSON here..."
              className={`w-full flex-1 p-4 font-mono text-sm bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-[#ffb000]/50 resize-none custom-scrollbar ${jsonError ? "text-red-400" : "text-amber-300"}`}
              spellCheck={false}
            />
            {jsonError && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-red-950/80 border-t border-red-900/50 text-red-400 font-mono text-xs break-all">
                [ERR] {jsonError}
              </div>
            )}
          </div>
        </article>

        {/* YAML Side */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-full rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN/OUT]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">YAML</span>
            </div>
            <div className="flex items-center gap-2">
              {yamlText && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors border border-transparent hover:border-[#00ff9c]/30"
                  onClick={() => copy(yamlText, "yaml")}
                >
                  {copiedKey === "yaml" ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                </Button>
              )}
              {yamlText && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  onClick={() => handleYamlChange("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </header>
          <div className="p-0 flex-1 flex flex-col relative">
            <Label htmlFor="yaml-input" className="sr-only">YAML Input</Label>
            <Textarea
              id="yaml-input"
              value={yamlText}
              onChange={(e) => handleYamlChange(e.target.value)}
              placeholder="Paste YAML here..."
              className={`w-full flex-1 p-4 font-mono text-sm bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-[#00ff9c]/50 resize-none custom-scrollbar ${yamlError ? "text-red-400" : "text-blue-300"}`}
              spellCheck={false}
            />
            {yamlError && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-red-950/80 border-t border-red-900/50 text-red-400 font-mono text-xs break-all">
                [ERR] {yamlError}
              </div>
            )}
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}
