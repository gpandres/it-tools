"use client";

import { ToolLayout } from "@/components/tool-layout";
import { useToolUrlState } from "@/hooks/use-tool-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import zxcvbn from "zxcvbn";

function generateSecurePassword(length: number, useUpper: boolean, useLower: boolean, useNums: boolean, useSyms: boolean): string {
  let charset = "";
  if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
  if (useNums) charset += "0123456789";
  if (useSyms) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  if (charset === "") return "";

  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

function PasswordGeneratorContent() {
  const [state, setState] = useToolUrlState({ 
    len: "16", 
    u: "1", 
    l: "1",
    n: "1",
    s: "1"
  });

  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [customInput, setCustomInput] = useState(false);

  const length = parseInt(state.len, 10) || 16;
  const useUpper = state.u === "1";
  const useLower = state.l === "1";
  const useNums = state.n === "1";
  const useSyms = state.s === "1";

  const generate = useCallback(() => {
    setPassword(generateSecurePassword(length, useUpper, useLower, useNums, useSyms));
    setCopied(false);
    setCustomInput(false);
  }, [length, useUpper, useLower, useNums, useSyms]);

  // Initial generation only (don't re-generate when sliding if user has custom input)
  useEffect(() => {
    if (!customInput && !password) {
      generate();
    }
  }, [generate, customInput, password]);

  // Regenerate if they slide while not in custom input mode
  useEffect(() => {
    if (!customInput && password) {
      setPassword(generateSecurePassword(length, useUpper, useLower, useNums, useSyms));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUpper, useLower, useNums, useSyms]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleToggle = (key: string, current: string) => {
    setState({ [key]: current === "1" ? "0" : "1" });
    setCustomInput(false); // Reset to auto-gen mode
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setCustomInput(true);
  };

  const analysis = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  const getScoreColor = (score: number) => {
    switch (score) {
      case 0:
      case 1: return "text-red-500 border-red-500 bg-red-500/10";
      case 2: return "text-orange-500 border-orange-500 bg-orange-500/10";
      case 3: return "text-yellow-400 border-yellow-400 bg-yellow-400/10";
      case 4: return "text-[#00ff9c] border-[#00ff9c] bg-[#00ff9c]/10";
      default: return "text-zinc-500 border-zinc-500 bg-zinc-500/10";
    }
  };
  
  const getScoreLabel = (score: number) => {
    switch (score) {
      case 0: return "VERY WEAK";
      case 1: return "WEAK";
      case 2: return "FAIR";
      case 3: return "GOOD";
      case 4: return "STRONG";
      default: return "UNKNOWN";
    }
  };

  return (
    <ToolLayout 
      title="Password Entropy Calculator" 
      description="Generate or test passwords locally. Analyzes entropy, cracking time estimates, and weak patterns using Dropbox's zxcvbn."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto">
        
        {/* SETTINGS PANEL */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col lg:col-span-4 h-fit">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN]</span>
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Generator</span>
          </header>
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Length</Label>
                <span className="text-[#00ff9c] font-mono text-sm">[{length}]</span>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="range"
                  min="4"
                  max="128"
                  value={length}
                  onChange={(e) => setState({ len: e.target.value })}
                  className="flex-1 accent-[#00ff9c]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Character Sets</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <ToggleOption label="Uppercase [A-Z]" active={useUpper} onClick={() => toggleToggle("u", state.u)} />
                <ToggleOption label="Lowercase [a-z]" active={useLower} onClick={() => toggleToggle("l", state.l)} />
                <ToggleOption label="Numbers [0-9]" active={useNums} onClick={() => toggleToggle("n", state.n)} />
                <ToggleOption label="Symbols [!@#]" active={useSyms} onClick={() => toggleToggle("s", state.s)} />
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={generate}
                className="w-full bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20 hover:border-[#00ff9c] rounded-none font-mono uppercase tracking-widest transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Random
              </Button>
            </div>
            
            <div className="bg-blue-900/10 border border-blue-900/30 p-4 flex items-start gap-3 mt-4">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300/80 font-mono leading-relaxed">
                You can also type your own password directly into the output box to test its strength!
              </div>
            </div>
          </div>
        </article>

        {/* OUTPUT & ANALYSIS PANEL */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col lg:col-span-8">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center gap-2 uppercase tracking-widest">
                Password Analysis <span className="cursor-blink">_</span>
              </span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors border border-transparent hover:border-[#00ff9c]/30"
            >
              {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </header>
          
          <div className="p-6 flex flex-col flex-1 space-y-6 bg-black">
            {/* Password Input/Output */}
            <div className="space-y-2">
              <Label className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Test or Copy Password</Label>
              <Input
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Type a password to audit..."
                className="font-mono text-lg md:text-xl py-6 bg-[#050505] border-[#1a1a1a] text-zinc-200 rounded-none focus-visible:ring-[#00ff9c]/50 text-center"
                spellCheck={false}
              />
            </div>

            {/* Analysis Results */}
            {analysis && password && (
              <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Score Header */}
                <div className={`p-4 border flex items-center justify-between ${getScoreColor(analysis.score)}`}>
                  <div className="flex items-center gap-3">
                    {analysis.score < 3 ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    <div className="font-mono">
                      <div className="text-xs opacity-70 uppercase tracking-widest">Overall Score</div>
                      <div className="text-xl font-bold uppercase tracking-widest">{getScoreLabel(analysis.score)}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs opacity-70 uppercase tracking-widest">Entropy</div>
                    <div className="text-xl font-bold">{Math.round(analysis.guesses_log10 * 3.321928)} bits</div>
                  </div>
                </div>

                {/* Warnings and Suggestions */}
                {(analysis.feedback.warning || analysis.feedback.suggestions.length > 0) && (
                  <div className="bg-orange-500/5 border border-orange-500/20 p-4 space-y-3">
                    {analysis.feedback.warning && (
                      <div className="flex items-start gap-2 text-orange-400 font-mono text-sm">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span><strong>Warning:</strong> {analysis.feedback.warning}</span>
                      </div>
                    )}
                    {analysis.feedback.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-orange-400/70 font-mono text-xs pl-6">
                        <span>• {suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cracking Times Table */}
                <div className="border border-[#1a1a1a] bg-[#050505]">
                  <header className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                    <span className="text-blue-400 text-xs font-mono uppercase tracking-widest">Estimated Cracking Times</span>
                  </header>
                  <div className="divide-y divide-[#1a1a1a]">
                    <TimeRow 
                      label="Online Attack (100 / hour)" 
                      desc="No throttling, typical web login"
                      time={analysis.crack_times_display.online_no_throttling_10_per_second} 
                    />
                    <TimeRow 
                      label="Offline Attack (Slow Hash)" 
                      desc="bcrypt, scrypt, Argon2 (10k / second)"
                      time={analysis.crack_times_display.offline_slow_hashing_1e4_per_second} 
                    />
                    <TimeRow 
                      label="Offline Attack (Fast Hash)" 
                      desc="MD5, SHA-1, NTLM on GPU cluster (100B / second)"
                      time={analysis.crack_times_display.offline_fast_hashing_1e10_per_second} 
                    />
                  </div>
                </div>
                
                {/* Match Details */}
                {analysis.sequence.length > 0 && (
                  <div className="text-xs font-mono text-zinc-600">
                    <span className="uppercase tracking-widest mb-2 block text-zinc-500">Pattern Matches Detected:</span>
                    <div className="flex flex-wrap gap-2">
                      {analysis.sequence.map((match, idx) => (
                        <span key={idx} className="bg-[#1a1a1a] px-2 py-1 border border-[#2a2a2a]">
                          {match.pattern} ({match.token})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}

function TimeRow({ label, desc, time }: { label: string, desc: string, time: string }) {
  // Color code based on time unit
  let color = "text-zinc-300";
  if (time === "centuries") color = "text-[#00ff9c] font-bold";
  else if (time.includes("years") || time.includes("months")) color = "text-yellow-400";
  else if (time === "instant" || time.includes("seconds") || time.includes("minutes") || time.includes("hours")) color = "text-red-500 font-bold";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
      <div>
        <div className="text-sm font-mono text-zinc-300">{label}</div>
        <div className="text-xs font-mono text-zinc-600">{desc}</div>
      </div>
      <div className={`font-mono text-sm uppercase tracking-widest ${color}`}>
        {time}
      </div>
    </div>
  );
}

function ToggleOption({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 border font-mono text-xs transition-all text-left ${
        active 
          ? "border-[#00ff9c]/50 bg-[#00ff9c]/5 text-[#00ff9c]" 
          : "border-[#1a1a1a] bg-black text-zinc-500 hover:border-[#2a2a2a] hover:text-zinc-400"
      }`}
    >
      <span className="shrink-0 w-3 h-3 border border-current flex items-center justify-center">
        {active && <span className="w-1.5 h-1.5 bg-current" />}
      </span>
      {label}
    </button>
  );
}

export default function PasswordGenerator() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Initializing...</div>}>
      <PasswordGeneratorContent />
    </Suspense>
  );
}
