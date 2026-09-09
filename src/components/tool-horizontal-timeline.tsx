import * as React from "react";
import { Clock3 } from "lucide-react";
import { cn } from "cn";
import type { ToolTone } from "@/components/tool-ui";

type TimelineIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export type ToolHorizontalTimelineEvent = {
  id: string;
  position: number;
  label: string;
  time: React.ReactNode;
  offset?: React.ReactNode;
  detail?: React.ReactNode;
  tone?: ToolTone;
  icon?: TimelineIcon;
};

export type ToolHorizontalTimelineSegment = {
  id: string;
  start: number;
  end: number;
  label: React.ReactNode;
  value?: React.ReactNode;
  detail?: React.ReactNode;
  tone?: ToolTone;
};

const toneStyles: Record<ToolTone, { text: string; border: string; marker: string }> = {
  neutral: { text: "text-zinc-400", border: "border-[#2a2a2a]", marker: "border-zinc-400 bg-zinc-400/20" },
  info: { text: "text-sky-300", border: "border-sky-400/40", marker: "border-sky-300 bg-sky-300/20" },
  success: { text: "text-[#9fffd1]", border: "border-[#176b52]", marker: "border-[#00ff9c] bg-[#00ff9c]/20" },
  attention: { text: "text-[#fbbf24]", border: "border-[#795c19]", marker: "border-[#fbbf24] bg-[#fbbf24]/20" },
  error: { text: "text-red-300", border: "border-red-400/50", marker: "border-red-300 bg-red-300/20" },
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function ToolHorizontalTimeline({ title, subtitle, scaleLabel, ticks, segments, events, summary, minWidth = 1024, className, ariaLabel }: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  scaleLabel?: React.ReactNode;
  ticks: React.ReactNode[];
  segments?: ToolHorizontalTimelineSegment[];
  events: ToolHorizontalTimelineEvent[];
  summary?: React.ReactNode;
  minWidth?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return <div data-slot="tool-horizontal-timeline" role="region" aria-label={ariaLabel ?? (typeof title === "string" ? title : "Horizontal timeline")} tabIndex={0} className={cn("overflow-x-auto border border-[#1a1a1a] bg-black p-4 sm:p-6", className)}>
    <div style={{ minWidth }}>
      <div className="flex items-center justify-between gap-4 border-b border-[#1a1a1a] pb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#00ff9c] glow">{title}</h3>
          {subtitle && <p className="mt-1 text-[9px] uppercase tracking-widest text-zinc-400">{subtitle}</p>}
        </div>
        {scaleLabel && <span className="shrink-0 border border-[#2a2a2a] px-2 py-1 text-[9px] uppercase tracking-widest text-zinc-400">{scaleLabel}</span>}
      </div>

      <div className="mt-7 px-4">
        <div className="relative h-8 border-b border-[#2a2a2a] text-[9px] text-zinc-400">
          {ticks.map((tick, index) => {
            const position = ticks.length <= 1 ? 0 : (index / (ticks.length - 1)) * 100;
            return <div key={index} className={cn("absolute bottom-0 pb-3", index === ticks.length - 1 && "-translate-x-full text-right")} style={{ left: `${position}%` }}>
              <span>{tick}</span><span className="absolute bottom-0 left-0 h-2 border-l border-[#2a2a2a]" aria-hidden="true" />
            </div>;
          })}
        </div>

        {segments && segments.length > 0 && <div className="relative h-16 border-x border-b border-[#1a1a1a] bg-[#080808]">
          {segments.map(segment => {
            const start = clamp(segment.start);
            const end = clamp(segment.end);
            const tone = toneStyles[segment.tone ?? "neutral"];
            const isNarrow = Math.abs(end - start) < 20;
            return <div key={segment.id} data-slot="tool-horizontal-timeline-segment" className={cn("absolute inset-y-0 flex min-w-0 overflow-hidden border-r", isNarrow ? "flex-col items-start justify-center gap-1 px-3" : "items-center justify-between gap-3 px-4", tone.border)} style={{ left: `${Math.min(start, end)}%`, width: `${Math.abs(end - start)}%` }} title={typeof segment.detail === "string" ? segment.detail : undefined}>
              <div className="min-w-0"><p className={cn("truncate text-[9px] font-bold uppercase tracking-widest", tone.text)}>{segment.label}</p>{segment.detail && !isNarrow && <p className="mt-1 truncate text-[9px] text-zinc-400">{segment.detail}</p>}</div>
              {segment.value && <span className={cn("shrink-0 text-[10px] font-bold", tone.text)}>{segment.value}</span>}
            </div>;
          })}
        </div>}

        <div className="relative h-16 border-b border-[#2a2a2a]" aria-hidden="true">
          {events.map(event => {
            const position = clamp(event.position);
            const tone = toneStyles[event.tone ?? "neutral"];
            const edgeClass = position === 0 ? "items-start" : position === 100 ? "-translate-x-full items-end" : "-translate-x-1/2 items-center";
            return <div key={event.id} className={cn("absolute bottom-0 flex flex-col", edgeClass)} style={{ left: `${position}%` }}>
              <span className={cn("mb-2 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider", tone.text)}>{event.label}</span>
              <span className={cn("h-3 w-3 border-2", tone.marker)} />
            </div>;
          })}
        </div>

        <ol className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(events.length, 1)}, minmax(0, 1fr))` }}>
          {events.map(event => {
            const Icon = event.icon;
            const tone = toneStyles[event.tone ?? "neutral"];
            return <li key={event.id} data-slot="tool-horizontal-timeline-card" className={cn("min-w-0 overflow-hidden border bg-[#050505] p-3", tone.border)}>
              <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2">{Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", tone.text)} aria-hidden={true} />}<h4 className="min-w-0 break-words text-[10px] font-bold text-zinc-200">{event.label}</h4></div>{event.offset && <span className={cn("shrink-0 text-[9px] font-bold", tone.text)}>{event.offset}</span>}</div>
              <div className={cn("mt-3 text-[10px]", tone.text)}>{event.time}</div>
              {event.detail && <p className="mt-1 text-[9px] text-zinc-400">{event.detail}</p>}
            </li>;
          })}
        </ol>
      </div>

      {summary && <div className="mt-5 flex items-start gap-2 border-t border-[#1a1a1a] pt-3 text-[10px] leading-relaxed text-zinc-400"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><p>{summary}</p></div>}
    </div>
  </div>;
}
