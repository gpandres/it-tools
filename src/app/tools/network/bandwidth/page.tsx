"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import {
  ToolActionButton,
  ToolActionPanel,
  ToolField,
  ToolPanel,
  ToolPanelBody,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolStat,
  ToolStatGrid,
  ToolStatus,
} from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function parseNumericInput(value: string) {
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "-";
  if (seconds === 0) return "0 seconds";
  if (seconds < 1) return "< 1 second";

  const roundedSeconds = Math.round(seconds);
  if (roundedSeconds < 60) return `${roundedSeconds} seconds`;

  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainingSeconds = roundedSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
  return parts.join(" ");
}

function formatMbps(value: number) {
  return value < 0.01 ? "< 0.01 Mbps" : `${value.toFixed(2)} Mbps`;
}

function BandwidthToolContent() {
  const [simpleMode, setSimpleMode] = useState(true);
  const [fileSizeStr, setFileSizeStr] = useState("5");
  const [fileUnit, setFileUnit] = useState("GB");
  const [linkSpeedStr, setLinkSpeedStr] = useState("1");
  const [speedUnit, setSpeedUnit] = useState("Gbps");
  const [rttStr, setRttStr] = useState("50");
  const [windowSizeStr, setWindowSizeStr] = useState("64");

  const fileSize = parseNumericInput(fileSizeStr);
  const linkSpeed = parseNumericInput(linkSpeedStr);
  const rtt = parseNumericInput(rttStr);
  const windowSize = parseNumericInput(windowSizeStr);

  const hasInvalidFileSize = !Number.isFinite(fileSize) || fileSize < 0;
  const hasInvalidLinkSpeed = !Number.isFinite(linkSpeed) || linkSpeed <= 0;
  const hasInvalidRtt = !Number.isFinite(rtt) || rtt <= 0;
  const hasInvalidWindowSize = !Number.isFinite(windowSize) || windowSize <= 0;
  const isValid = !hasInvalidFileSize && !hasInvalidLinkSpeed &&
    (simpleMode || (!hasInvalidRtt && !hasInvalidWindowSize));

  let calculationError = false;
  let theoreticalTimeStr = "-";
  let maxTcpThroughputStr = "-";
  let realTimeStr = "-";

  if (isValid) {
    // File sizes and link rates use decimal units: 1 GB = 1,000 MB, 1 Gbps = 1,000 Mbps.
    const fileToMegabits: Record<string, number> = {
      KB: 0.008,
      MB: 8,
      GB: 8_000,
      TB: 8_000_000,
    };
    const speedToMbps: Record<string, number> = {
      Kbps: 0.001,
      Mbps: 1,
      Gbps: 1_000,
      Tbps: 1_000_000,
    };
    const sizeMegabits = fileSize * fileToMegabits[fileUnit];
    const speedMbps = linkSpeed * speedToMbps[speedUnit];
    const theoreticalSeconds = sizeMegabits / speedMbps;

    if (!Number.isFinite(sizeMegabits) || !Number.isFinite(speedMbps) || speedMbps <= 0 || !Number.isFinite(theoreticalSeconds)) {
      calculationError = true;
    } else {
      theoreticalTimeStr = formatTime(theoreticalSeconds);

      if (!simpleMode) {
        // A binary KiB window divided by RTT gives the TCP receive-window ceiling in Mbps.
        const tcpWindowMbps = windowSize * 8.192 / rtt;
        const limitedThroughputMbps = Math.min(tcpWindowMbps, speedMbps);
        const realSeconds = sizeMegabits / limitedThroughputMbps;

        if (!Number.isFinite(limitedThroughputMbps) || limitedThroughputMbps <= 0 || !Number.isFinite(realSeconds)) {
          calculationError = true;
          theoreticalTimeStr = "-";
        } else {
          const bottleneck = tcpWindowMbps >= speedMbps ? "Link speed" : "TCP window / latency";
          maxTcpThroughputStr = `${formatMbps(limitedThroughputMbps)} (Bottleneck: ${bottleneck})`;
          realTimeStr = formatTime(realSeconds);
        }
      }
    }
  }

  return (
    <ToolLayout
      title="Bandwidth & Transfer Time Calculator"
      description="Estimate transfer time from file size and link speed, with an optional TCP latency limit."
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <ToolActionPanel label="Mode">
          <ToolActionButton tone={simpleMode ? "accent" : "neutral"} aria-pressed={simpleMode} onClick={() => setSimpleMode(true)}>Simple</ToolActionButton>
          <ToolActionButton tone={!simpleMode ? "accent" : "neutral"} aria-pressed={!simpleMode} onClick={() => setSimpleMode(false)}>TCP / advanced</ToolActionButton>
        </ToolActionPanel>

        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN">Transfer config</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody>
            <div className={`grid min-w-0 gap-6 ${simpleMode ? "" : "lg:grid-cols-2"}`}>
              <div className={simpleMode ? "grid min-w-0 gap-5 lg:grid-cols-2" : "min-w-0 space-y-5"}>
                <ToolField
                  htmlFor="file-size"
                  label="File size"
                  helper={<span id="file-size-help">File sizes and link rates use decimal units (1 GB = 1,000 MB).</span>}
                  error={hasInvalidFileSize ? <span id="file-size-error">Enter a complete number of zero or greater.</span> : undefined}
                >
                  <div className="flex min-w-0 gap-2">
                    <Input
                      id="file-size"
                      type="number"
                      step="any"
                      value={fileSizeStr}
                      onChange={(event) => setFileSizeStr(event.target.value)}
                      min="0"
                      aria-invalid={hasInvalidFileSize}
                      aria-describedby={hasInvalidFileSize ? "file-size-error" : "file-size-help"}
                      className="h-10 min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300 focus-visible:ring-[#00ff9c]/50"
                    />
                    <Select value={fileUnit} onValueChange={(value) => setFileUnit(value ?? "GB")}>
                      <SelectTrigger aria-label="File size unit" className="h-10 w-24 shrink-0 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300 focus-visible:ring-[#00ff9c]/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border border-[#1a1a1a] bg-black text-zinc-200">
                        <SelectItem value="KB">KB</SelectItem>
                        <SelectItem value="MB">MB</SelectItem>
                        <SelectItem value="GB">GB</SelectItem>
                        <SelectItem value="TB">TB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </ToolField>

                <ToolField
                  htmlFor="link-speed"
                  label="Internet / link speed"
                  error={hasInvalidLinkSpeed ? <span id="link-speed-error">Enter a complete link speed greater than zero.</span> : undefined}
                >
                  <div className="flex min-w-0 gap-2">
                    <Input
                      id="link-speed"
                      type="number"
                      step="any"
                      value={linkSpeedStr}
                      onChange={(event) => setLinkSpeedStr(event.target.value)}
                      min="0"
                      aria-invalid={hasInvalidLinkSpeed}
                      aria-describedby={hasInvalidLinkSpeed ? "link-speed-error" : undefined}
                      className="h-10 min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300 focus-visible:ring-[#00ff9c]/50"
                    />
                    <Select value={speedUnit} onValueChange={(value) => setSpeedUnit(value ?? "Gbps")}>
                      <SelectTrigger aria-label="Link speed unit" className="h-10 w-24 shrink-0 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300 focus-visible:ring-[#00ff9c]/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border border-[#1a1a1a] bg-black text-zinc-200">
                        <SelectItem value="Kbps">Kbps</SelectItem>
                        <SelectItem value="Mbps">Mbps</SelectItem>
                        <SelectItem value="Gbps">Gbps</SelectItem>
                        <SelectItem value="Tbps">Tbps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </ToolField>
              </div>

              {!simpleMode && (
                <div className="min-w-0 space-y-5">
                  <h3 className="border-b border-[#1a1a1a] pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Latency impact (TCP)
                  </h3>
                  <ToolField
                    htmlFor="rtt"
                    label="Round-trip time (ms)"
                    error={hasInvalidRtt ? <span id="rtt-error">Enter a complete RTT greater than zero.</span> : undefined}
                  >
                    <Input
                      id="rtt"
                      type="number"
                      step="any"
                      value={rttStr}
                      onChange={(event) => setRttStr(event.target.value)}
                      min="0"
                      aria-invalid={hasInvalidRtt}
                      aria-describedby={hasInvalidRtt ? "rtt-error" : undefined}
                      className="h-10 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300 focus-visible:ring-[#00ff9c]/50"
                    />
                  </ToolField>

                  <ToolField
                    htmlFor="tcp-window"
                    label="TCP window size (KiB)"
                    helper={<span id="tcp-window-help">Uses 1 KiB = 1,024 bytes and one window per RTT; excludes loss, protocol overhead, and other bottlenecks.</span>}
                    error={hasInvalidWindowSize ? <span id="tcp-window-error">Enter a complete TCP window size greater than zero.</span> : undefined}
                  >
                    <Input
                      id="tcp-window"
                      type="number"
                      step="any"
                      value={windowSizeStr}
                      onChange={(event) => setWindowSizeStr(event.target.value)}
                      min="0"
                      aria-invalid={hasInvalidWindowSize}
                      aria-describedby={hasInvalidWindowSize ? "tcp-window-error" : "tcp-window-help"}
                      className="h-10 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300 focus-visible:ring-[#00ff9c]/50"
                    />
                  </ToolField>
                </div>
              )}
            </div>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Results <span className="cursor-blink">_</span></ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {!isValid ? (
              <ToolStatus tone="error" title="Awaiting valid input">
                Correct the highlighted values to calculate the transfer time.
              </ToolStatus>
            ) : calculationError ? (
              <ToolStatus tone="error" title="Values exceed the calculator range">
                These values produce a result outside the supported numeric range. Try smaller values.
              </ToolStatus>
            ) : simpleMode ? (
              <ToolStatGrid className="sm:grid-cols-1">
                <ToolStat
                  label="Estimated download time"
                  value={theoreticalTimeStr}
                  context="Assumes full use of the configured link; excludes protocol and storage overhead."
                  tone="success"
                />
              </ToolStatGrid>
            ) : (
              <>
                <ToolStatGrid className="grid-cols-1 sm:grid-cols-2">
                  <ToolStat label="Theoretical time" value={theoreticalTimeStr} context="Full configured link rate" tone="info" />
                  <ToolStat label="TCP-limited time" value={realTimeStr} context="Limited by link or TCP window / RTT" tone="success" />
                </ToolStatGrid>
                <ToolStatus tone="info" title="TCP throughput estimate">
                  {maxTcpThroughputStr}. This is a receive-window ceiling based on one window per RTT; actual transfers may be slower.
                </ToolStatus>
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
