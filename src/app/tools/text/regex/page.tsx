"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { Copy, Check, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegexTester() {
  const [regexStr, setRegexStr] = useState("(?<=\\s|^)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})");
  const [flags, setFlags] = useState("gm");
  const [testText, setTestText] = useState("Contact us at support@example.com or sales@company.net for more info.\nAlso test invalid-email@... \nHello admin@localhost.dev");
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  const regexData = useMemo(() => {
    if (!regexStr) return { regex: null, error: null, matches: [] };
    
    try {
      // Create the RegExp
      // If the global flag is missing but they want multiple matches, we might just use matchAll if g is present.
      // JS String.matchAll requires the global flag. If 'g' is missing, we add it just for extraction,
      // or we just respect their flags. Let's strictly respect their flags, but if 'g' is missing, 
      // matchAll throws. So if no 'g', we do a single exec().
      const isGlobal = flags.includes("g");
      const r = new RegExp(regexStr, flags);
      
      const matches: RegExpExecArray[] = [];
      let match: RegExpExecArray | null;
      
      if (isGlobal) {
        while ((match = r.exec(testText)) !== null) {
          matches.push(match);
          if (match[0].length === 0) {
            r.lastIndex++; // Prevent infinite loops on zero-length matches
          }
        }
      } else {
        match = r.exec(testText);
        if (match) matches.push(match);
      }
      
      return { regex: r, error: null, matches };
    } catch (e) {
      return { regex: null, error: (e as Error).message, matches: [] };
    }
  }, [regexStr, flags, testText]);

  // Construct highlighted text for the output
  const renderHighlightedText = () => {
    if (regexData.error || !regexStr || !testText) return <span className="text-zinc-500">{testText || "Awaiting input..."}</span>;
    if (regexData.matches.length === 0) return <span className="text-zinc-400">{testText}</span>;

    const elements = [];
    let lastIndex = 0;
    
    let matchIdx = 0;
    for (const match of regexData.matches) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      
      // Push text before match
      if (startIndex > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`} className="text-zinc-400">
            {testText.substring(lastIndex, startIndex)}
          </span>
        );
      }
      
      // Push the match itself
      // Use alternating colors for matches that are consecutive to distinguish them, or just one bright color
      elements.push(
        <span 
          key={`match-${startIndex}`} 
          className="bg-[#00ff9c]/20 text-[#00ff9c] px-0.5 rounded-sm border-b border-[#00ff9c]/50 font-bold"
          title={`Match ${matchIdx + 1}`}
        >
          {match[0]}
        </span>
      );
      
      lastIndex = endIndex;
      matchIdx++;
    }
    
    // Push remaining text
    if (lastIndex < testText.length) {
      elements.push(
        <span key={`text-${lastIndex}`} className="text-zinc-400">
          {testText.substring(lastIndex)}
        </span>
      );
    }
    
    return elements;
  };

  return (
    <ToolLayout 
      title="Regex Tester" 
      description="Test regular expressions in real-time with syntax highlighting and match extraction."
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        
        {/* Regex Input Header */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col relative rounded-none">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#ffb000]"></div>
          <div className="pl-6 pr-4 py-4 flex flex-col md:flex-row items-center gap-4">
            <span className="text-zinc-500 font-mono text-2xl hidden md:block">/</span>
            <div className="flex-1 w-full">
              <Input
                type="text"
                value={regexStr}
                onChange={(e) => setRegexStr(e.target.value)}
                placeholder="Enter regular expression..."
                className={`w-full font-mono text-lg bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-[#ffb000]/50 h-12 text-[#ffb000] ${regexData.error ? 'text-red-400' : ''}`}
                spellCheck={false}
              />
            </div>
            <span className="text-zinc-500 font-mono text-2xl hidden md:block">/</span>
            
            {/* Flags */}
            <div className="flex items-center bg-black border border-[#1a1a1a] h-10 px-1 shrink-0">
              {(["g", "i", "m", "s", "u", "y"] as const).map(flag => {
                const isActive = flags.includes(flag);
                const title = {
                  "g": "Global",
                  "i": "Case Insensitive",
                  "m": "Multiline",
                  "s": "DotAll",
                  "u": "Unicode",
                  "y": "Sticky"
                }[flag];
                
                return (
                  <button
                    key={flag}
                    onClick={() => toggleFlag(flag)}
                    title={title}
                    className={`w-8 h-8 flex items-center justify-center font-mono text-xs transition-colors ${isActive ? "text-[#ffb000] bg-[#ffb000]/10 font-bold" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    {flag}
                  </button>
                );
              })}
            </div>
          </div>
          {regexData.error && (
            <div className="bg-red-950/50 border-t border-red-900/50 px-6 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-400 font-mono text-xs">{regexData.error}</span>
            </div>
          )}
          <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 py-2 flex items-center gap-3 overflow-x-auto custom-scrollbar whitespace-nowrap">
            <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest shrink-0">Examples:</span>
            {[
              { label: "Email", val: "(?<=\\s|^)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})" },
              { label: "IPv4", val: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b" },
              { label: "MAC Address", val: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$" },
              { label: "URL", val: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)" }
            ].map(ex => (
              <button
                key={ex.label}
                onClick={() => setRegexStr(ex.val)}
                className="font-mono text-[10px] px-2 py-1 text-zinc-400 border border-[#1a1a1a] hover:text-[#ffb000] hover:border-[#ffb000]/50 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </article>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
          
          {/* Test String Input */}
          <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-full rounded-none">
            <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <span className="text-[#00ff9c] text-xs">[IN]</span>
                <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Test String</span>
              </div>
            </header>
            <div className="p-0 flex-1 flex flex-col relative">
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type text to test your regex against..."
                className="w-full flex-1 p-4 font-mono text-sm bg-black border-none rounded-none focus-visible:ring-1 focus-visible:ring-zinc-700 resize-none custom-scrollbar text-zinc-300"
                spellCheck={false}
              />
            </div>
          </article>

          {/* Matches Output */}
          <div className="flex flex-col gap-6 h-full">
            
            {/* Highlighted Text */}
            <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col flex-1 min-h-0 rounded-none">
              <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <span className="text-[#00ff9c] text-xs">[OUT]</span>
                  <span className="text-[#00ff9c] text-sm font-semibold uppercase tracking-widest">Highlighted</span>
                </div>
                {regexData.matches.length > 0 && (
                  <span className="bg-[#00ff9c]/10 text-[#00ff9c] px-2 py-0.5 text-[10px] font-mono border border-[#00ff9c]/30 rounded-none">
                    {regexData.matches.length} Match{regexData.matches.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </header>
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-black font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">
                {renderHighlightedText()}
              </div>
            </article>

            {/* Match Data / Groups */}
            <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col flex-1 min-h-0 rounded-none">
              <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <span className="text-[#00ff9c] text-xs">[OUT]</span>
                  <span className="text-[#00ff9c] text-sm font-semibold uppercase tracking-widest">Capture Groups</span>
                </div>
              </header>
              <div className="p-0 flex-1 overflow-y-auto custom-scrollbar bg-black font-mono text-xs">
                {regexData.matches.length === 0 ? (
                  <div className="p-4 text-zinc-600">No matches found.</div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#1a1a1a]">
                    {regexData.matches.map((match, i) => (
                      <div key={i} className="flex flex-col">
                        <div className="px-4 py-1.5 bg-[#0a0a0a] text-zinc-500 font-bold flex items-center justify-between">
                          <span>Match {i + 1}</span>
                          <span>Index: {match.index}</span>
                        </div>
                        <div className="px-4 py-2 text-zinc-300">
                          {match[0]}
                        </div>
                        {match.length > 1 && (
                          <div className="px-4 py-2 bg-zinc-950 flex flex-col gap-1 border-t border-[#1a1a1a]/50">
                            {match.slice(1).map((group, gIdx) => (
                              group !== undefined && (
                                <div key={gIdx} className="flex items-center gap-2">
                                  <span className="text-purple-400 opacity-70 w-16">Group {gIdx + 1}:</span>
                                  <span className="text-purple-300">{group}</span>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
            
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
