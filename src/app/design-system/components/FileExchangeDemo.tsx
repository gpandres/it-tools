"use client";

import { Download, FilePlus2, Info, Trash2, Upload } from "lucide-react";
import { ToolActionButton, ToolConfirmDialog, ToolDialog, ToolFileDropzone, ToolStatus } from "@/components/tool-design";

const dialogs = [
  {
    id: "info",
    label: "Info",
    icon: Info,
    title: "Workspace information",
    description: "Explain the current object or workflow without moving the user away from the tool.",
    action: "Done",
  },
  {
    id: "new",
    label: "New",
    icon: FilePlus2,
    title: "New workspace",
    description: "Choose a safe starting point before replacing current local state.",
    action: "Create",
  },
  {
    id: "welcome",
    label: "Welcome",
    icon: Info,
    title: "Welcome to this tool",
    description: "Use a short first-run guide for the core workflow and where data is processed.",
    action: "Start",
  },
  {
    id: "import",
    label: "Import",
    icon: Upload,
    title: "Import data",
    description: "Select a supported local file. Validate it before replacing current state.",
    action: "Validate",
  },
  {
    id: "export",
    label: "Export",
    icon: Download,
    title: "Export results",
    description: "Choose a supported output format. Generation stays in this browser.",
    action: "Generate",
  },
] as const;

export function FileExchangeDemo() {
  return <div className="flex flex-wrap gap-2">
    {dialogs.map(item => <ToolDialog
      key={item.id}
      trigger={<ToolActionButton className="rounded-none">{item.icon && <item.icon />}{item.label}</ToolActionButton>}
      title={item.title}
      description={item.description}
      icon={item.icon}
      actions={[{ label: item.action }]}
    >
      <DialogExample kind={item.id} />
    </ToolDialog>)}
    <ToolConfirmDialog
      trigger={<ToolActionButton className="rounded-none" tone="danger"><Trash2 />Clear</ToolActionButton>}
      title="Clear current results?"
      description="This removes current local results. Source input remains unchanged."
      confirmLabel="Clear results"
      onConfirm={() => undefined}
    />
  </div>;
}

function DialogExample({ kind }: { kind: typeof dialogs[number]["id"] }) {
  if (kind === "import") return <ToolFileDropzone accept=".json,.csv,.txt" acceptedFormats="JSON, CSV or text" maxSizeBytes={2 * 1024 * 1024} label="Drop a supported data file here" />;
  if (kind === "export") return <div className="grid gap-2 sm:grid-cols-2">
    {["JSON data", "CSV table", "Markdown report", "PNG image", "SVG graphic", "Plain text"].map(format => <button key={format} type="button" className="border border-[#1a1a1a] bg-black px-3 py-2 text-left text-[10px] text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]">{format}</button>)}
  </div>;
  if (kind === "welcome") return <ol className="grid gap-2 text-[10px] text-zinc-400">
    <li className="border border-[#1a1a1a] p-3"><span className="mr-2 text-[#00ff9c]">01</span>Add or enter source data.</li>
    <li className="border border-[#1a1a1a] p-3"><span className="mr-2 text-[#00ff9c]">02</span>Run the primary local operation.</li>
    <li className="border border-[#1a1a1a] p-3"><span className="mr-2 text-[#00ff9c]">03</span>Review, copy or export the result.</li>
  </ol>;
  if (kind === "new") return <ToolStatus tone="attention">Unsaved local changes need an explicit keep or replace decision.</ToolStatus>;
  return <ToolStatus tone="info">Context, constraints and next actions belong here. Content is supplied by the tool.</ToolStatus>;
}
