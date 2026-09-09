"use client";

import { useState } from "react";
import { CloudUpload, Download, FilePlus2, Info, Upload, X } from "lucide-react";
import { ToolActionButton } from "@/components/tool-action-panel";

type ModalKind = "info" | "new" | "welcome" | "import" | "export";

const modalCopy: Record<ModalKind, { title: string; body: string }> = {
  info: { title: "Diagram information", body: "Explain the selected object or workflow without moving the user away from the canvas." },
  new: { title: "New diagram", body: "Confirm whether to start empty, use a starter topology or keep the current local snapshot." },
  welcome: { title: "Welcome to diagram mode", body: "Show this only on first use. Explain add, connect, validate and export in four short steps." },
  import: { title: "Import diagram", body: "Accept JSON locally, show the size limit and validate before replacing the current canvas." },
  export: { title: "Export diagram", body: "Let the user choose image background, SVG, JSON, inventory or Markdown before generating a file." },
};

export function FileExchangeDemo() {
  const [modal, setModal] = useState<ModalKind | null>("import");
  const copy = modal ? modalCopy[modal] : null;

  return <div className="space-y-3"><div className="flex flex-wrap gap-2"><ToolActionButton className="rounded-none" onClick={() => setModal("info")}><Info />Info</ToolActionButton><ToolActionButton className="rounded-none" onClick={() => setModal("new")}><FilePlus2 />New file</ToolActionButton><ToolActionButton className="rounded-none" onClick={() => setModal("welcome")}>Welcome</ToolActionButton><ToolActionButton className="rounded-none" onClick={() => setModal("import")}><Upload />Import</ToolActionButton><ToolActionButton className="rounded-none" onClick={() => setModal("export")}><Download />Export</ToolActionButton></div>
    <div className="relative min-h-[30rem] overflow-hidden border border-[#1a1a1a] bg-black"><div className="absolute inset-0 bg-black/75" /><div className="absolute inset-0 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-labelledby="design-modal-title" className="max-h-full w-[min(34rem,100%)] overflow-y-auto border border-[#2a2a2a] bg-[#080808] shadow-2xl"><header className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3"><h4 id="design-modal-title" className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">{copy?.title || "Modal"}</h4><button type="button" aria-label="Close modal" onClick={() => setModal(null)} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button></header><div className="space-y-4 p-4"><p className="text-[10px] leading-relaxed text-zinc-500">{copy?.body}</p>{modal === "import" && <div className="border border-dashed border-[#176b52] bg-[#176b52]/5 p-6 text-center"><CloudUpload className="mx-auto mb-2 h-6 w-6 text-[#00ff9c]" /><p className="text-xs text-zinc-300">Drop JSON here or browse</p><p className="mt-1 text-[10px] text-zinc-600">Max 2 MB · local only · current canvas remains unchanged until validation</p></div>}{modal === "export" && <div className="grid gap-2 sm:grid-cols-2">{["PNG dark", "PNG light", "PNG alpha", "SVG", "JSON", "Markdown"].map(format => <button key={format} type="button" className="border border-[#1a1a1a] bg-black px-3 py-2 text-left text-[10px] text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]">{format}</button>)}</div>}{modal === "welcome" && <div className="grid gap-2 text-[10px] text-zinc-400"><div className="border border-[#1a1a1a] p-3"><span className="text-[#00ff9c]">01</span> Add a device from the palette.</div><div className="border border-[#1a1a1a] p-3"><span className="text-[#00ff9c]">02</span> Connect visible handles.</div><div className="border border-[#1a1a1a] p-3"><span className="text-[#00ff9c]">03</span> Review validation before export.</div></div>}{modal === "new" && <div className="flex flex-wrap gap-2"><button type="button" className="border border-[#00ff9c]/40 px-3 py-2 text-[10px] text-[#00ff9c]">Start empty</button><button type="button" className="border border-[#1a1a1a] px-3 py-2 text-[10px] text-zinc-400">Use starter</button></div>}<div className="flex justify-end gap-2 border-t border-[#1a1a1a] pt-3"><button type="button" onClick={() => setModal(null)} className="border border-[#2a2a2a] px-3 py-1.5 text-[10px] text-zinc-400">Close</button><button type="button" className="border border-[#00ff9c]/40 bg-[#00ff9c]/10 px-3 py-1.5 text-[10px] text-[#00ff9c]">{modal === "export" ? "Generate" : modal === "import" ? "Validate" : "Done"}</button></div></div></div></div></div>
  </div>;
}
