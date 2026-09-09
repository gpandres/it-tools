"use client";

import { ToolActionButton, ToolActionPanel } from "@/components/tool-action-panel";
import { useNotification } from "@/components/notification-provider";
import { CircleAlert, CircleX, Info } from "lucide-react";

export function NotificationDemo() {
  const { notify } = useNotification();

  return (
    <ToolActionPanel label="TEST" className="rounded-none">
      <ToolActionButton className="rounded-none" onClick={() => notify("Copied to clipboard")}><Info />Show info</ToolActionButton>
      <ToolActionButton className="rounded-none" onClick={() => notify("Review the selected value", "attention")}><CircleAlert />Show attention</ToolActionButton>
      <ToolActionButton className="rounded-none" tone="danger" onClick={() => notify("Input validation failed", "error")}><CircleX />Show error</ToolActionButton>
    </ToolActionPanel>
  );
}
