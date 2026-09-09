"use client";

import { Suspense, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Activity, Clock, ServerCrash, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";

function RpoRtoCalculatorContent() {
  const [rpoHours, setRpoHours] = useState("24");
  const [rtoHours, setRtoHours] = useState("4");

  const rpo = Math.max(0, parseFloat(rpoHours) || 0);
  const rto = Math.max(0, parseFloat(rtoHours) || 0);

  // Calculate dynamic widths (clamped for UI stability to prevent labels from colliding)
  const minSegment = 22; // 22% minimum width
  
  const safeRpo = rpo === 0 && rto === 0 ? 1 : rpo;
  const safeRto = rpo === 0 && rto === 0 ? 1 : rto;
  const totalRaw = safeRpo + safeRto;

  let rpoWidth = (safeRpo / totalRaw) * 80;
  let rtoWidth = (safeRto / totalRaw) * 80;

  if (rpoWidth < minSegment) {
    rpoWidth = minSegment;
    rtoWidth = 80 - minSegment;
  } else if (rtoWidth < minSegment) {
    rtoWidth = minSegment;
    rpoWidth = 80 - minSegment;
  }

  const greenWidth = 20;
  const disasterPos = rpoWidth;
  const restoredPos = rpoWidth + rtoWidth;

  const getImpactLevel = (hours: number) => {
    if (hours <= 1) return { level: "Minimal", color: "text-[#00ff9c]" };
    if (hours <= 4) return { level: "Moderate", color: "text-amber-400" };
    if (hours <= 24) return { level: "High", color: "text-orange-500" };
    return { level: "Critical", color: "text-red-500" };
  };

  const rpoImpact = getImpactLevel(rpo);
  const rtoImpact = getImpactLevel(rto);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
      
      {/* Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="border border-[#1a1a1a] bg-[#050505] rounded-none p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Tolerance Config
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">RPO (Recovery Point Objective)</label>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" min="0" step="0.5"
                  value={rpoHours} 
                  onChange={(e) => setRpoHours(e.target.value)} 
                  className="flex-1 min-w-0 bg-black border border-[#1a1a1a] p-3 text-zinc-300 font-mono text-xl focus:border-[#00ff9c] focus:outline-none transition-colors rounded-none focus-visible:ring-[#00ff9c]"
                />
                <span className="shrink-0 bg-[#1a1a1a] text-zinc-500 font-mono px-4 flex items-center justify-center">Hours</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Maximum acceptable data loss (How frequently you backup).</p>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">RTO (Recovery Time Objective)</label>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" min="0" step="0.5"
                  value={rtoHours} 
                  onChange={(e) => setRtoHours(e.target.value)} 
                  className="flex-1 min-w-0 bg-black border border-[#1a1a1a] p-3 text-zinc-300 font-mono text-xl focus:border-[#00ff9c] focus:outline-none transition-colors rounded-none focus-visible:ring-[#00ff9c]"
                />
                <span className="shrink-0 bg-[#1a1a1a] text-zinc-500 font-mono px-4 flex items-center justify-center">Hours</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Maximum acceptable downtime (How fast you can restore).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="border border-[#1a1a1a] bg-[#050505] rounded-none p-8 h-full flex flex-col">
          <h3 className="text-sm font-bold text-[#00ff9c] glow uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-8">
            Disaster Timeline
          </h3>

          <div className="relative w-full h-56 mt-4">
            
            {/* Safe Area padded by 64px on sides so labels never get cut off by screen edge */}
            <div className="absolute inset-y-0 left-16 right-16">
              
              {/* The Line */}
              <div className="absolute left-0 right-0 h-1 bg-zinc-800 top-24 -translate-y-1/2 flex">
                <div className="h-full bg-blue-500/50 relative transition-all duration-700 ease-out" style={{ width: `${rpoWidth}%` }}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGc+PHBhdGggZD0iTTAgNDBMNDAgMEgwVjQweiIgZmlsbD0iIzAwZmY5YyIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')]"></div>
                </div>
                <div className="h-full bg-red-500/50 transition-all duration-700 ease-out" style={{ width: `${rtoWidth}%` }}></div>
                <div className="h-full bg-green-500/20 transition-all duration-700 ease-out" style={{ width: `${greenWidth}%` }}></div>
              </div>

              {/* Spans / Ranges (ABOVE THE LINE) */}
              <div className="absolute top-4 left-0 right-0 flex text-xs font-mono">
                <div className="text-center relative transition-all duration-700 ease-out" style={{ width: `${rpoWidth}%` }}>
                  {/* Absolute bracket guarantees crisp borders that cannot be cut off */}
                  <div className="absolute left-6 right-6 top-0 border-t-2 border-l-2 border-r-2 border-blue-500/60 h-3 rounded-none"></div>
                  <div className="pt-5">
                    <span className="text-blue-400 font-bold">RPO: {rpo} hrs</span>
                    <span className="block text-[9px] text-zinc-500 uppercase mt-1">Data Loss Window</span>
                  </div>
                </div>
                <div className="text-center relative transition-all duration-700 ease-out" style={{ width: `${rtoWidth}%` }}>
                  <div className="absolute left-6 right-6 top-0 border-t-2 border-l-2 border-r-2 border-red-500/60 h-3 rounded-none"></div>
                  <div className="pt-5">
                    <span className="text-red-400 font-bold">RTO: {rto} hrs</span>
                    <span className="block text-[9px] text-zinc-500 uppercase mt-1">Downtime Window</span>
                  </div>
                </div>
              </div>

              {/* Event Markers (ON AND BELOW THE LINE) */}
              <div className="absolute top-24 left-0 right-0 z-10">
                
                {/* Last Backup */}
                <div className="absolute top-0 -mt-2 -translate-x-1/2 w-32 flex flex-col items-center transition-all duration-700 ease-out" style={{ left: '0%' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-black"></div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-2 text-center w-full mt-6">
                    <RotateCcw className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <span className="text-[10px] font-mono text-zinc-300 block">Last Backup</span>
                  </div>
                </div>

                {/* Disaster */}
                <div className="absolute top-0 -mt-3 -translate-x-1/2 w-32 flex flex-col items-center transition-all duration-700 ease-out" style={{ left: `${disasterPos}%` }}>
                  <div className="w-6 h-6 rounded-full border-4 border-red-500 bg-black animate-pulse"></div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-2 text-center w-full mt-5">
                    <ServerCrash className="w-4 h-4 mx-auto mb-1 text-red-500" />
                    <span className="text-[10px] font-mono text-zinc-300 block">Disaster Event</span>
                  </div>
                </div>

                {/* Recovery */}
                <div className="absolute top-0 -mt-2 -translate-x-1/2 w-32 flex flex-col items-center transition-all duration-700 ease-out" style={{ left: `${restoredPos}%` }}>
                  <div className="w-4 h-4 rounded-full border-2 border-[#00ff9c] bg-black"></div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-2 text-center w-full mt-6">
                    <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[#00ff9c]" />
                    <span className="text-[10px] font-mono text-zinc-300 block">System Restored</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-4 pt-12">
             <div className="border border-[#1a1a1a] p-4 bg-black">
               <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Data Loss Impact</span>
               <div className={`font-mono font-bold ${rpoImpact.color}`}>{rpoImpact.level}</div>
               <div className="text-xs text-zinc-400 mt-2">Up to {rpo} hours of recent data will be permanently lost if a disaster occurs right before the next backup.</div>
             </div>
             <div className="border border-[#1a1a1a] p-4 bg-black">
               <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Business Disruption</span>
               <div className={`font-mono font-bold ${rtoImpact.color}`}>{rtoImpact.level}</div>
               <div className="text-xs text-zinc-400 mt-2">The business will be offline for at least {rto} hours while servers, data, and services are being restored.</div>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function RpoRtoCalculatorTool() {
  return (
    <ToolLayout
      title="RPO / RTO Calculator"
      description="Visualize the business impact of your Disaster Recovery plan by calculating Recovery Point Objective and Recovery Time Objective."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <RpoRtoCalculatorContent />
      </Suspense>
    </ToolLayout>
  );
}
