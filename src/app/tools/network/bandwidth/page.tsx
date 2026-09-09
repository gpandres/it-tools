"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStat, ToolStatGrid, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function BandwidthToolContent() {
  const [simpleMode, setSimpleMode] = useState(true);

  const [fileSizeStr, setFileSizeStr] = useState("5");
  const [fileUnit, setFileUnit] = useState("GB");

  const [linkSpeedStr, setLinkSpeedStr] = useState("1");
  const [speedUnit, setSpeedUnit] = useState("Gbps");

  const [rttStr, setRttStr] = useState("50"); // ms
  const [windowSizeStr, setWindowSizeStr] = useState("64"); // KB

  const fileSize = parseFloat(fileSizeStr);
  const linkSpeed = parseFloat(linkSpeedStr);
  const rtt = parseFloat(rttStr);
  const windowSize = parseFloat(windowSizeStr);

  const isValid = Number.isFinite(fileSize) && Number.isFinite(linkSpeed) && Number.isFinite(rtt) && Number.isFinite(windowSize) &&
                  fileSize >= 0 && linkSpeed > 0 && rtt > 0 && windowSize > 0;
  const hasInvalidFileSize = !Number.isFinite(fileSize) || fileSize < 0;
  const hasInvalidLinkSpeed = !Number.isFinite(linkSpeed) || linkSpeed <= 0;
  const hasInvalidRtt = !Number.isFinite(rtt) || rtt <= 0;
  const hasInvalidWindowSize = !Number.isFinite(windowSize) || windowSize <= 0;

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
    if (!Number.isFinite(seconds) || seconds < 0) return "-";
    if (seconds < 1) return "< 1 second";

    const roundedSeconds = Math.round(seconds);
    if (roundedSeconds < 60) return `${roundedSeconds} seconds`;
    
    const h = Math.floor(roundedSeconds / 3600);
    const m = Math.floor((roundedSeconds % 3600) / 60);
    const s = roundedSeconds % 60;

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
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <Tabs value={simpleMode ? "simple" : "advanced"} onValueChange={(value) => setSimpleMode(value === "simple")}>
          <TabsList variant="line" className="grid h-auto w-full grid-cols-2 gap-0 border border-[#1a1a1a] bg-black p-0 sm:w-72">
            <TabsTrigger value="simple" className="h-9 rounded-none border-0 text-[10px] font-bold uppercase tracking-wider data-active:bg-[#00ff9c]/10 data-active:text-[#00ff9c] data-active:after:hidden">Simple mode</TabsTrigger>
            <TabsTrigger value="advanced" className="h-9 rounded-none border-0 border-l border-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider data-active:bg-[#00ff9c]/10 data-active:text-[#00ff9c] data-active:after:hidden">Advanced mode</TabsTrigger>
          </TabsList>
        </Tabs>

        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN" className="text-[#ffb000] glow-amber">Transfer config</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody>
            <div className={`grid gap-6 ${simpleMode ? "" : "md:grid-cols-2"}`}>
              <div className="space-y-5">
                <h3 className="border-b border-[#1a1a1a] pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {simpleMode ? "Download details" : "Transfer size and link speed"}
                </h3>
                <ToolField htmlFor="file-size" label="File size" error={hasInvalidFileSize ? "Enter a file size of zero or greater." : undefined}>
                  <div className="flex gap-2">
                    <Input
                      id="file-size"
                    type="number"
                    value={fileSizeStr}
                    onChange={(e) => setFileSizeStr(e.target.value)}
                    min="0"
                      aria-invalid={hasInvalidFileSize}
                      className="h-10 bg-black font-mono text-[#00ff9c] rounded-none"
                    />
                    <Select value={fileUnit} onValueChange={(value) => setFileUnit(value ?? "GB")}>
                      <SelectTrigger aria-label="File size unit" className="h-10 w-24 rounded-none border-[#1a1a1a] bg-black font-mono text-[#00ff9c]"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none border border-[#1a1a1a] bg-black text-zinc-200"><SelectItem value="KB">KB</SelectItem><SelectItem value="MB">MB</SelectItem><SelectItem value="GB">GB</SelectItem><SelectItem value="TB">TB</SelectItem></SelectContent>
                    </Select>
                  </div>
                </ToolField>

                <ToolField htmlFor="link-speed" label="Internet / link speed" error={hasInvalidLinkSpeed ? "Enter a link speed greater than zero." : undefined}>
                  <div className="flex gap-2">
                    <Input
                      id="link-speed"
                    type="number"
                    value={linkSpeedStr}
                    onChange={(e) => setLinkSpeedStr(e.target.value)}
                    min="0.1"
                      aria-invalid={hasInvalidLinkSpeed}
                      className="h-10 bg-black font-mono text-[#00ff9c] rounded-none"
                    />
                    <Select value={speedUnit} onValueChange={(value) => setSpeedUnit(value ?? "Gbps")}>
                      <SelectTrigger aria-label="Link speed unit" className="h-10 w-24 rounded-none border-[#1a1a1a] bg-black font-mono text-[#00ff9c]"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none border border-[#1a1a1a] bg-black text-zinc-200"><SelectItem value="Kbps">Kbps</SelectItem><SelectItem value="Mbps">Mbps</SelectItem><SelectItem value="Gbps">Gbps</SelectItem><SelectItem value="Tbps">Tbps</SelectItem></SelectContent>
                    </Select>
                  </div>
                </ToolField>
              </div>

            {!simpleMode && (
              <div className="space-y-5">
                <h3 className="border-b border-[#1a1a1a] pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Latency impact (TCP)</h3>
                <ToolField htmlFor="rtt" label="Round-trip time (ms)" error={hasInvalidRtt ? "Enter an RTT greater than zero." : undefined}>
                  <Input
                    id="rtt"
                    type="number"
                    value={rttStr}
                    onChange={(e) => setRttStr(e.target.value)}
                    min="1"
                    aria-invalid={hasInvalidRtt}
                    className="h-10 bg-black font-mono text-[#00ff9c] rounded-none"
                  />
                </ToolField>

                <ToolField htmlFor="tcp-window" label="TCP window size (KB)" helper="64 KB is a common baseline without window scaling; modern systems negotiate larger windows." error={hasInvalidWindowSize ? "Enter a TCP window size greater than zero." : undefined}>
                  <Input
                    id="tcp-window"
                    type="number"
                    value={windowSizeStr}
                    onChange={(e) => setWindowSizeStr(e.target.value)}
                    min="1"
                    aria-invalid={hasInvalidWindowSize}
                    className="h-10 bg-black font-mono text-[#00ff9c] rounded-none"
                  />
                </ToolField>
              </div>
            )}
            </div>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Results <span className="cursor-blink">_</span></ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {!isValid ? <ToolStatus tone="error" title="Awaiting valid input">Correct the highlighted values to calculate the transfer time.</ToolStatus> : simpleMode ? (
              <ToolStatGrid className="sm:grid-cols-1"><ToolStat label="Estimated download time" value={theoreticalTimeStr} context="Assumes full use of the configured link" tone="success" /></ToolStatGrid>
            ) : (
              <>
                <ToolStatGrid className="sm:grid-cols-2">
                  <ToolStat label="Theoretical time" value={theoreticalTimeStr} context="Perfect link" tone="info" />
                  <ToolStat label="Estimated real time" value={realTimeStr} context="TCP limited" tone="success" />
                </ToolStatGrid>
                <ToolStatus tone="info" title="Maximum TCP throughput">{maxTcpThroughputStr}. TCP acknowledgements make RTT and receive-window size relevant on long, fast links.</ToolStatus>
              </>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

export default function BandwidthTool() {
  return <BandwidthToolContent />;
}
