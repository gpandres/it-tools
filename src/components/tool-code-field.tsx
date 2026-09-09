"use client";

import * as React from "react";
import { Copy, Download, FileCode2 } from "lucide-react";
import { downloadTextFile, safeDownloadName } from "@/lib/browser-download";
import { useNotification } from "@/components/notification-provider";

export function ToolCodeField({ language, code, filename, mimeType = "text/plain;charset=utf-8", copyable = true, downloadable = true }: {
  language: string;
  code: string;
  filename?: string;
  mimeType?: string;
  copyable?: boolean;
  downloadable?: boolean;
}) {
  const { notify } = useNotification();
  const lines = code.split("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      notify("Code copied to clipboard");
    } catch {
      notify("Could not copy code", "error");
    }
  };

  const download = () => {
    downloadTextFile(code, safeDownloadName(filename ?? `example-${language.toLowerCase()}.txt`, "example.txt"), mimeType);
    notify("Code file generated locally");
  };

  return <div data-slot="tool-code-field" className="min-w-0 border border-[#1a1a1a] bg-black">
    <div className="flex items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
      <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400"><FileCode2 className="h-3.5 w-3.5 text-[#00ff9c]" aria-hidden="true" />{language}</span>
      <div className="flex gap-1">
        {copyable && <button type="button" onClick={copy} className="border border-[#2a2a2a] p-1 text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]" aria-label={`Copy ${language} code`}><Copy className="h-3 w-3" /></button>}
        {downloadable && <button type="button" onClick={download} className="border border-[#2a2a2a] p-1 text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]" aria-label={`Download ${language} code`}><Download className="h-3 w-3" /></button>}
      </div>
    </div>
    <pre role="region" tabIndex={0} aria-label={`${language} code`} className="overflow-x-auto p-3 text-[10px] leading-relaxed text-zinc-300"><code>{lines.map((line, index) => <span key={`${index}-${line}`} className="block"><span className="mr-4 inline-block w-5 select-none text-right text-zinc-400">{index + 1}</span><span className={line.includes("#") || line.includes("//") ? "text-zinc-400" : line.includes("=") || line.includes(":") ? "text-[#9fffd1]" : "text-zinc-300"}>{line || " "}</span></span>)}</code></pre>
  </div>;
}
