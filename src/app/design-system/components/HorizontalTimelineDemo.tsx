import { Check, CircleAlert, Clock3, Database, ShieldAlert } from "lucide-react";

const events = [
  { time: "09:00 UTC · T+00:00", label: "Last backup", detail: "Recovery point", tone: "blue", icon: Database },
  { time: "13:00 UTC · T+04:00", label: "Disaster event", detail: "Service interruption", tone: "red", icon: ShieldAlert },
  { time: "17:00 UTC · T+08:00", label: "System restored", detail: "Operations resumed", tone: "green", icon: Check },
] as const;

const toneClasses = {
  blue: { marker: "border-sky-400 bg-sky-400/20", accent: "text-sky-300", border: "border-sky-400/30" },
  red: { marker: "border-red-400 bg-red-400/20", accent: "text-red-300", border: "border-red-400/30" },
  green: { marker: "border-[#00ff9c] bg-[#00ff9c]/20", accent: "text-[#9fffd1]", border: "border-[#176b52]" },
};

export function HorizontalTimelineDemo() {
  return <div className="overflow-x-auto border border-[#1a1a1a] bg-black p-4 sm:p-6"><div className="min-w-[42rem]"><div className="mb-6 flex items-center justify-between border-b border-[#1a1a1a] pb-3"><h3 className="text-sm font-bold uppercase tracking-widest text-[#00ff9c] glow">Horizontal timeline</h3><span className="text-[9px] uppercase tracking-widest text-zinc-600">elapsed time · UTC</span></div><div className="relative pt-8"><div className="absolute left-[8%] right-[8%] top-[2.4rem] h-px bg-[#2a2a2a]" /><div className="relative grid grid-cols-3 gap-3">{events.map(event => { const Icon = event.icon; const tone = toneClasses[event.tone]; return <div key={event.label} className="relative flex min-w-0 flex-col items-center"><div className={`z-10 h-3 w-3 border-2 ${tone.marker}`} aria-hidden="true" /><div className={`mt-4 w-full border bg-[#050505] p-3 ${tone.border}`}><div className="flex items-center gap-2"><Icon className={`h-4 w-4 shrink-0 ${tone.accent}`} /><span className="min-w-0 truncate text-[10px] font-bold text-zinc-200">{event.label}</span></div><div className={`mt-2 text-[9px] ${tone.accent}`}>{event.time}</div><div className="mt-1 truncate text-[9px] text-zinc-600">{event.detail}</div></div></div>; })}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:mx-[8%]"><div className="border-t border-sky-400/60 pt-2 text-center"><span className="text-[10px] font-bold text-sky-300">RPO: 24 hrs</span><span className="ml-2 text-[8px] uppercase tracking-widest text-zinc-600">max data loss</span></div><div className="border-t border-red-400/60 pt-2 text-center"><span className="text-[10px] font-bold text-red-300">RTO: 4 hrs</span><span className="ml-2 text-[8px] uppercase tracking-widest text-zinc-600">max downtime</span></div></div></div><div className="mt-5 flex items-center gap-2 border-t border-[#1a1a1a] pt-3 text-[10px] text-zinc-600"><Clock3 className="h-3.5 w-3.5" /><CircleAlert className="h-3.5 w-3.5 text-amber-300" />Exact UTC time, elapsed time and recovery target are shown together.</div></div></div>;
}
