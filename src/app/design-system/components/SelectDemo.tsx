"use client";

import { useState } from "react";
import { ToolField, ToolStatus } from "@/components/tool-design";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SelectDemo() {
  const [scope, setScope] = useState<string | null>(null);
  return <div className="grid min-w-0 gap-4 xl:grid-cols-3">
    <ToolField htmlFor="reference-select" label="Processing mode" helper="Use arrows, Home/End or type to find an option.">
      <Select defaultValue="Local">
        <SelectTrigger id="reference-select" className="w-full rounded-none"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Local">Local</SelectItem>
          <SelectItem value="Extended analysis with a long descriptive option label">Extended analysis with a long descriptive option label</SelectItem>
          <SelectItem value="Offline" disabled>Offline (unavailable)</SelectItem>
        </SelectContent>
      </Select>
    </ToolField>
    <ToolField htmlFor="reference-select-disabled" label="Unavailable mode" helper="Disabled example; the current mode stays visible.">
      <Select defaultValue="Local" disabled>
        <SelectTrigger id="reference-select-disabled" className="w-full rounded-none"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="Local">Local</SelectItem></SelectContent>
      </Select>
    </ToolField>
    <ToolField htmlFor="reference-select-required" label="Required scope" required>
      <Select value={scope} onValueChange={setScope}>
        <SelectTrigger id="reference-select-required" aria-invalid={!scope} aria-describedby={!scope ? "reference-select-error" : undefined} className="w-full rounded-none">
          <SelectValue placeholder="Choose scope" />
        </SelectTrigger>
        <SelectContent><SelectItem value="Current tool">Current tool</SelectItem><SelectItem value="Workspace">Workspace</SelectItem></SelectContent>
      </Select>
      {!scope && <ToolStatus id="reference-select-error" tone="error">Choose a scope to continue.</ToolStatus>}
    </ToolField>
  </div>;
}
