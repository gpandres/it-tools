"use client";

import { useCallback, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { ToolActionButton } from '@/components/tool-action-panel';
import { PdfMakeScripts } from '@/components/pdfmake-scripts';
import { useNotification } from '@/components/notification-provider';
import { captureRunbookDiagram } from '@/lib/runbook-diagram-export';
import { downloadRunbookPdf } from '@/lib/runbook-pdf';
import DiagramBuilder from './DiagramBuilder';
import type { Runbook } from './types';

const ignoreDiagramChanges = () => {};

export default function RunbookPdfExport({ runbook }: { runbook: Runbook }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingRunbook, setPendingRunbook] = useState<Runbook | null>(null);
  const captureStarted = useRef(false);
  const { notify } = useNotification();

  const onDiagramReady = useCallback(async (root: HTMLElement, nodes: Node[]) => {
    if (!pendingRunbook || captureStarted.current) return;
    captureStarted.current = true;
    try {
      const diagram = await captureRunbookDiagram(root, nodes, 'png', 'white');
      downloadRunbookPdf(pendingRunbook, diagram);
    } catch (error) {
      console.error('Failed to export runbook PDF', error);
      notify('PDF export failed. Please try again.', 'error');
    } finally {
      setPendingRunbook(null);
    }
  }, [pendingRunbook, notify]);

  const exportPdf = (includeDiagram: boolean) => {
    if (pendingRunbook) return;
    setIsMenuOpen(false);
    if (includeDiagram) {
      // Freeze the procedure for this export, independently of the active editor view.
      captureStarted.current = false;
      setPendingRunbook(runbook);
    } else {
      try {
        downloadRunbookPdf(runbook);
      } catch (error) {
        console.error('Failed to export runbook PDF', error);
        notify('PDF export failed. Please try again.', 'error');
      }
    }
  };

  return (
    <>
      <PdfMakeScripts />
      <div className="relative">
        <ToolActionButton onClick={() => setIsMenuOpen(current => !current)} variant="outline" disabled={!!pendingRunbook} aria-expanded={isMenuOpen} className="text-[#ffb000] hover:border-[#ffb000] hover:text-[#ffb000]">
          <FileText className="mr-2 h-4 w-4" /> {pendingRunbook ? 'Exporting...' : 'PDF'}
        </ToolActionButton>
        {isMenuOpen && <div className="absolute bottom-full right-0 z-50 mb-2 w-48 border border-[#242424] bg-[#080808] p-1 shadow-xl">
          <button type="button" onClick={() => exportPdf(false)} className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-[#151515] hover:text-white">List only</button>
          <button type="button" onClick={() => exportPdf(true)} className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-[#151515] hover:text-white">List + diagram</button>
        </div>}
      </div>
      {pendingRunbook && (
        <div className="fixed -left-[10000px] top-0 h-[800px] w-[1200px] overflow-hidden" aria-hidden="true" inert>
          <DiagramBuilder runbook={pendingRunbook} onChange={ignoreDiagramChanges} onExportReady={onDiagramReady} />
        </div>
      )}
    </>
  );
}
