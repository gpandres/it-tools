import { Check, Database, ShieldAlert } from "lucide-react";
import { ToolHorizontalTimeline } from "@/components/tool-design";

const ticks = ["T−24h", "T−20h", "T−16h", "T−12h", "T−08h", "T−04h", <strong key="incident" className="text-red-300">T0 · incident</strong>, "T+04h", "T+08h"];

const segments = [
  { id: "recovery-point", start: 0, end: 75, label: "RPO window · 24 hours", value: "24 h", detail: "Maximum recoverable data-loss interval before the incident.", tone: "info" },
  { id: "recovery-time", start: 75, end: 87.5, label: "RTO", value: "4 h", detail: "Downtime", tone: "error" },
  { id: "restored-state", start: 87.5, end: 100, label: "System restored", value: "Operational", detail: "Service is available after recovery.", tone: "success" },
] as const;

const events = [
  { id: "backup", time: "13:00 UTC · previous day", offset: "T−24:00", position: 0, label: "Last backup", detail: "Recovery point anchoring this example window", tone: "info", icon: Database },
  { id: "incident", time: "13:00 UTC", offset: "T0", position: 75, label: "Disaster event", detail: "Service interruption", tone: "error", icon: ShieldAlert },
  { id: "restored", time: "17:00 UTC", offset: "T+04:00", position: 87.5, label: "System restored", detail: "Operations resumed", tone: "success", icon: Check },
] as const;

export function HorizontalTimelineDemo() {
  return <ToolHorizontalTimeline
    title="Recovery timeline"
    subtitle="one proportional elapsed-time scale · UTC"
    scaleLabel="4 h per interval"
    ticks={ticks}
    segments={[...segments]}
    events={[...events]}
    summary={<><span className="text-zinc-400">Scale reading:</span> the example starts at its last backup, six 4-hour intervals before the incident. One interval is the 4-hour RTO; the final interval shows the restored state. Only markers on the scale encode event position; cards provide readable detail.</>}
  />;
}
