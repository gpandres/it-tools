import { Button, buttonVariants } from '@/components/ui/button';
import { Download, FileJson, Upload } from 'lucide-react';

export function DiagramGuide() {
  return (
    <section className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-4" aria-labelledby="diagram-guide-heading">
      <h2 id="diagram-guide-heading" className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quick guide</h2>
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
    <section className="mt-6 rounded-lg border border-[#1a1a1a] bg-[#080808] p-4" aria-labelledby="diagram-export-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="diagram-export-heading" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Export &amp; documentation</h2>
          <p className="mt-1 text-[10px] text-zinc-600">Export the complete topology, inventory, or a shareable technical report.</p>
        </div>
        <span className="font-mono text-[9px] text-zinc-700">local-only</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Button onClick={() => exportImage('black')} variant="outline" size="sm" className="bg-black text-[10px]"><Download className="mr-1 h-3 w-3" />PNG dark</Button>
        <Button onClick={() => exportImage('white')} variant="outline" size="sm" className="bg-black text-[10px]"><Download className="mr-1 h-3 w-3" />PNG light</Button>
        <Button onClick={() => exportImage('transparent')} variant="outline" size="sm" className="bg-black text-[10px]"><Download className="mr-1 h-3 w-3" />PNG alpha</Button>
        <Button onClick={exportSvg} variant="outline" size="sm" className="bg-black text-[10px] text-[#38bdf8]"><Download className="mr-1 h-3 w-3" />SVG</Button>
        <Button onClick={exportInventory} variant="outline" size="sm" className="bg-black text-[10px] text-amber-300"><FileJson className="mr-1 h-3 w-3" />CSV inventory</Button>
        <Button onClick={exportDiagram} variant="outline" size="sm" className="bg-black text-[10px] text-purple-300"><FileJson className="mr-1 h-3 w-3" />JSON</Button>
        <Button onClick={exportMarkdown} variant="outline" size="sm" className="bg-black text-[10px] text-[#00ff9c]"><Download className="mr-1 h-3 w-3" />Markdown report</Button>
        <label htmlFor="network-diagram-json" className={`${buttonVariants({ variant: 'outline', size: 'sm' })} cursor-pointer bg-black text-[10px]`}><Upload className="mr-1 h-3 w-3" />Load JSON<input id="network-diagram-json" type="file" accept=".json" aria-label="Choose diagram JSON file" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) importDiagram(file); event.currentTarget.value = ''; }} /></label>
      </div>
    </section>
  );
}
