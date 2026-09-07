"use client";

import { useState, Suspense } from "react";

import { ToolLayout } from "@/components/tool-layout";

function BandwidthToolContent() {
  const [fileSizeStr, setFileSizeStr] = useState("1");
  const [fileUnit, setFileUnit] = useState("GB");

  const [linkSpeedStr, setLinkSpeedStr] = useState("1");
  const [speedUnit, setSpeedUnit] = useState("Gbps");

  const [rttStr, setRttStr] = useState("50"); // ms
  const [windowSizeStr, setWindowSizeStr] = useState("64"); // KB

  const fileSize = parseFloat(fileSizeStr);
  const linkSpeed = parseFloat(linkSpeedStr);
  const rtt = parseFloat(rttStr);
  const windowSize = parseFloat(windowSizeStr);

  const isValid = !isNaN(fileSize) && !isNaN(linkSpeed) && !isNaN(rtt) && !isNaN(windowSize) && 
                  fileSize >= 0 && linkSpeed > 0 && rtt > 0 && windowSize > 0;

  let theoreticalTimeStr = "-";
  let maxTcpThroughputStr = "-";
  let realTimeStr = "-";

  if (isValid) {
    // 1. Calculate Theoretical Transfer Time
    // Convert file size to Megabits (Mb)
    let sizeMb = fileSize;
    if (fileUnit === "KB") sizeMb = fileSize * 8 / 1000;
    if (fileUnit === "MB") sizeMb = fileSize * 8;
    if (fileUnit === "GB") sizeMb = fileSize * 8 * 1000;
    if (fileUnit === "TB") sizeMb = fileSize * 8 * 1000 * 1000;

    // Convert link speed to Megabits per second (Mbps)
    let speedMbps = linkSpeed;
    if (speedUnit === "Kbps") speedMbps = linkSpeed / 1000;
    if (speedUnit === "Mbps") speedMbps = linkSpeed;
    if (speedUnit === "Gbps") speedMbps = linkSpeed * 1000;
    if (speedUnit === "Tbps") speedMbps = linkSpeed * 1000 * 1000;

    const theoreticalSeconds = sizeMb / speedMbps;
    theoreticalTimeStr = formatTime(theoreticalSeconds);

    // 2. Calculate TCP Latency Impact
    // Throughput = WindowSize (bits) / RTT (seconds)
    const windowBits = windowSize * 1024 * 8;
    const rttSeconds = rtt / 1000;
    const maxTcpThroughputBps = windowBits / rttSeconds;
    const maxTcpThroughputMbps = maxTcpThroughputBps / 1000 / 1000;

    maxTcpThroughputStr = maxTcpThroughputMbps > speedMbps 
      ? `${speedMbps.toFixed(2)} Mbps (Bottleneck: Link Speed)` 
      : `${maxTcpThroughputMbps.toFixed(2)} Mbps (Bottleneck: TCP Window / Latency)`;

    // 3. Calculate Real Transfer Time based on bottleneck
    const realThroughputMbps = Math.min(maxTcpThroughputMbps, speedMbps);
    const realSeconds = sizeMb / realThroughputMbps;
    realTimeStr = formatTime(realSeconds);
  }

  function formatTime(seconds: number) {
    if (seconds < 1) return "< 1 second";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    
    return parts.join(" ");
  }

  return (
    <ToolLayout
      title="Bandwidth & Transfer Time Calculator"
      description="Calculate file transfer times and analyze the impact of latency (RTT) on TCP throughput."
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="p-4 border border-[#1a1a1a] bg-[#0a0a0a] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Theoretical Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#00ff9c] uppercase tracking-wider border-b border-[#1a1a1a] pb-2">
                1. Transfer Size & Link Speed
              </h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">File Size</label>
                  <input
                    type="number"
                    value={fileSizeStr}
                    onChange={(e) => setFileSizeStr(e.target.value)}
                    min="0"
                    className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Unit</label>
                  <select
                    value={fileUnit}
                    onChange={(e) => setFileUnit(e.target.value)}
                    className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors appearance-none text-center"
                  >
                    <option>KB</option>
                    <option>MB</option>
                    <option>GB</option>
                    <option>TB</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Link Speed</label>
                  <input
                    type="number"
                    value={linkSpeedStr}
                    onChange={(e) => setLinkSpeedStr(e.target.value)}
                    min="0.1"
                    className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Unit</label>
                  <select
                    value={speedUnit}
                    onChange={(e) => setSpeedUnit(e.target.value)}
                    className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors appearance-none text-center"
                  >
                    <option>Kbps</option>
                    <option>Mbps</option>
                    <option>Gbps</option>
                    <option>Tbps</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TCP / Latency Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#00ff9c] uppercase tracking-wider border-b border-[#1a1a1a] pb-2">
                2. Latency Impact (TCP)
              </h3>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Round Trip Time (RTT in ms)</label>
                <input
                  type="number"
                  value={rttStr}
                  onChange={(e) => setRttStr(e.target.value)}
                  min="1"
                  className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">TCP Window Size (KB)</label>
                <input
                  type="number"
                  value={windowSizeStr}
                  onChange={(e) => setWindowSizeStr(e.target.value)}
                  min="1"
                  className="w-full bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">Default unscaled TCP Window is usually 64 KB</p>
              </div>
            </div>

          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border border-[#1a1a1a] bg-[#050505] flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Theoretical Time (Perfect Link)</div>
            <div className="text-2xl font-mono text-white">{theoreticalTimeStr}</div>
          </div>
          <div className="p-6 border border-[#00ff9c]/30 bg-[#00ff9c]/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00ff9c]"></div>
            <div className="text-xs font-bold text-[#00ff9c] uppercase tracking-wider mb-2">Estimated Real Time (TCP Limited)</div>
            <div className="text-2xl font-mono text-[#00ff9c] glow">{realTimeStr}</div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 border border-[#1a1a1a] bg-[#050505] flex flex-col gap-2">
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Max TCP Throughput (Bandwidth-Delay Product)</div>
          <div className="text-[#00ff9c] font-mono text-sm break-words">{maxTcpThroughputStr}</div>
          <p className="text-xs text-zinc-400 mt-2">
            TCP requires acknowledgements. High latency (RTT) limits throughput unless the TCP Window Size is scaled up. This is known as the Long Fat Network (LFN) problem.
          </p>
        </div>

      </div>
    </ToolLayout>
  );
}

export default function BandwidthTool() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
      <BandwidthToolContent />
    </Suspense>
  );
}
