"use client";

import * as React from "react";
import { CloudUpload, File } from "lucide-react";
import { cn } from "cn";
import { ToolActionButton } from "@/components/tool-action-panel";
import { ToolStatus } from "@/components/tool-ui";

export function ToolFileDropzone({
  accept,
  acceptedFormats,
  maxSizeBytes,
  multiple = false,
  localOnly = true,
  label = "Drop files here",
  browseLabel = "Browse files",
  onFiles,
  onReject,
  className,
}: {
  accept?: string;
  acceptedFormats?: React.ReactNode;
  maxSizeBytes?: number;
  multiple?: boolean;
  localOnly?: boolean;
  label?: React.ReactNode;
  browseLabel?: React.ReactNode;
  onFiles?: (files: File[]) => void;
  onReject?: (message: string) => void;
  className?: string;
}) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selected, setSelected] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const receive = (files: File[]) => {
    const next = multiple ? files : files.slice(0, 1);
    const tooLarge = maxSizeBytes ? next.find(file => file.size > maxSizeBytes) : undefined;
    if (tooLarge) {
      const message = `${tooLarge.name} exceeds the ${formatBytes(maxSizeBytes!)} limit.`;
      setError(message);
      setSelected([]);
      onReject?.(message);
      return;
    }
    setError(null);
    setSelected(next);
    onFiles?.(next);
  };

  return <div data-slot="tool-file-dropzone" className={cn("space-y-2", className)}>
    <div
      className={cn("flex min-h-36 flex-col items-center justify-center border border-dashed bg-black p-4 text-center transition-colors", dragActive ? "border-[#00ff9c] bg-[#00ff9c]/5" : "border-[#2a2a2a] hover:border-[#00ff9c]/60")}
      onDragEnter={event => { event.preventDefault(); setDragActive(true); }}
      onDragOver={event => event.preventDefault()}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragActive(false); }}
      onDrop={event => { event.preventDefault(); setDragActive(false); receive(Array.from(event.dataTransfer.files)); }}
    >
      <CloudUpload className="mb-3 h-6 w-6 text-zinc-400" aria-hidden="true" />
      <p className="text-xs text-zinc-300">{label}</p>
      <p className="mt-1 text-[10px] text-zinc-400">
        {acceptedFormats ?? accept ?? "Any supported file"}
        {maxSizeBytes ? ` · max ${formatBytes(maxSizeBytes)}` : ""}
        {localOnly ? " · processed locally" : ""}
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-label={typeof label === "string" ? `Choose files for ${label}` : "Choose files"}
        className="sr-only"
        onChange={event => receive(Array.from(event.target.files ?? []))}
      />
      <ToolActionButton type="button" className="mt-3 rounded-none" onClick={() => inputRef.current?.click()}>{browseLabel}</ToolActionButton>
    </div>
    {error && <ToolStatus tone="error">{error}</ToolStatus>}
    {selected.map(file => <div key={`${file.name}-${file.lastModified}`} className="flex min-w-0 items-center justify-between gap-3 border border-[#1a1a1a] bg-black p-2 text-[10px]">
      <span className="flex min-w-0 items-center gap-2 text-zinc-400"><File className="h-3.5 w-3.5 shrink-0 text-[#00ff9c]" aria-hidden="true" /><span className="truncate" title={file.name}>{file.name}</span></span>
      <span className="shrink-0 text-[#9fffd1]">{formatBytes(file.size)} · Ready</span>
    </div>)}
  </div>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
}
