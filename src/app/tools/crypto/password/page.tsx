"use client";

import { ToolLayout } from "@/components/tool-layout";
import { useToolUrlState } from "@/hooks/use-tool-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Suspense, useState, useCallback, useEffect } from "react";

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
    len: "32", 
    u: "1", 
    l: "1",
    n: "1",
    s: "1"
  });

  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const length = parseInt(state.len, 10) || 32;
  const useUpper = state.u === "1";
  const useLower = state.l === "1";
  const useNums = state.n === "1";
  const useSyms = state.s === "1";

  const generate = useCallback(() => {
    setPassword(generateSecurePassword(length, useUpper, useLower, useNums, useSyms));
    setCopied(false);
  }, [length, useUpper, useLower, useNums, useSyms]);

  // Generate on mount or when settings change
  useEffect(() => {
    generate();
  }, [generate]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleToggle = (key: string, current: string) => {
    setState({ [key]: current === "1" ? "0" : "1" });
  };

  return (
    <ToolLayout 
      title="Password Generator" 
      description="Generate cryptographically secure random passwords entirely in your browser."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN]</span>
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Settings</span>
          </header>
          <div className="p-6 space-y-8 flex-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                Generate New
              </Button>
            </div>
          </div>
        </article>

        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[OUT]</span>
            <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center gap-2 uppercase tracking-widest">
              Generated Password <span className="cursor-blink">_</span>
            </span>
          </header>
          <div className="p-6 flex flex-col flex-1 items-center justify-center min-h-[200px]">
            {!password ? (
              <span className="text-red-500 font-mono text-sm">[ERR] Select at least one character set</span>
            ) : (
              <div className="w-full space-y-6">
                <div className="bg-black border border-[#1a1a1a] p-6 w-full text-center break-all relative group">
                  <span className="text-xl md:text-2xl font-mono text-zinc-200">
                    {password}
                  </span>
                </div>
                
                <Button 
                  onClick={copyToClipboard}
                  className={`w-full rounded-none font-mono uppercase tracking-widest transition-all ${
                    copied 
                      ? "bg-[#00ff9c]/20 text-[#00ff9c] border border-[#00ff9c]" 
                      : "bg-[#1a1a1a] text-zinc-300 border border-[#2a2a2a] hover:bg-[#2a2a2a]"
                  }`}
                >
                  {copied ? (
                    <><Check className="w-4 h-4 mr-2" /> Copied</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy to Clipboard</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
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
