import { Check, CircleAlert, Clock3, Database, ShieldAlert } from "lucide-react";

const ticks = ["T−24h", "T−20h", "T−16h", "T−12h", "T−08h", "T−04h", "T0", "T+04h"];

const events = [
  { time: "09:00 UTC", offset: "T−04:00", position: 71.4286, label: "Last backup", detail: "Latest recovery point", tone: "info", icon: Database },
  { time: "13:00 UTC", offset: "T0", position: 85.7143, label: "Disaster event", detail: "Service interruption", tone: "failure", icon: ShieldAlert },
  { time: "17:00 UTC", offset: "T+04:00", position: 100, label: "System restored", detail: "Operations resumed", tone: "success", icon: Check },
] as const;

const toneClasses = {
  info: { accent: "text-sky-300", border: "border-sky-400/40", marker: "border-sky-300 bg-sky-300/20" },
  failure: { accent: "text-red-300", border: "border-red-400/50", marker: "border-red-300 bg-red-300/20" },
  success: { accent: "text-[#9fffd1]", border: "border-[#176b52]", marker: "border-[#00ff9c] bg-[#00ff9c]/20" },
};

export function HorizontalTimelineDemo() {
  return (
    <div className="overflow-x-auto border border-[#1a1a1a] bg-black p-4 sm:p-6">
      <div className="min-w-[64rem]">
        <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#00ff9c] glow">Recovery timeline</h3>
            <p className="mt-1 text-[9px] uppercase tracking-widest text-zinc-600">one proportional elapsed-time scale · UTC</p>
          </div>
          <span className="border border-[#2a2a2a] px-2 py-1 text-[9px] uppercase tracking-widest text-zinc-500">4 h per interval</span>
        </div>

        <div className="mt-7 px-4">
          <div className="relative h-8 border-b border-[#2a2a2a] text-[9px] text-zinc-600">
            {ticks.map((tick, index) => (
              <div
                key={tick}
                className={`absolute bottom-0 pb-3 ${index === 7 ? "-translate-x-full text-right" : "text-left"}`}
                style={{ left: `${(index / 7) * 100}%` }}
              >
                <span className={tick === "T0" ? "font-bold text-red-300" : ""}>{tick === "T0" ? "T0 · INCIDENT" : tick}</span>
                <span className="absolute bottom-0 left-0 h-2 border-l border-[#2a2a2a]" aria-hidden="true" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px border-x border-b border-[#1a1a1a] bg-[#1a1a1a]">
            <div className="col-span-6 flex min-h-16 items-center justify-between bg-[#080808] px-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-sky-300">RPO window · 24 hours</p>
                <p className="mt-1 text-[9px] text-zinc-600">Maximum recoverable data-loss interval before the incident.</p>
              </div>
              <span className="text-[10px] font-bold text-sky-300">24 h</span>
            </div>
            <div className="flex min-h-16 flex-col items-center justify-center bg-[#080808] text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-300">RTO</p>
              <p className="mt-1 text-[10px] font-bold text-red-300">4 h</p>
              <p className="mt-1 text-[8px] uppercase tracking-wider text-zinc-600">downtime</p>
            </div>
          </div>

          <div className="relative h-16 border-b border-[#2a2a2a]">
            {events.map(event => {
              const tone = toneClasses[event.tone];
              const isFinalEvent = event.position === 100;

              return (
                <div
                  key={event.label}
                  className={`absolute bottom-0 flex flex-col items-center ${isFinalEvent ? "-translate-x-full items-end" : "-translate-x-1/2"}`}
                  style={{ left: `${event.position}%` }}
                >
                  <span className={`mb-2 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider ${tone.accent}`}>
                    {event.label}
                  </span>
                  <span className={`h-3 w-3 border-2 ${tone.marker}`} aria-hidden="true" />
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {events.map(event => {
              const Icon = event.icon;
              const tone = toneClasses[event.tone];
              return (
                <article key={event.label} className={`border bg-[#050505] p-3 ${tone.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-3 w-3 shrink-0 border-2 ${tone.marker}`} aria-hidden="true" />
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${tone.accent}`} aria-hidden="true" />
                      <h4 className="text-[10px] font-bold text-zinc-200">{event.label}</h4>
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold ${tone.accent}`}>{event.offset}</span>
                  </div>
                  <div className={`mt-3 text-[10px] ${tone.accent}`}>{event.time}</div>
                  <p className="mt-1 text-[9px] text-zinc-600">{event.detail}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 border-t border-[#1a1a1a] pt-3 text-[10px] leading-relaxed text-zinc-600">
          <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <p><span className="text-zinc-400">Scale reading:</span> six 4-hour intervals make the 24-hour RPO window; one matching interval makes the 4-hour RTO window. Milestone cards report exact UTC and elapsed time.</p>
        </div>
      </div>
    </div>
  );
}
