import * as React from "react";
import { ChevronRight, CircleAlert, CircleCheck, CircleX, Info } from "lucide-react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

export type ToolTone = "neutral" | "info" | "success" | "attention" | "error";

const toneStyles: Record<ToolTone, { border: string; text: string; background: string }> = {
  neutral: { border: "border-[#2a2a2a]", text: "text-zinc-400", background: "bg-[#080808]" },
  info: { border: "border-sky-500/40", text: "text-sky-200", background: "bg-sky-500/5" },
  success: { border: "border-[#176b52]", text: "text-[#9fffd1]", background: "bg-[#176b52]/5" },
  attention: { border: "border-[#795c19]", text: "text-[#fbbf24]", background: "bg-[#795c19]/5" },
  error: { border: "border-[#8f2435]", text: "text-[#ff9aa9]", background: "bg-[#8f2435]/5" },
};

export function ToolPanel({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="tool-panel" className={cn("min-w-0 border border-[#1a1a1a] bg-[#050505]", className)} {...props} />;
}

export function ToolPanelHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="tool-panel-header" className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3", className)} {...props} />;
}

export function ToolPanelTitle({ marker, className, children, ...props }: React.ComponentProps<"h2"> & { marker?: string }) {
  return <h2 data-slot="tool-panel-title" className={cn("text-xs font-bold uppercase tracking-widest text-[#00ff9c]", className)} {...props}>
    {marker && <><span className="mr-2 text-[#00ff9c]">[{marker}]</span>{" "}</>}
    {children}
  </h2>;
}

export function ToolPanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tool-panel-body" className={cn("min-w-0 p-4 sm:p-5", className)} {...props} />;
}

export function ToolPanelFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return <footer data-slot="tool-panel-footer" className={cn("border-t border-[#1a1a1a] px-4 py-3", className)} {...props} />;
}

export function ToolBadge({ tone = "neutral", className, ...props }: React.ComponentProps<"span"> & { tone?: ToolTone | "shortcut" }) {
  const style = tone === "shortcut"
    ? "border-[#2a2a2a] bg-[#111111] text-zinc-400"
    : `${toneStyles[tone].border} ${toneStyles[tone].text}`;
  return <span data-slot="tool-badge" className={cn("inline-flex min-h-5 items-center border px-1.5 text-[9px] font-bold uppercase tracking-wider", style, className)} {...props} />;
}

const statusIcons = { neutral: Info, info: Info, success: CircleCheck, attention: CircleAlert, error: CircleX } as const;

export function ToolStatus({ tone = "info", title, className, children, ...props }: React.ComponentProps<"div"> & { tone?: ToolTone; title?: React.ReactNode }) {
  const Icon = statusIcons[tone];
  const role = tone === "error" ? "alert" : "status";
  const style = toneStyles[tone];
  return <div data-slot="tool-status" role={role} className={cn("flex items-start gap-2 border p-3 text-xs", style.border, style.text, style.background, className)} {...props}>
    <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <div className="min-w-0">
      {title && <div className="font-bold">{title}</div>}
      <div className={cn("leading-relaxed", title && "mt-1")}>{children}</div>
    </div>
  </div>;
}

