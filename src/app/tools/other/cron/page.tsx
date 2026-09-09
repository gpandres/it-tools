"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import cronstrue from "cronstrue/i18n";

export default function CronParser() {
  const [cronExp, setCronExp] = useState("* * * * *");

  const { description, error } = useMemo(() => {
    try {
      const parts = cronExp.trim().split(/\s+/);
      if (parts.length < 5) {
        return { error: "Cron expression must have at least 5 parts", description: "" };
      }
      
      const desc = cronstrue.toString(cronExp, { throwExceptionOnParseError: true });
      return { error: null, description: desc };
    } catch (e) {
      return { error: (e as Error).message || "Invalid cron expression", description: "" };
    }
  }, [cronExp]);

  const examples = [
    { label: "Every minute", val: "* * * * *" },
    { label: "Every 5 minutes", val: "*/5 * * * *" },
    { label: "Every hour at minute 30", val: "30 * * * *" },
    { label: "At 04:00 on every day", val: "0 4 * * *" },
    { label: "At 00:00 on Sunday", val: "0 0 * * 0" },
    { label: "Every day at 08:00 and 18:00", val: "0 8,18 * * *" },
    { label: "At 00:00 on day 1 of month", val: "0 0 1 * *" },
  ];

  return (
    <ToolLayout 
      title="Cron Expression Parser" 
      description="Translate cron schedules into human-readable text instantly."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col rounded-none">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN]</span>
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Cron Expression</span>
          </header>
          <div className="p-6 flex flex-col gap-6 flex-1">
            <div className="space-y-3">
              <Label htmlFor="cron-input" className="sr-only">Cron Expression</Label>
              <Input
                id="cron-input"
                type="text"
                value={cronExp}
                onChange={(e) => setCronExp(e.target.value)}
                placeholder="* * * * *"
                className={`w-full font-mono text-2xl text-center tracking-widest bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-16 text-[#00ff9c] ${error ? 'border-red-500/50 text-red-400 focus-visible:ring-red-500' : ''}`}
                spellCheck={false}
              />
            </div>
            
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono text-zinc-500">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-300">Minute</span>
                <span>0-59</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-300">Hour</span>
                <span>0-23</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-300">Day (Month)</span>
                <span>1-31</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-300">Month</span>
                <span>1-12</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-300">Day (Week)</span>
                <span>0-6</span>
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3 block">Common Examples</Label>
              <div className="flex flex-wrap gap-2">
                {examples.map(ex => (
                  <button
                    key={ex.val}
                    onClick={() => setCronExp(ex.val)}
                    className="px-3 py-1.5 font-mono text-xs border border-[#1a1a1a] bg-black text-zinc-400 hover:text-[#ffb000] hover:border-[#ffb000]/50 transition-colors rounded-none"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col rounded-none">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[OUT]</span>
            <span className="text-[#00ff9c] text-sm font-semibold uppercase tracking-widest glow">Human Readable</span>
          </header>
          <div className="p-8 flex items-center justify-center flex-1 min-h-[250px] bg-zinc-950 dotted-bg">
            {error ? (
              <div className="text-center font-mono text-red-500 max-w-sm">
                <span className="block mb-2 text-red-400/50">Error</span>
                {error}
              </div>
            ) : (
              <div className="text-center font-mono text-2xl text-zinc-200 leading-relaxed max-w-sm">
                "{description}"
              </div>
            )}
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}
