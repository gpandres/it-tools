"use client";

import { useState, Suspense } from "react";

import { ToolLayout } from "@/components/tool-layout";
import { Battery, Zap, Clock, Info } from "lucide-react";

function UpsCalculatorContent() {
  const [voltage, setVoltage] = useState("12");
  const [capacityAh, setCapacityAh] = useState("9");
  const [batteries, setBatteries] = useState("2");
  const [loadWatts, setLoadWatts] = useState("300");
  const [efficiency, setEfficiency] = useState("85");
  const [topology, setTopology] = useState<"parallel" | "series">("parallel");
  const [batteryDerating, setBatteryDerating] = useState("80");

  const v = Math.max(0, parseFloat(voltage) || 0);
  const ah = Math.max(0, parseFloat(capacityAh) || 0);
  const qty = Math.max(1, parseInt(batteries, 10) || 1);
  const load = Math.max(0, parseFloat(loadWatts) || 0);
  const eff = Math.min(100, Math.max(1, parseFloat(efficiency) || 1)) / 100;
  const derating = Math.min(100, Math.max(1, parseFloat(batteryDerating) || 1)) / 100;

  // Total Battery Capacity in Volt-Amp-Hours (VAh) / Watt-hours
  const totalVAh = v * ah * qty;
  
  // Usable Capacity after inverter efficiency
  const usableWh = totalVAh * eff * derating;

  // Runtime in hours = Usable Capacity (Wh) / Load (W)
  const runtimeHours = load > 0 ? usableWh / load : 0;
  const runtimeMinutes = runtimeHours * 60;

  // Current draw from battery bank
  // Depending on series/parallel, the bank voltage might be V*qty or V.
  // We'll calculate total battery draw in Watts: Load / Eff.
  const batteryDrawWatts = load > 0 && eff > 0 ? load / eff : 0;
  const bankVoltage = topology === "series" ? v * qty : v;
  const batteryDrawAmps = bankVoltage > 0 ? batteryDrawWatts / bankVoltage : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">
      
      {/* Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2">
              <Battery className="w-4 h-4" /> Battery Specifications
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Voltage (V)</label>
                <input 
                  type="number" min="0" step="1"
                  value={voltage} 
                  onChange={(e) => setVoltage(e.target.value)} 
                  className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                  placeholder="e.g. 12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Capacity (Ah)</label>
                <input 
                  type="number" min="0" step="0.5"
                  value={capacityAh} 
                  onChange={(e) => setCapacityAh(e.target.value)} 
                  className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                  placeholder="e.g. 9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">Number of Batteries</label>
                <span className="text-[#00ff9c] font-mono font-bold">{qty}</span>
              </div>
              <input 
                type="range" min="1" max="40" step="1"
                value={qty} 
                onChange={(e) => setBatteries(e.target.value)} 
                className="w-full accent-[#00ff9c]" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">Battery Bank Topology</label>
              <select
                value={topology}
                onChange={(e) => setTopology(e.target.value as "parallel" | "series")}
                className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
              >
                <option value="parallel">Parallel (same voltage, more Ah)</option>
                <option value="series">Series (higher voltage, same Ah)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Load & Environment
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">Total Load (Watts)</label>
              <input 
                type="number" min="0" step="10"
                value={loadWatts} 
                onChange={(e) => setLoadWatts(e.target.value)} 
                className="w-full bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono font-bold focus:border-[#00ff9c] focus:outline-none"
                placeholder="e.g. 300"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">Inverter Efficiency (%)</label>
                <span className="text-zinc-300 font-mono font-bold">{efficiency}%</span>
              </div>
              <input 
                type="range" min="50" max="100" step="1"
                value={efficiency} 
                onChange={(e) => setEfficiency(e.target.value)} 
                className="w-full accent-[#00ff9c]" 
              />
              <p className="text-[10px] text-zinc-600 font-mono">Typically 80% - 90% for standard line-interactive UPS.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">Battery Derating (%)</label>
                <span className="text-amber-400 font-mono font-bold">{batteryDerating}%</span>
              </div>
              <input
                type="range" min="50" max="100" step="1"
                value={batteryDerating}
                onChange={(e) => setBatteryDerating(e.target.value)}
                className="w-full accent-amber-400"
              />
              <p className="text-[10px] text-zinc-600 font-mono">Adjusts for age, temperature and discharge-rate losses.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        <div className="border border-[#1a1a1a] bg-[#050505] p-8 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#00ff9c]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <Clock className="w-12 h-12 text-[#00ff9c] mb-4 opacity-80" />
          <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2 z-10">Estimated Runtime</span>
          
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-7xl font-mono text-[#00ff9c] glow-green tracking-tighter">
              {runtimeMinutes > 0 ? (runtimeMinutes > 600 ? ">600" : runtimeMinutes.toFixed(1)) : "0"}
            </span>
            <span className="text-xl text-zinc-400 font-mono">min</span>
          </div>
          
          {runtimeHours >= 1 && (
            <span className="text-zinc-500 font-mono text-sm mt-2 z-10">
              (~{runtimeHours.toFixed(2)} hours)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-[#1a1a1a] bg-[#050505] p-4">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Total Capacity</span>
            <span className="text-2xl font-mono text-zinc-200">{totalVAh.toFixed(0)} <span className="text-sm opacity-60">Wh</span></span>
          </div>
          <div className="border border-[#1a1a1a] bg-[#050505] p-4">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Battery Draw</span>
            <span className="text-2xl font-mono text-amber-400">{batteryDrawWatts.toFixed(0)} <span className="text-sm opacity-60">W</span></span>
          </div>
          <div className="border border-[#1a1a1a] bg-[#050505] p-4">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Bank Current</span>
            <span className="text-2xl font-mono text-blue-300">{batteryDrawAmps.toFixed(1)} <span className="text-sm opacity-60">A</span></span>
            <span className="text-[10px] text-zinc-600 font-mono block mt-1">{bankVoltage.toFixed(0)} V {topology}</span>
          </div>
        </div>

        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex gap-3 text-zinc-400 mt-auto">
          <Info className="w-5 h-5 shrink-0 text-zinc-500" />
          <p className="text-sm font-mono leading-relaxed opacity-80">
            <strong>Estimate:</strong> This model includes inverter efficiency and battery derating, but it still does not model Peukert&apos;s Law, temperature curves or the UPS&apos;s low-voltage cutoff. Confirm runtime with the manufacturer&apos;s load curve; if runtime is under 15 minutes, the estimate may be optimistic.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function UpsCalculatorTool() {
  return (
    <ToolLayout
      title="UPS Runtime Calculator"
      description="Calculate estimated battery backup time for your server rack or network equipment based on load and battery specifications."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <UpsCalculatorContent />
      </Suspense>
    </ToolLayout>
  );
}
