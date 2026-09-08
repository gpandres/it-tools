"use client";

import { TelemetryReference } from "@/components/telemetry-reference";
import { WIN_EVENTS_DB, type WinEventType } from "@/lib/windows-events-db";

const TYPES: WinEventType[] = [
  "All",
  "Process Creation",
  "Process Lifecycle",
  "Network Connection",
  "File System",
  "Registry",
  "Interprocess Communication",
  "Authentication",
  "System",
  "Object Access",
];

export default function WindowsEventsLookup() {
  return <TelemetryReference
    title="Windows Events Reference"
    description="Quickly search and reference Windows Security and Sysmon Event IDs."
    searchPlaceholder="Search ID, field, MITRE..."
    filterLabel="Event Type"
    emptyMessage="No events found matching your filters."
    itemLabel="Event"
    items={WIN_EVENTS_DB}
    types={TYPES}
    accent="blue"
  />;
}
