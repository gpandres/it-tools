import { Button, buttonVariants } from '@/components/ui/button';
import { Download, FileJson, FolderOpen, Save, Trash2, Upload } from 'lucide-react';
import type { SavedNetworkDiagram } from '@/lib/network-diagram-workspace';

export function DiagramGuide({ headingId = 'diagram-guide-heading' }: { headingId?: string }) {
  return (
    <section className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-4" aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quick guide</h2>
      <div className="space-y-3 font-mono text-[10px] leading-relaxed text-zinc-500">
        <p><span className="text-[#00ff9c]">01</span> Add a device from the palette or drag it onto the canvas.</p>
        <p><span className="text-[#00ff9c]">02</span> Connect source to target handles to create a link.</p>
        <p><span className="text-[#00ff9c]">03</span> Select an item to edit its properties here.</p>
        <p><span className="text-[#00ff9c]">04</span> Run validation before exporting the topology.</p>
        <div className="border-t border-[#1a1a1a] pt-3 text-zinc-600">
          <p><kbd className="rounded border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Shift</kbd> multi-select</p>
          <p><kbd className="rounded border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Delete</kbd> remove selection</p>
          <p><kbd className="rounded border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Ctrl/Cmd + Z</kbd> undo</p>
          <p><kbd className="rounded border border-[#2a2a2a] bg-black px-1 py-0.5 text-zinc-300">Esc</kbd> exit focus mode</p>
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
  importDiagram: (file: File) => void;
};

export function DiagramExportPanel({ exportImage, exportSvg, exportInventory, exportDiagram, exportMarkdown, importDiagram }: DiagramExportPanelProps) {
  return (
    <section className="mt-4 rounded-lg border border-[#1a1a1a] bg-[#080808] p-3 sm:p-4" aria-labelledby="diagram-export-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="diagram-export-heading" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Export &amp; documentation</h2>
          <p className="mt-1 text-[10px] text-zinc-600">Create a file from the complete topology without leaving the browser.</p>
        </div>
        <span className="font-mono text-[9px] text-zinc-700">local-only</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ExportGroup title="Image">
          <Button onClick={() => exportImage('black')} variant="outline" size="sm" className="bg-black text-[10px]">PNG dark</Button>
          <Button onClick={() => exportImage('white')} variant="outline" size="sm" className="bg-black text-[10px]">PNG light</Button>
          <Button onClick={() => exportImage('transparent')} variant="outline" size="sm" className="bg-black text-[10px]">PNG alpha</Button>
          <Button onClick={exportSvg} variant="outline" size="sm" className="bg-black text-[10px] text-[#38bdf8]">SVG</Button>
        </ExportGroup>
        <ExportGroup title="Data">
          <Button onClick={exportInventory} variant="outline" size="sm" className="bg-black text-[10px] text-amber-300"><FileJson className="mr-1 h-3 w-3" />CSV inventory</Button>
          <Button onClick={exportDiagram} variant="outline" size="sm" className="bg-black text-[10px] text-purple-300"><FileJson className="mr-1 h-3 w-3" />JSON</Button>
        </ExportGroup>
        <ExportGroup title="Report">
          <Button onClick={exportMarkdown} variant="outline" size="sm" className="bg-black text-[10px] text-[#00ff9c]"><Download className="mr-1 h-3 w-3" />Markdown</Button>
        </ExportGroup>
        <ExportGroup title="Import">
          <label htmlFor="network-diagram-json" className={`${buttonVariants({ variant: 'outline', size: 'sm' })} cursor-pointer bg-black text-[10px]`}><Upload className="mr-1 h-3 w-3" />Load JSON<input id="network-diagram-json" type="file" accept=".json" aria-label="Choose diagram JSON file" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) importDiagram(file); event.currentTarget.value = ''; }} /></label>
        </ExportGroup>
      </div>
    </section>
  );
}

function ExportGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded border border-[#1a1a1a] bg-black/40 p-2.5"><h3 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-600">{title}</h3><div className="flex flex-wrap gap-1.5">{children}</div></div>;
}

type DiagramWorkspacePanelProps = {
  diagrams: SavedNetworkDiagram[];
  onSave: () => void;
  onLoad: (diagram: SavedNetworkDiagram) => void;
  onDelete: (id: string) => void;
};

export function DiagramWorkspacePanel({ diagrams, onSave, onLoad, onDelete }: DiagramWorkspacePanelProps) {
  return (
    <details className="mt-4 rounded-lg border border-[#1a1a1a] bg-[#080808] p-3 sm:p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400"><FolderOpen className="h-3.5 w-3.5 text-[#00ff9c]" />Saved diagrams<span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-zinc-700">{diagrams.length}/10 snapshots</span></summary>
      <div className="pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">Keep local snapshots for different sites, environments, or change reviews.</p>
          <Button type="button" onClick={onSave} variant="outline" size="sm" className="bg-black text-[10px] text-[#00ff9c] touch-manipulation"><Save className="mr-1 h-3 w-3" />Save snapshot</Button>
        </div>
        {diagrams.length === 0 ? <p className="rounded border border-dashed border-[#1a1a1a] px-3 py-4 text-center font-mono text-[10px] text-zinc-600">No saved snapshots yet.</p> : <div className="grid gap-2 md:grid-cols-2">
          {diagrams.map(diagram => <article key={diagram.id} className="flex min-w-0 items-center justify-between gap-3 rounded border border-[#1a1a1a] bg-black p-3">
            <div className="min-w-0">
              <h3 className="truncate font-mono text-[11px] font-bold text-[#00ff9c]">{diagram.title}</h3>
              <p className="truncate text-[10px] text-zinc-600">{diagram.description || 'No description'} · {diagram.nodes.length} nodes · {diagram.edges.length} links</p>
              <p className="mt-1 font-mono text-[9px] text-zinc-700">{formatSnapshotDate(diagram.updatedAt)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button type="button" onClick={() => onLoad(diagram)} variant="outline" size="sm" className="bg-black px-2 text-[10px] touch-manipulation" title={`Load ${diagram.title}`}><FolderOpen className="h-3 w-3" /><span className="sr-only">Load</span></Button>
              <Button type="button" onClick={() => onDelete(diagram.id)} variant="outline" size="sm" className="bg-black px-2 text-[10px] text-red-300 touch-manipulation" title={`Delete ${diagram.title}`}><Trash2 className="h-3 w-3" /><span className="sr-only">Delete</span></Button>
            </div>
          </article>)}
        </div>}
      </div>
    </details>
  );
}

function formatSnapshotDate(timestamp: number) {
  return timestamp > 0 ? new Date(timestamp).toISOString().slice(0, 10) : 'unknown date';
}
