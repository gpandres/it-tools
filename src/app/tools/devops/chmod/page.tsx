"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

type Perms = {
  read: boolean;
  write: boolean;
  execute: boolean;
};

type ChmodState = {
  owner: Perms;
  group: Perms;
  public: Perms;
};

function ChmodCalculatorContent() {
  const [state, setState] = useState({ octal: "755" });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const oct = state.octal.padStart(3, "0").slice(-3);
  const isValid = /^[0-7]{3}$/.test(oct);

  const o = isValid ? parseInt(oct[0], 10) : 0;
  const g = isValid ? parseInt(oct[1], 10) : 0;
  const p = isValid ? parseInt(oct[2], 10) : 0;

  const perms: ChmodState = {
    owner: { read: (o & 4) > 0, write: (o & 2) > 0, execute: (o & 1) > 0 },
    group: { read: (g & 4) > 0, write: (g & 2) > 0, execute: (g & 1) > 0 },
    public: { read: (p & 4) > 0, write: (p & 2) > 0, execute: (p & 1) > 0 },
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleCheckboxChange = (entity: keyof ChmodState, perm: keyof Perms, checked: boolean) => {
    const newPerms = {
      ...perms,
      [entity]: {
        ...perms[entity],
        [perm]: checked
      }
    };
    
    // Calculate new octal
    const calc = (p: Perms) => (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
    const newOctal = `${calc(newPerms.owner)}${calc(newPerms.group)}${calc(newPerms.public)}`;
    
    setState({ octal: newOctal });
  };

  const octalToSymbolic = (octal: string) => {
    const map = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
    if (!/^[0-7]{3}$/.test(octal)) return "---------";
    return `${map[parseInt(octal[0])]}${map[parseInt(octal[1])]}${map[parseInt(octal[2])]}`;
  };

  const symbolic = octalToSymbolic(state.octal.padStart(3, "0").slice(-3));

  const entities: { key: keyof ChmodState, label: string }[] = [
    { key: "owner", label: "Owner" },
    { key: "group", label: "Group" },
    { key: "public", label: "Public" }
  ];

  return (
    <ToolLayout 
      title="Chmod Calculator" 
      description="Calculate Linux file permissions using an interactive visual grid. Converts between octal and symbolic formats."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Interactive Grid */}
        <article className="border border-[#1a1a1a] bg-[#050505]">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN]</span>
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Permission Grid</span>
          </header>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="col-span-1"></div>
              <div className="text-center text-xs font-mono text-zinc-500 uppercase tracking-widest">Read (4)</div>
              <div className="text-center text-xs font-mono text-zinc-500 uppercase tracking-widest">Write (2)</div>
              <div className="text-center text-xs font-mono text-zinc-500 uppercase tracking-widest">Execute (1)</div>

              {entities.map(({ key, label }) => (
                <div key={key} className="contents">
                  <div className="flex items-center text-sm font-mono text-zinc-300 uppercase">{label}</div>
                  {(["read", "write", "execute"] as const).map(perm => (
                    <label 
                      key={`${key}-${perm}`}
                      className="flex items-center justify-center cursor-pointer p-4 border border-[#1a1a1a] bg-black hover:border-[#00ff9c]/50 transition-colors"
                    >
                      <input 
                        type="checkbox"
                        checked={perms[key][perm]}
                        onChange={(e) => handleCheckboxChange(key, perm, e.target.checked)}
                        className="w-5 h-5 accent-[#00ff9c] cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-[#1a1a1a]">
               <div className="space-y-2">
                 <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Octal Input</label>
                 <Input 
                   value={state.octal}
                   onChange={(e) => setState({ octal: e.target.value.replace(/[^0-7]/g, '').slice(0,3) })}
                   className="font-mono text-xl text-center tracking-[0.5em] bg-black border-[#1a1a1a] focus-visible:ring-[#00ff9c] text-zinc-200"
                   maxLength={3}
                 />
               </div>
            </div>
          </div>
        </article>

        {/* Results */}
        <article className="border border-[#1a1a1a] bg-[#050505]">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[OUT]</span>
            <span className="text-[#00ff9c] text-sm font-semibold glow uppercase tracking-widest">Calculated Results</span>
          </header>
          <div className="p-6 space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Symbolic Format</label>
              <div className="flex bg-black border border-[#1a1a1a] p-1">
                <Input 
                  readOnly 
                  value={`-${symbolic}`}
                  className="font-mono text-lg bg-transparent border-none text-[#00ff9c] text-center tracking-[0.2em]"
                />
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`-${symbolic}`, "sym")} className="text-zinc-500 hover:text-zinc-300">
                  {copiedKey === "sym" ? <Check className="w-4 h-4 text-[#00ff9c]" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Command Example</label>
              <div className="flex bg-black border border-[#1a1a1a] p-1">
                <Input 
                  readOnly 
                  value={`chmod ${state.octal} file.txt`}
                  className="font-mono text-sm bg-transparent border-none text-zinc-300"
                />
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`chmod ${state.octal} file.txt`, "cmd")} className="text-zinc-500 hover:text-zinc-300">
                  {copiedKey === "cmd" ? <Check className="w-4 h-4 text-[#00ff9c]" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-xs font-mono text-zinc-500 space-y-2">
              <div className="text-[#ffb000] mb-2 uppercase tracking-widest font-semibold glow-amber">Quick Reference:</div>
              <div className="flex justify-between"><span>777</span> <span>rwxrwxrwx (All permissions)</span></div>
              <div className="flex justify-between"><span>755</span> <span>rwxr-xr-x (Web server files)</span></div>
              <div className="flex justify-between"><span>644</span> <span>rw-r--r-- (Standard files)</span></div>
              <div className="flex justify-between"><span>600</span> <span>rw------- (Private SSH keys)</span></div>
            </div>

          </div>
        </article>
      </div>
    </ToolLayout>
  );
}

export default function ChmodCalculator() {
  return (
    <ChmodCalculatorContent />
  );
}
