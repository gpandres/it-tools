"use client";

import { useState, Suspense, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Database, Clock, HardDrive, Info } from "lucide-react";
import { calculateBackupMetrics } from "@/lib/backup-calculations";

function BackupCalculatorContent() {
  const [dataSize, setDataSize] = useState("5");
  const [sizeUnit, setSizeUnit] = useState("TB");
  const [changeRate, setChangeRate] = useState("5");
  const [transferSpeed, setTransferSpeed] = useState("1");
  const [speedUnit, setSpeedUnit] = useState("Gbps");
  const [retention, setRetention] = useState("30");
  const [efficiency, setEfficiency] = useState("80");
  const [storageOverhead, setStorageOverhead] = useState("20");

  const size = Math.max(0, parseFloat(dataSize) || 0);
  const rate = Math.min(100, Math.max(0, parseFloat(changeRate) || 0)) / 100;
  const speed = Math.max(0, parseFloat(transferSpeed) || 0);
  const retDays = Math.max(0, parseInt(retention, 10) || 0);
  const effectiveEfficiency = Math.min(100, Math.max(1, parseFloat(efficiency) || 1)) / 100;
  const overhead = Math.max(0, parseFloat(storageOverhead) || 0) / 100;

  const getFormattedTime = (seconds: number) => {
    if (seconds <= 0 || !isFinite(seconds)) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 24) {
      const days = Math.floor(hrs / 24);
      const remHrs = hrs % 24;
      return `${days}d ${remHrs}h ${mins}m`;
    }
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const calc = useMemo(() => {
    const metrics = calculateBackupMetrics({
      size,
      sizeUnit: sizeUnit as "GB" | "TB",
      changeRatePercent: rate * 100,
      transferSpeed: speed,
      speedUnit: speedUnit as "Gbps" | "MB/s",
      retentionDays: retDays,
      efficiencyPercent: effectiveEfficiency * 100,
      overheadPercent: overhead * 100
    });
    return {
      fullTime: getFormattedTime(metrics.fullTimeSeconds),
      incTime: getFormattedTime(metrics.incrementalTimeSeconds),
      storageTB: metrics.storageNeededTB.toFixed(2),
      recommendedStorageTB: metrics.recommendedStorageTB.toFixed(2),
      incSizeGB: (metrics.incrementalMB / 1024).toFixed(1)
    };
  }, [size, sizeUnit, rate, speed, speedUnit, retDays, effectiveEfficiency, overhead]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
      
      {/* Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2">
              <Database className="w-4 h-4" /> Data Profile
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">Total Data Size</label>
              <div className="flex gap-2">
                <input 
                  type="number" min="0" step="0.1"
                  value={dataSize} 
                  onChange={(e) => setDataSize(e.target.value)} 
                  className="flex-1 bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono font-bold focus:border-[#00ff9c] focus:outline-none"
                  placeholder="e.g. 5"
                />
                <select 
                  value={sizeUnit} 
                  onChange={(e) => setSizeUnit(e.target.value)} 
                  className="w-24 bg-black border border-[#1a1a1a] p-2 text-zinc-400 font-mono focus:border-[#00ff9c] focus:outline-none"
                >
                  <option value="GB">GB</option>
                  <option value="TB">TB</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">Daily Change Rate (%)</label>
                <span className="text-[#00ff9c] font-mono font-bold">{changeRate}%</span>
              </div>
              <input 
                type="range" min="1" max="100" step="1"
                value={changeRate} 
                onChange={(e) => setChangeRate(e.target.value)} 
                className="w-full accent-[#00ff9c]" 
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Network & Retention
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">Transfer Speed (Throughput)</label>
              <div className="flex gap-2">
                <input 
                  type="number" min="0" step="0.1"
                  value={transferSpeed} 
                  onChange={(e) => setTransferSpeed(e.target.value)} 
                  className="flex-1 bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                  placeholder="e.g. 1"
                />
                <select 
                  value={speedUnit} 
                  onChange={(e) => setSpeedUnit(e.target.value)} 
                  className="w-24 bg-black border border-[#1a1a1a] p-2 text-zinc-400 font-mono focus:border-[#00ff9c] focus:outline-none"
                >
                  <option value="Gbps">Gbps</option>
                  <option value="MB/s">MB/s</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">Effective Throughput</label>
                <span className="text-[#00ff9c] font-mono font-bold">{efficiency}%</span>
              </div>
              <input
                type="range" min="1" max="100" step="1"
                value={efficiency}
                onChange={(e) => setEfficiency(e.target.value)}
                className="w-full accent-[#00ff9c]"
              />
              <p className="text-[10px] text-zinc-600 font-mono">Accounts for protocol overhead, storage speed and congestion.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">Retention Period (Days)</label>
              <input 
                type="number" min="1" step="1"
                value={retention} 
                onChange={(e) => setRetention(e.target.value)} 
                className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                placeholder="e.g. 30"
              />
              <p className="text-[10px] text-zinc-600 font-mono mt-1">Number of daily incrementals to keep alongside the Full Backup.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">Storage Overhead</label>
                <span className="text-amber-400 font-mono font-bold">{storageOverhead}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={storageOverhead}
                onChange={(e) => setStorageOverhead(e.target.value)}
                className="w-full accent-amber-400"
              />
              <p className="text-[10px] text-zinc-600 font-mono">Reserved capacity for filesystem, metadata and operational headroom.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#1a1a1a] bg-[#050505] p-6 flex flex-col items-center justify-center min-h-[160px]">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Full Backup Time</span>
            <span className="text-4xl font-mono text-zinc-200">{calc.fullTime}</span>
            <span className="text-xs text-zinc-600 font-mono mt-2">To transfer {size} {sizeUnit}</span>
          </div>

          <div className="border border-[#1a1a1a] bg-[#050505] p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00ff9c]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 z-10">Daily Incremental Time</span>
            <span className="text-4xl font-mono text-[#00ff9c] glow-green z-10">{calc.incTime}</span>
            <span className="text-xs text-zinc-500 font-mono mt-2 z-10">To transfer {calc.incSizeGB} GB/day</span>
          </div>
        </div>

        <div className="border border-[#1a1a1a] bg-[#050505] p-6 flex flex-col items-center justify-center">
          <HardDrive className="w-8 h-8 text-[#00ff9c] mb-3 opacity-80" />
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Destination Storage Needed</span>
          <span className="text-5xl font-mono text-zinc-200 tracking-tighter">
            {calc.storageTB} <span className="text-2xl text-zinc-500">TB</span>
          </span>
          <span className="text-xs text-zinc-600 font-mono mt-2 max-w-sm text-center">
            Includes 1 Full Backup + {retention} days of Incremental Backups.
          </span>
        </div>

        <div className="border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col items-center justify-center">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Recommended Capacity</span>
          <span className="text-3xl font-mono text-amber-300 tracking-tighter">
            {calc.recommendedStorageTB} <span className="text-xl text-amber-500/70">TB</span>
          </span>
          <span className="text-xs text-zinc-600 font-mono mt-2 text-center">Includes {storageOverhead}% operational overhead.</span>
        </div>

        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex gap-3 text-zinc-400 mt-auto">
          <Info className="w-5 h-5 shrink-0 text-zinc-500" />
          <p className="text-sm font-mono leading-relaxed opacity-80">
            <strong>Note:</strong> The effective throughput and recommended capacity values account for the assumptions selected above. Validate them against deduplication, compression, backup type and the retention policy used by your platform.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function BackupCalculatorTool() {
  return (
    <ToolLayout
      title="Backup Window Calculator"
      description="Calculate backup transfer times and estimate total storage capacity needed based on retention policies and daily change rates."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <BackupCalculatorContent />
      </Suspense>
    </ToolLayout>
  );
}