export function ToolField({ htmlFor, label, helper, error, required, className, children }: {
  htmlFor: string;
  label: React.ReactNode;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return <div data-slot="tool-field" className={cn("space-y-2", className)}>
    <Label htmlFor={htmlFor} className="text-xs font-bold text-zinc-200">
      {label}{required && <span className="ml-1 text-red-400" aria-hidden="true">*</span>}
    </Label>
    {children}
    {error
      ? <p className="text-[10px] leading-relaxed text-red-400">{error}</p>
      : helper && <p className="text-[10px] leading-relaxed text-zinc-400">{helper}</p>}
  </div>;
}

export function ToolDisclosure({ title, defaultOpen, className, children }: { title: React.ReactNode; defaultOpen?: boolean; className?: string; children: React.ReactNode }) {
  return <details data-slot="tool-disclosure" className={cn("group border-b border-[#1a1a1a] py-3", className)} open={defaultOpen || undefined}>
    <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100">
      <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
      {title}
    </summary>
    <div className="mt-3">{children}</div>
  </details>;
}

export function ToolEmptyState({ icon: Icon = Info, title, children, actions, className }: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return <div data-slot="tool-empty-state" className={cn("flex min-h-36 flex-col items-center justify-center border border-dashed border-[#2a2a2a] bg-black p-5 text-center", className)}>
    <Icon className="mb-3 h-6 w-6 text-zinc-400" aria-hidden={true} />
    <h3 className="text-xs font-bold text-zinc-200">{title}</h3>
    {children && <div className="mt-1 max-w-lg text-[10px] leading-relaxed text-zinc-400">{children}</div>}
    {actions && <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div>}
  </div>;
}

export function ToolStatGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tool-stat-grid" className={cn("grid grid-cols-2 gap-px border border-[#1a1a1a] bg-[#1a1a1a] sm:grid-cols-4", className)} {...props} />;
}

export function ToolStat({ label, value, context, tone = "neutral", className }: { label: React.ReactNode; value: React.ReactNode; context?: React.ReactNode; tone?: ToolTone; className?: string }) {
  return <div data-slot="tool-stat" className={cn("min-w-0 bg-[#050505] p-3", className)}>
    <span className="text-[9px] uppercase tracking-widest text-zinc-400">{label}</span>
    <strong className={cn("mt-2 block break-words text-xl text-zinc-100", tone !== "neutral" && toneStyles[tone].text)}>{value}</strong>
    {context && <span className={cn("text-[9px] text-zinc-400", tone !== "neutral" && toneStyles[tone].text)}>{context}</span>}
  </div>;
}

export function ToolProgress({ value, max = 100, label, valueLabel, tone = "success", className }: {
  value: number;
  max?: number;
  label: React.ReactNode;
  valueLabel?: React.ReactNode;
  tone?: Exclude<ToolTone, "neutral">;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.max(0, Math.min(safeMax, value));
  const percentage = (safeValue / safeMax) * 100;
  const fill = tone === "info" ? "bg-sky-300" : tone === "attention" ? "bg-[#fbbf24]" : tone === "error" ? "bg-red-400" : "bg-[#00ff9c]";
  return <div data-slot="tool-progress" className={cn("space-y-2", className)}>
    <div className="flex items-center justify-between gap-3 text-[10px]"><span className="font-bold uppercase tracking-widest text-zinc-400">{label}</span><span className={toneStyles[tone].text}>{valueLabel ?? `${Math.round(percentage)}%`}</span></div>
    <div role="progressbar" aria-label={typeof label === "string" ? label : undefined} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue} className="h-1 border border-[#2a2a2a] bg-black"><div className={cn("h-full", fill)} style={{ width: `${percentage}%` }} /></div>
  </div>;
}

export type ToolTimelineItem = {
  id: string;
  timestamp: React.ReactNode;
  severity: React.ReactNode;
  title: React.ReactNode;
  detail?: React.ReactNode;
  tone?: ToolTone;
};

const timelineMarkers: Record<ToolTone, string> = {
  neutral: "border-zinc-400 bg-zinc-400",
  info: "border-sky-300 bg-sky-300",
  success: "border-[#00ff9c] bg-[#00ff9c]",
  attention: "border-[#fbbf24] bg-[#fbbf24]",
  error: "border-red-400 bg-red-400",
};

export function ToolTimeline({ items, className, empty }: { items: ToolTimelineItem[]; className?: string; empty?: React.ReactNode }) {
  if (items.length === 0) return <ToolEmptyState title="No events">{empty ?? "Events appear here when data is available."}</ToolEmptyState>;
  return <ol data-slot="tool-timeline" className={cn("relative space-y-4 border-l border-[#2a2a2a] pl-5", className)}>
    {items.map(item => {
      const tone = item.tone ?? "neutral";
      return <li key={item.id} className="relative">
        <span className={cn("absolute -left-[1.35rem] top-1 h-2 w-2 border", timelineMarkers[tone])} aria-hidden="true" />
        <p className="text-[9px] text-zinc-400">{item.timestamp} · <span className={toneStyles[tone].text}>{item.severity}</span></p>
        <p className="mt-1 text-xs text-zinc-300">{item.title}</p>
        {item.detail && <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">{item.detail}</p>}
      </li>;
    })}
  </ol>;
}
