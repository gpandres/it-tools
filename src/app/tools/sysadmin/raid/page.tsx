"use client";

import { Suspense, useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { HardDrive, AlertTriangle, Info, Zap } from "lucide-react";

type RaidLevel = "0" | "1" | "5" | "6" | "10";

function RaidCalculatorContent() {
  const [driveCount, setDriveCount] = useState("4");
  const [driveSize, setDriveSize] = useState("4");
  const [sizeUnit, setSizeUnit] = useState("TB");
  const [raidLevel, setRaidLevel] = useState("5");

  const count = Math.max(1, parseInt(driveCount) || 1);
  const size = parseFloat(driveSize) || 0;

  const getRaidSpecs = (n: number, s: number, level: RaidLevel) => {
    let usable = 0;
    let faultTolerance = "0 drives";
    let minDrives = 2;
    let readSpeed = "1x";
    let writeSpeed = "1x";
    let description = "";
    let driveTypes: ("data" | "parity" | "mirror")[] = [];

    switch (level) {
      case "0":
        minDrives = 2;
        usable = n * s;
        faultTolerance = "0 drives (No redundancy)";
        readSpeed = `${n}x`;
        writeSpeed = `${n}x`;
        description = "Data is striped across all drives. Maximum performance and capacity, but zero fault tolerance. If one drive fails, ALL data is lost.";
        driveTypes = Array(n).fill("data");
        break;
      case "1":
        minDrives = 2;
        // Enforce even number
        const n1 = n % 2 === 0 ? n : n - 1; 
        usable = (n1 / 2) * s;
        faultTolerance = "1 drive (per mirrored pair)";
        readSpeed = `${n1}x`;
        writeSpeed = "1x";
        description = "Data is mirrored exactly across pairs of drives. Excellent read performance and high redundancy, but 50% capacity overhead.";
        driveTypes = Array(n1).fill("data").map((_, i) => i % 2 === 0 ? "data" : "mirror");
        break;
      case "5":
        minDrives = 3;
        usable = (n - 1) * s;
        faultTolerance = "1 drive";
        readSpeed = `${n - 1}x`;
        writeSpeed = `~1x (Parity penalty)`;
        description = "Data and parity are striped across all drives. Good balance of capacity, performance, and redundancy. Rebuilding large arrays can take a very long time.";
        driveTypes = Array(n).fill("data");
        if (n >= 3) driveTypes[n - 1] = "parity";
        break;
      case "6":
        minDrives = 4;
        usable = (n - 2) * s;
        faultTolerance = "2 drives";
        readSpeed = `${n - 2}x`;
        writeSpeed = `~1x (Double parity penalty)`;
        description = "Like RAID 5, but with double parity. Extremely safe, can survive 2 simultaneous drive failures. Write performance is slower due to double parity calculation.";
        driveTypes = Array(n).fill("data");
        if (n >= 4) {
          driveTypes[n - 1] = "parity";
          driveTypes[n - 2] = "parity";
        }
        break;
      case "10":
        minDrives = 4;
        const n10 = n % 2 === 0 ? n : n - 1;
        usable = (n10 / 2) * s;
        faultTolerance = "1 drive per sub-mirror";
        readSpeed = `${n10}x`;
        writeSpeed = `${n10 / 2}x`;
        description = "A stripe of mirrors. Combines the speed of RAID 0 with the redundancy of RAID 1. The best choice for high-performance databases, but requires 50% capacity overhead.";
        driveTypes = Array(n10).fill("data").map((_, i) => i % 2 === 0 ? "data" : "mirror");
        break;
    }

    const isValid = n >= minDrives && (level === "1" || level === "10" ? n % 2 === 0 : true);

    return { usable, faultTolerance, minDrives, readSpeed, writeSpeed, description, driveTypes, isValid };
  };

  const specs = useMemo(() => getRaidSpecs(count, size, raidLevel as RaidLevel), [count, size, raidLevel]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
      
      {/* Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">Array Configuration</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">RAID Level</label>
              </div>
              <select 
                value={raidLevel} 
                onChange={(e) => setRaidLevel(e.target.value)} 
                className="w-full bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-bold font-mono focus:border-[#00ff9c] focus:outline-none"
              >
                <option value="0">RAID 0 (Stripe)</option>
                <option value="1">RAID 1 (Mirror)</option>
                <option value="5">RAID 5 (1 Parity)</option>
                <option value="6">RAID 6 (2 Parity)</option>
                <option value="10">RAID 10 (Stripe of Mirrors)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono text-zinc-400">Number of Drives</label>
                <span className="text-[#00ff9c] font-mono font-bold">{count}</span>
              </div>
              <input 
                type="range" 
                min="2" max="24" step="1"
                value={count} 
                onChange={(e) => setDriveCount(e.target.value)} 
                className="w-full accent-[#00ff9c]" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">Capacity per Drive</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="0.1" step="0.1"
                  value={driveSize} 
                  onChange={(e) => setDriveSize(e.target.value)} 
                  className="flex-1 bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none" 
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
          </div>
        </div>

        {/* Warning if invalid */}
        {!specs.isValid && (
          <div className="border border-red-500/50 bg-red-500/10 p-4 flex gap-3 text-red-500">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="text-sm font-mono leading-tight">
              RAID {raidLevel} requires a minimum of {specs.minDrives} drives
              {(raidLevel === "1" || raidLevel === "10") ? " and an even number of drives" : ""}.
            </div>
          </div>
        )}
      </div>

      {/* Results & Visuals */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#1a1a1a] bg-[#050505] p-4 flex flex-col">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Usable Capacity</span>
            <span className="text-3xl font-mono text-[#00ff9c] glow-green truncate">
              {specs.isValid ? specs.usable.toFixed(1).replace(/\.0$/, '') : "0"} <span className="text-lg opacity-70">{sizeUnit}</span>
            </span>
            <span className="text-zinc-600 text-xs font-mono mt-1 mt-auto">Efficiency: {specs.isValid ? ((specs.usable / (count * size)) * 100).toFixed(0) : 0}%</span>
          </div>

          <div className="border border-[#1a1a1a] bg-[#050505] p-4 flex flex-col">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Fault Tolerance</span>
            <span className="text-lg font-mono text-zinc-200 mt-2 leading-tight">
              {specs.isValid ? specs.faultTolerance : "-"}
            </span>
          </div>

          <div className="border border-[#1a1a1a] bg-[#050505] p-4 flex flex-col">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Theoretical Perf</span>
            <div className="flex flex-col mt-2 gap-1">
              <span className="text-sm font-mono text-zinc-300 flex justify-between">
                Read: <span className="text-[#00ff9c]">{specs.isValid ? specs.readSpeed : "-"}</span>
              </span>
              <span className="text-sm font-mono text-zinc-300 flex justify-between">
                Write: <span className="text-amber-400">{specs.isValid ? specs.writeSpeed : "-"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Visual Drive Grid */}
        <div className="border border-[#1a1a1a] bg-[#050505] p-6">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-6 flex items-center justify-between">
            <span>Visual Array Layout</span>
            <span className="text-xs text-zinc-600">Raw: {(count * size).toFixed(1)} {sizeUnit}</span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: count }).map((_, i) => {
              const type = specs.isValid && i < specs.driveTypes.length ? specs.driveTypes[i] : "invalid";
              
              let bgColor = "bg-zinc-900";
              let borderColor = "border-[#1a1a1a]";
              let iconColor = "text-zinc-600";
              let label = "Unused";

              if (type === "data") {
                bgColor = "bg-[#00ff9c]/10";
                borderColor = "border-[#00ff9c]/50";
                iconColor = "text-[#00ff9c]";
                label = "Data";
              } else if (type === "parity") {
                bgColor = "bg-amber-500/10";
                borderColor = "border-amber-500/50";
                iconColor = "text-amber-500";
                label = "Parity";
              } else if (type === "mirror") {
                bgColor = "bg-blue-500/10";
                borderColor = "border-blue-500/50";
                iconColor = "text-blue-500";
                label = "Mirror";
              }

              return (
                <div key={i} className={`flex flex-col items-center justify-center p-4 border ${borderColor} ${bgColor} transition-colors rounded-sm`}>
                  <HardDrive className={`w-8 h-8 ${iconColor} mb-2`} />
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${iconColor}`}>Drive {i + 1}</span>
                  <span className={`text-[9px] font-mono opacity-60 ${iconColor}`}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-[#1a1a1a] text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#00ff9c]/20 border border-[#00ff9c]/50"></div> Usable Data</div>
            {(raidLevel === "5" || raidLevel === "6") && (
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500/20 border border-amber-500/50"></div> Parity (Redundancy)</div>
            )}
            {(raidLevel === "1" || raidLevel === "10") && (
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500/20 border border-blue-500/50"></div> Mirror (Redundancy)</div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex gap-3 text-zinc-400">
          <Info className="w-5 h-5 shrink-0 text-zinc-500" />
          <p className="text-sm font-mono leading-relaxed">
            {specs.description}
            <br/><br/>
            <span className="opacity-60 text-xs">Note: Actual formatted capacity will be lower due to filesystem overhead and decimal/binary conversion (TiB vs TB). Always use drives of the same capacity for optimal usage.</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function RaidCalculatorTool() {
  return (
    <ToolLayout
      title="RAID Calculator"
      description="Calculate usable capacity, fault tolerance, and theoretical performance for RAID arrays. Visualizes disk layout and parity distribution."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <RaidCalculatorContent />
      </Suspense>
    </ToolLayout>
  );
}
