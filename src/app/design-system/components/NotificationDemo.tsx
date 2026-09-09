"use client";

import { ToolActionButton, ToolActionPanel } from "@/components/tool-action-panel";
import { useNotification } from "@/components/notification-provider";

export function NotificationDemo() {
  const { notify } = useNotification();

  return (
    <ToolActionPanel label="TEST" className="rounded-none">
      <ToolActionButton className="rounded-none" onClick={() => notify("Copied to clipboard")}>Show info</ToolActionButton>
      <ToolActionButton className="rounded-none" tone="danger" onClick={() => notify("Input validation failed", "error")}>Show error</ToolActionButton>
    </ToolActionPanel>
  );
}
