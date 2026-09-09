import { Check, Database, ShieldAlert } from "lucide-react";
import { ToolHorizontalTimeline } from "@/components/tool-design";

const ticks = ["T−24h", "T−20h", "T−16h", "T−12h", "T−08h", "T−04h", <strong key="incident" className="text-red-300">T0 · incident</strong>, "T+04h"];

const segments = [
  { id: "recovery-point", start: 0, end: 85.7143, label: "RPO window · 24 hours", value: "24 h", detail: "Maximum recoverable data-loss interval before the incident.", tone: "info" },
  { id: "recovery-time", start: 85.7143, end: 100, label: "RTO", value: "4 h", detail: "Downtime", tone: "error" },
] as const;

const events = [
  { id: "backup", time: "09:00 UTC", offset: "T−04:00", position: 71.4286, label: "Last backup", detail: "Latest recovery point", tone: "info", icon: Database },
  { id: "incident", time: "13:00 UTC", offset: "T0", position: 85.7143, label: "Disaster event", detail: "Service interruption", tone: "error", icon: ShieldAlert },
  { id: "restored", time: "17:00 UTC", offset: "T+04:00", position: 100, label: "System restored", detail: "Operations resumed", tone: "success", icon: Check },
] as const;

export function HorizontalTimelineDemo() {
  return <ToolHorizontalTimeline
    title="Recovery timeline"
    subtitle="one proportional elapsed-time scale · UTC"
    scaleLabel="4 h per interval"
    ticks={ticks}
    segments={[...segments]}
    events={[...events]}
    summary={<><span className="text-zinc-400">Scale reading:</span> six 4-hour intervals make the 24-hour RPO window; one matching interval makes the 4-hour RTO window. Milestone cards report exact UTC and elapsed time.</>}
  />;
}
