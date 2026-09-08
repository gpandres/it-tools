"use client";

import { TelemetryReference } from "@/components/telemetry-reference";
import { LINUX_EVENTS_DB, type LinuxEventType } from "@/lib/linux-events-db";

const TYPES: LinuxEventType[] = [
  "All",
  "System Logs",
  "Auditd",
  "Authentication",
  "File System",
];

export default function LinuxEventsLookup() {
  return <TelemetryReference
    title="Linux Telemetry Reference"
    description="Quickly search and reference Linux logs, journald and auditd records."
    searchPlaceholder="Search event, field, MITRE..."
    filterLabel="Log Type"
    emptyMessage="No telemetry logs found matching your filters."
    itemLabel="Log"
    items={LINUX_EVENTS_DB}
    types={TYPES}
    accent="orange"
  />;
}
