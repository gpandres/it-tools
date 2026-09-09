"use client";

import { useState, useEffect, useRef } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Download, Upload, Plus, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { InvestigationCase } from './components/types';
import * as db from './db';
import IOCManager from './components/IOCManager';
import TimelineView from './components/TimelineView';
import Findings from './components/Findings';
import { parseInvestigationCase } from '@/lib/investigation-validation';
import { useNotification } from '@/components/notification-provider';
import { downloadTextFile, safeDownloadName } from '@/lib/browser-download';
import { createEvidenceBundle, investigationFromEvidenceBundle, parseEvidenceBundle } from '@/lib/evidence-bundle';
import { ToolPanel, ToolPanelHeader, ToolPanelBody, ToolField, ToolActionButton, ToolEmptyState } from "@/components/tool-design";

export default function InvestigationWorkspace() {
  const importInput = useRef<HTMLInputElement>(null);
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<InvestigationCase | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletePending, setDeletePending] = useState(false);
  const { notify } = useNotification();

  // Load all cases on mount
  useEffect(() => {
    loadCases();
    // This is the one-time IndexedDB bootstrap; the callback is intentionally not recreated for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const allCases = await db.getAllCases();
      setCases(allCases);
      if (allCases.length > 0 && !activeCaseId) {
        selectCase(allCases[0].id);
      } else if (allCases.length === 0) {
        createNewCase();
      }
    } catch (e) {
      console.error("Failed to load cases", e);
    }
    setIsLoading(false);
  };

  const selectCase = async (id: string) => {
    setActiveCaseId(id);
    const loaded = await db.getCase(id);
    if (loaded) setActiveCase(loaded);
  };

  const createNewCase = () => {
    const newCase: InvestigationCase = {
      id: crypto.randomUUID(),
      title: "New Investigation " + new Date().toISOString().slice(0, 10),
      description: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      iocs: [],
      timeline: [],
      findings: ""
    };
    setActiveCase(newCase);
    setActiveCaseId(newCase.id);
    saveCaseData(newCase);
  };

  const saveCaseData = async (data: InvestigationCase) => {
    setIsSaving(true);
    try {
      await db.saveCase(data);
      const allCases = await db.getAllCases();
      setCases(allCases);
    } catch (e) {
      console.error("Failed to save case", e);
      notify("Could not save this investigation locally.", "error");
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  // Debounced save for activeCase changes
  useEffect(() => {
    if (!activeCase) return;
    const timer = setTimeout(() => {
      saveCaseData(activeCase);
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeCase]);

  const deleteCurrentCase = async () => {
    if (!activeCaseId) return;
    if (!deletePending) {
      setDeletePending(true);
      notify("Click delete again within 4 seconds to remove this case.", "error");
      window.setTimeout(() => setDeletePending(false), 4000);
      return;
    }
    
    try {
      await db.deleteCase(activeCaseId);
      setDeletePending(false);
      setActiveCaseId(null);
      setActiveCase(null);
      loadCases();
    } catch {
      notify("Could not delete the investigation.", "error");
    }
  };

  const exportJSON = () => {
    if (!activeCase) return;
    const safeTitle = safeDownloadName(activeCase.title, 'case');
    downloadTextFile(JSON.stringify(activeCase, null, 2), `investigation-${safeTitle}.json`, "application/json;charset=utf-8");
    notify("Investigation exported as JSON.");
  };

  const exportEvidenceBundle = () => {
    if (!activeCase) return;
    const bundle = createEvidenceBundle({
      source: "investigation",
      title: activeCase.title,
      description: activeCase.description,
      iocs: activeCase.iocs.map(({ type, value, tag, notes }) => ({ type, value, tag, ...(notes ? { notes } : {}) })),
      timeline: activeCase.timeline.map(({ timestamp, description, source }) => ({ timestamp, description, ...(source ? { source } : {}) })),
      findings: activeCase.findings
    });
    downloadTextFile(JSON.stringify(bundle, null, 2), `investigation-${safeDownloadName(activeCase.title, 'case')}.evidence.json`, "application/json;charset=utf-8");
    notify("Evidence bundle exported.");
  };

  const importJSON = (file: File) => {
    if (file.size > 2_000_000) {
      notify("Investigation JSON is too large (maximum 2 MB).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (content.length > 2_000_000) throw new Error("Investigation file is too large");
        const source = JSON.parse(content) as unknown;
        const parsed = parseInvestigationCase(source);
        if (parsed) {
          // Regenerate ID to prevent collisions if imported multiple times
          parsed.id = crypto.randomUUID();
          parsed.createdAt = Date.now();
          parsed.updatedAt = Date.now();
          await db.saveCase(parsed);
          await loadCases();
          await selectCase(parsed.id);
        } else {
          const bundle = parseEvidenceBundle(source);
          if (!bundle) {
            notify("Invalid investigation or evidence bundle format.", "error");
            return;
          }
          const imported = investigationFromEvidenceBundle(bundle, crypto.randomUUID());
          await db.saveCase(imported);
          await loadCases();
          await selectCase(imported.id);
          notify(`Evidence imported from ${bundle.source}.`);
        }
      } catch {
        notify("Could not parse the investigation JSON file.", "error");
      }
    };
    reader.onerror = () => notify("Could not read the investigation file.", "error");
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <ToolLayout title="INVESTIGATION WORKSPACE" description="Loading workspace...">
        <div className="flex h-64 items-center justify-center text-[#00ff9c]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="INVESTIGATION WORKSPACE"
      description="Analyze and organize security indicators, logs, files, and timelines locally."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        
        {/* Case Workspace */}
        {activeCase ? (
          <ToolPanel>
            <ToolPanelHeader className="flex flex-col gap-4">
              <div className="flex w-full flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-3">
                  <FolderOpen className="h-4 w-4 shrink-0 text-[#ffb000]" />
                  <Select value={activeCaseId || ""} onValueChange={(val) => { if (val) selectCase(val); }}>
                    <SelectTrigger className="w-[300px] rounded-none border-[#1a1a1a] bg-black font-mono focus:ring-[#00ff9c]">
                      <SelectValue placeholder="Select a case..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-[#1a1a1a] bg-black">
                      {cases.map(c => (
                        <SelectItem key={c.id} value={c.id} className="font-mono text-sm focus:bg-[#1a1a1a]">
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ToolActionButton onClick={createNewCase} tone="neutral">
                    <Plus className="mr-2 h-4 w-4" /> New Case
                  </ToolActionButton>
                </div>
              </div>

              <div className="grid w-full gap-4 sm:grid-cols-2">
                <ToolField htmlFor="case-title" label="CASE TITLE">
                  <Input 
                    id="case-title"
                    className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                    value={activeCase.title}
                    onChange={e => setActiveCase({...activeCase, title: e.target.value})}
                    placeholder="Enter case title"
                  />
                </ToolField>
                <ToolField htmlFor="case-desc" label="DESCRIPTION" helper="Brief description or ticket ID">
                  <Input 
                    id="case-desc"
                    className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                    value={activeCase.description}
                    onChange={e => setActiveCase({...activeCase, description: e.target.value})}
                    placeholder="E.g. INC-12345"
                  />
                </ToolField>
              </div>
            </ToolPanelHeader>

            <Tabs defaultValue="iocs" className="flex flex-col overflow-hidden">
              <TabsList className="h-10 w-full justify-start rounded-none border-b border-[#1a1a1a] bg-[#0a0a0a] p-0 px-4">
                <TabsTrigger value="iocs" className="h-full rounded-none border-b-2 border-transparent px-4 font-mono text-xs uppercase tracking-widest data-active:border-[#00ff9c] data-active:bg-transparent data-active:text-[#00ff9c]">Indicators (IOCs)</TabsTrigger>
                <TabsTrigger value="timeline" className="h-full rounded-none border-b-2 border-transparent px-4 font-mono text-xs uppercase tracking-widest data-active:border-[#00ff9c] data-active:bg-transparent data-active:text-[#00ff9c]">Timeline</TabsTrigger>
                <TabsTrigger value="findings" className="h-full rounded-none border-b-2 border-transparent px-4 font-mono text-xs uppercase tracking-widest data-active:border-[#00ff9c] data-active:bg-transparent data-active:text-[#00ff9c]">Findings</TabsTrigger>
              </TabsList>

              <div className="flex min-h-[50vh] flex-col p-4">
                <TabsContent value="iocs" className="m-0 flex-1 outline-none data-active:flex data-active:flex-col">
                  <IOCManager 
                    iocs={activeCase.iocs} 
                    onChange={iocs => setActiveCase({...activeCase, iocs})} 
                  />
                </TabsContent>
                <TabsContent value="timeline" className="m-0 flex-1 outline-none data-active:flex data-active:flex-col">
                  <TimelineView 
                    events={activeCase.timeline} 
                    onChange={timeline => setActiveCase({...activeCase, timeline})} 
                  />
                </TabsContent>
                <TabsContent value="findings" className="m-0 flex-1 outline-none data-active:flex data-active:flex-col">
                  <Findings 
                    findings={activeCase.findings} 
                    onChange={findings => setActiveCase({...activeCase, findings})} 
                  />
                </TabsContent>
              </div>
            </Tabs>

            {/* Export / Import Footer Controls */}
            <div className="flex flex-wrap items-center justify-between border-t border-[#1a1a1a] bg-[#050505] p-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="mr-2 flex items-center font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  {isSaving ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving...</> : <><Save className="mr-1 h-3 w-3" /> IndexedDB</>}
                </span>
                <ToolActionButton onClick={exportJSON} tone="neutral">
                  <Download className="mr-2 h-4 w-4" /> Export
                </ToolActionButton>
                <ToolActionButton onClick={exportEvidenceBundle} tone="neutral">
                  <Download className="mr-2 h-4 w-4" /> Bundle
                </ToolActionButton>
                <ToolActionButton tone="neutral" onClick={() => importInput.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Import
                </ToolActionButton>
                <input
                  ref={importInput}
                  aria-label="Import investigation JSON"
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <ToolActionButton onClick={deleteCurrentCase} tone="danger" aria-label={deletePending ? "Confirm delete case" : "Delete case"}>
                <Trash2 className="mr-2 h-4 w-4" />{deletePending ? <span className="uppercase tracking-widest">Confirm</span> : "Delete"}
              </ToolActionButton>
            </div>
          </ToolPanel>
        ) : (
          <ToolEmptyState 
            icon={FolderOpen} 
            title="No cases available" 
            actions={
              <ToolActionButton onClick={createNewCase} tone="accent">
                <Plus className="mr-2 h-4 w-4" /> Create First Case
              </ToolActionButton>
            }
          >
            Create a new investigation case to start analyzing indicators and timelines.
          </ToolEmptyState>
        )}

      </div>
    </ToolLayout>
  );
}
