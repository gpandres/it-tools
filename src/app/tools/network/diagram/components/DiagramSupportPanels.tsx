import { useState } from 'react';
import { ToolActionButton, ToolActionPanel, ToolFileDropzone, ToolStatus } from '@/components/tool-design';
import { Download, FileJson, FolderOpen, Save, Trash2, Upload } from 'lucide-react';
import type { SavedNetworkDiagram } from '@/lib/network-diagram-workspace';

export function DiagramGuide({ headingId = 'diagram-guide-heading' }: { headingId?: string }) {
  return (
    <section className="rounded-none border border-[#1a1a1a] bg-[#080808] p-4" aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quick guide</h2>
      <div className="space-y-3 font-mono text-[10px] leading-relaxed text-zinc-500">
        <p><span className="text-[#00ff9c]">01</span> Add a device from the palette or drag it onto the canvas.</p>
        <p><span className="text-[#00ff9c]">02</span> Connect source to target handles to create a link.</p>
        <p><span className="text-[#00ff9c]">03</span> Select an item to edit its properties here.</p>
        <p><span className="text-[#00ff9c]">04</span> Run validation before exporting the topology.</p>
        <div className="space-y-1 border-t border-[#1a1a1a] pt-3 text-zinc-600">
          <p className="flex items-center gap-1.5"><kbd className="shrink-0 rounded-none border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Shift</kbd> snap while dragging · multi-select</p>
          <p className="flex items-center gap-1.5"><kbd className="shrink-0 rounded-none border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Ctrl/Cmd + A</kbd> select all</p>
          <p className="flex items-center gap-1.5"><kbd className="shrink-0 rounded-none border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Ctrl/Cmd + C / V</kbd> copy / paste</p>
          <p className="flex items-center gap-1.5"><kbd className="shrink-0 rounded-none border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Ctrl/Cmd + X</kbd> cut selection</p>
          <p className="flex items-center gap-1.5"><kbd className="shrink-0 rounded-none border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Delete</kbd> remove selection</p>
          <p className="flex items-center gap-1.5"><kbd className="shrink-0 rounded-none border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Ctrl/Cmd + Z</kbd> undo</p>
          <p className="flex items-center gap-1.5"><kbd className="shrink-0 rounded-none border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Esc</kbd> exit focus mode</p>
        </div>
      </div>
    </section>
  );
}

type DiagramExportPanelProps = {
  exportImage: (bgColor: 'black' | 'white' | 'transparent') => void;
  exportSvg: () => void;
  exportInventory: () => void;
  exportDiagram: () => void;
  exportMarkdown: () => void;
};

export function DiagramExportPanel({ exportImage, exportSvg, exportInventory, exportDiagram, exportMarkdown }: DiagramExportPanelProps) {
  return (
    <section className="mt-4 rounded-none border border-[#1a1a1a] bg-[#080808] p-3 sm:p-4" aria-labelledby="diagram-export-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="diagram-export-heading" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Export</h2>
          <p className="mt-1 text-[10px] text-zinc-600">Create a file from the current topology.</p>
        </div>
        <span className="font-mono text-[9px] text-zinc-700">local-only</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ExportGroup title="Image">
          <ToolActionButton onClick={() => exportImage('black')} variant="outline" size="sm" className="bg-black text-[10px]">PNG dark</ToolActionButton>
          <ToolActionButton onClick={() => exportImage('white')} variant="outline" size="sm" className="bg-black text-[10px]">PNG light</ToolActionButton>
          <ToolActionButton onClick={() => exportImage('transparent')} variant="outline" size="sm" className="bg-black text-[10px]">PNG alpha</ToolActionButton>
          <ToolActionButton onClick={exportSvg} variant="outline" size="sm" className="bg-black text-[10px]">SVG</ToolActionButton>
        </ExportGroup>
        <ExportGroup title="Data">
          <ToolActionButton onClick={exportInventory} variant="outline" size="sm" className="bg-black text-[10px]"><FileJson className="mr-1 h-3 w-3" />CSV inventory</ToolActionButton>
          <ToolActionButton onClick={exportDiagram} variant="outline" size="sm" className="bg-black text-[10px]"><FileJson className="mr-1 h-3 w-3" />JSON</ToolActionButton>
        </ExportGroup>
        <ExportGroup title="Report">
          <ToolActionButton onClick={exportMarkdown} variant="outline" size="sm" className="bg-black text-[10px] text-[#00ff9c]"><Download className="mr-1 h-3 w-3" />Markdown</ToolActionButton>
        </ExportGroup>
      </div>
    </section>
  );
}

function ExportGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-none border border-[#1a1a1a] bg-black/40 p-2.5"><h3 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-600">{title}</h3><div className="flex flex-wrap gap-1.5">{children}</div></div>;
}

type DiagramWorkspacePanelProps = {
  diagrams: SavedNetworkDiagram[];
  onSave: () => void;
  onLoad: (diagram: SavedNetworkDiagram) => void;
  onDelete: (id: string) => void;
  importDiagram: (file: File) => Promise<string | null>;
};

export function DiagramWorkspacePanel({ diagrams, onSave, onLoad, onDelete, importDiagram }: DiagramWorkspacePanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!file || busy) return;
    setBusy(true);
    try { setError(await importDiagram(file)); }
    catch { setError('Could not import this file. Try again.'); }
    finally { setBusy(false); }
  };
  return (
    <section className="border border-[#1a1a1a] bg-[#080808] p-3 sm:p-4" aria-labelledby="diagram-library-heading">
      <div className="flex items-center gap-2 border-b border-[#1a1a1a] pb-3"><FolderOpen className="h-3.5 w-3.5 text-[#00ff9c]" /><h2 id="diagram-library-heading" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Saved diagrams</h2><span className="ml-auto text-[9px] text-zinc-600">{diagrams.length}/10 snapshots</span></div>
      <div className="pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">Keep local snapshots for different sites, environments, or change reviews.</p>
          <ToolActionButton type="button" onClick={onSave} tone="accent" size="sm" className="bg-black text-[10px] text-[#00ff9c] touch-manipulation"><Save className="mr-1 h-3 w-3" />Save snapshot</ToolActionButton>
        </div>
        <div className="mb-4 space-y-3">
          <ToolFileDropzone accept=".json,application/json" acceptedFormats="Diagram JSON" maxSizeBytes={2 * 1024 * 1024} label="Drop a diagram JSON file here" onFiles={files => { setFile(files[0] ?? null); setError(null); }} onReject={message => { setFile(null); setError(message); }} />
          <p className="text-[10px] text-zinc-400">Import replaces the current canvas after validation. Undo restores the previous topology.</p>
          {error && <ToolStatus tone="error">{error}</ToolStatus>}
          <ToolActionPanel label="IMPORT"><ToolActionButton tone="accent" disabled={!file || busy} onClick={submit}><Upload className="h-3.5 w-3.5" />{busy ? 'Reading…' : 'Import diagram'}</ToolActionButton></ToolActionPanel>
        </div>
        {diagrams.length === 0 ? <p className="rounded-none border border-dashed border-[#1a1a1a] px-3 py-4 text-center font-mono text-[10px] text-zinc-600">No saved snapshots yet.</p> : <div className="grid gap-2 md:grid-cols-2">
          {diagrams.map(diagram => <article key={diagram.id} className="flex min-w-0 items-center justify-between gap-3 rounded-none border border-[#1a1a1a] bg-black p-3">
            <div className="min-w-0">
              <h3 className="truncate font-mono text-[11px] font-bold text-[#00ff9c]">{diagram.title}</h3>
              <p className="truncate text-[10px] text-zinc-600">{diagram.description || 'No description'} · {diagram.nodes.length} nodes · {diagram.edges.length} links</p>
              <p className="mt-1 font-mono text-[9px] text-zinc-700">{formatSnapshotDate(diagram.updatedAt)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <ToolActionButton type="button" onClick={() => onLoad(diagram)} variant="outline" size="sm" className="bg-black px-2 text-[10px] touch-manipulation" title={`Load ${diagram.title}`}><FolderOpen className="h-3 w-3" /><span className="sr-only">Load</span></ToolActionButton>
              <ToolActionButton type="button" onClick={() => onDelete(diagram.id)} tone="danger" size="sm" className="bg-black px-2 text-[10px] text-red-300 touch-manipulation" title={`Delete ${diagram.title}`}><Trash2 className="h-3 w-3" /><span className="sr-only">Delete</span></ToolActionButton>
            </div>
          </article>)}
        </div>}
      </div>
    </section>
  );
}

function formatSnapshotDate(timestamp: number) {
  return timestamp > 0 ? new Date(timestamp).toISOString().slice(0, 10) : 'unknown date';
}
