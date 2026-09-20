"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolActionPanel, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/components/notification-provider";
import { Copy } from "lucide-react";

type InputFormat = "auto" | "seconds" | "milliseconds" | "date";
const formats = [
  { value: "auto", label: "Auto" },
  { value: "seconds", label: "Seconds" },
  { value: "milliseconds", label: "Milliseconds" },
  { value: "date", label: "Date string" },
] as const;

function parseTimestamp(input: string, format: InputFormat) {
  const text = input.trim();
  if (!text) return null;
  const numeric = /^[+-]?\d+(?:\.\d+)?$/.test(text);
  let date: Date;
  if (format === "seconds" || format === "milliseconds" || (format === "auto" && numeric)) {
    if (!numeric) return null;
    const value = Number(text);
    const seconds = format === "seconds" || (format === "auto" && Math.abs(value) < 10_000_000_000);
    date = new Date(value * (seconds ? 1000 : 1));
  } else {
    date = new Date(text);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function TimestampConverterTool() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<InputFormat>("auto");
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const { notify } = useNotification();

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = parseTimestamp(input, format);
  const invalid = !!input.trim() && !date;
  const results = date ? [
    { id: "local", label: "Local Time (Your Browser)", value: date.toString() },
    { id: "utc", label: "UTC / GMT Time", value: date.toUTCString() },
    { id: "iso", label: "ISO 8601", value: date.toISOString() },
    { id: "unix", label: "Unix Epoch (Seconds)", value: Math.floor(date.getTime() / 1000).toString() },
    { id: "ms", label: "Unix Timestamp (Milliseconds)", value: date.getTime().toString() },
  ] : [];

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the result and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="Timestamp Converter" description="Convert Unix epoch timestamps to human-readable dates, ISO 8601, and local time zones instantly.">
      <div className="space-y-6">
        <ToolActionPanel label="INPUT FORMAT">
          {formats.map(option => <ToolActionButton key={option.value} aria-pressed={format === option.value} tone={format === option.value ? "accent" : "neutral"} onClick={() => setFormat(option.value)}>{option.label}</ToolActionButton>)}
        </ToolActionPanel>
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="IN">Timestamp or Date</ToolPanelTitle>
              <ToolActionButton onClick={() => { setFormat("seconds"); setInput(Math.floor(Date.now() / 1000).toString()); }}>Current Unix Time</ToolActionButton>
            </ToolPanelHeader>
            <ToolPanelBody className="space-y-4">
              <ToolField htmlFor="timestamp-input" label="Timestamp or date string" helper="Use ISO 8601 with Z or an offset for an unambiguous timezone. Date strings without a timezone follow browser parsing rules.">
                <Input id="timestamp-input" value={input} onChange={event => setInput(event.target.value)} placeholder="1709240000 or 2024-03-01T12:00:00Z"
                  aria-invalid={invalid} aria-describedby={invalid ? "timestamp-error" : "timestamp-format-help"}
                  className="rounded-none border-[#1a1a1a] bg-black! text-zinc-300" spellCheck={false} />
              </ToolField>
              {invalid && <ToolStatus id="timestamp-error" tone="error" title="Invalid timestamp or date">Enter a valid value for the selected input format, within the supported date range.</ToolStatus>}
              <p id="timestamp-format-help" className="text-xs leading-relaxed text-zinc-400">Auto treats numbers with an absolute value below 10,000,000,000 as seconds; larger numbers as milliseconds. Choose a unit explicitly for older millisecond timestamps or distant dates.</p>
              <div className="flex flex-wrap justify-between gap-3 border border-[#1a1a1a] bg-black p-3 text-xs text-zinc-400">
                <span>Live Epoch (seconds)</span><span className="text-zinc-300">{currentTime === null ? "Loading..." : Math.floor(currentTime / 1000)}</span>
              </div>
            </ToolPanelBody>
          </ToolPanel>
          <ToolPanel>
            <ToolPanelHeader><ToolPanelTitle marker="OUT">Converted Results</ToolPanelTitle></ToolPanelHeader>
            <ToolPanelBody className="space-y-4">
              {!date ? <ToolEmptyState title={invalid ? "Fix the input to continue" : "Awaiting timestamp"}>Enter a timestamp or date string to see local, UTC and Unix formats.</ToolEmptyState> : (
                <>
                  {results.map(result => (
                    <ToolField key={result.id} htmlFor={`timestamp-${result.id}`} label={result.label}>
                      <div className="flex min-w-0 items-center gap-2">
                        <Input id={`timestamp-${result.id}`} readOnly value={result.value} className="min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                        <ToolActionButton aria-label={`Copy ${result.label}`} onClick={() => copy(result.value)}><Copy aria-hidden="true" /></ToolActionButton>
                      </div>
                    </ToolField>
                  ))}
                  <div className="border-t border-[#1a1a1a] pt-4 text-xs text-zinc-400">
                    <p className="mb-2 font-bold">Relative Time</p>
                    <p className="text-zinc-300">{currentTime === null ? "Loading..." : getRelativeTimeString(date, currentTime)}</p>
                  </div>
                </>
              )}
            </ToolPanelBody>
          </ToolPanel>
        </div>
      </div>
    </ToolLayout>
  );
}

function getRelativeTimeString(date: Date, now: number) {
  const diffMs = date.getTime() - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffYear = Math.round(diffDay / 365);
  const suffix = diffMs < 0 ? "ago" : "from now";
  const abs = Math.abs;
  if (abs(diffSec) < 60) return `${abs(diffSec)} seconds ${suffix}`;
  if (abs(diffMin) < 60) return `${abs(diffMin)} minutes ${suffix}`;
  if (abs(diffHour) < 24) return `${abs(diffHour)} hours ${suffix}`;
  if (abs(diffDay) < 365) return `${abs(diffDay)} days ${suffix}`;
  return `${abs(diffYear)} years ${suffix}`;
}
