"use client";

import { useState, useEffect } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
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

export default function InvestigationWorkspace() {
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
      <ToolLayout title="Investigation Workspace" description="Loading workspace...">
        <div className="flex justify-center items-center h-64 text-[#00ff9c]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Investigation Workspace"
      description="Analyze and organize security indicators, logs, files, and timelines locally."
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col h-[85vh]">
        
        {/* Top Header / Case Selector */}
        <div className="flex flex-wrap gap-4 justify-between items-center bg-[#0a0a0a] p-4 border border-[#1a1a1a] rounded-t-lg">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-zinc-500" />
            <Select value={activeCaseId || ""} onValueChange={(val) => { if (val) selectCase(val); }}>
              <SelectTrigger className="w-[250px] bg-black border-[#333]">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#333]">
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={createNewCase} variant="outline" size="sm" className="bg-black border-[#333]">
              <Plus className="w-4 h-4 mr-2" /> New Case
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 flex items-center mr-2">
              {isSaving ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</> : <><Save className="w-3 h-3 mr-1" /> Saved to IndexedDB</>}
            </span>
            <Button onClick={exportJSON} variant="outline" size="sm" className="bg-black border-[#1a1a1a]">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={exportEvidenceBundle} variant="outline" size="sm" className="bg-black border-[#1a1a1a]">
              <Download className="w-4 h-4 mr-2" /> Bundle
            </Button>
            <Button variant="outline" size="sm" className="bg-black border-[#1a1a1a] relative overflow-hidden">
              <Upload className="w-4 h-4 mr-2" /> Import
              <input 
                type="file" 
                accept=".json"
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
                }} 
              />
            </Button>
            <Button onClick={deleteCurrentCase} variant="outline" size="sm" className={`bg-black border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 ${deletePending ? 'ring-1 ring-red-500' : ''}`} aria-label={deletePending ? "Confirm delete case" : "Delete case"}>
              <Trash2 className="w-4 h-4" />{deletePending && <span className="ml-2 text-xs">Confirm</span>}
            </Button>
          </div>
        </div>

        {/* Case Workspace */}
        {activeCase ? (
          <div className="flex-1 flex flex-col bg-black border-x border-b border-[#1a1a1a] rounded-b-lg overflow-hidden">
            <div className="p-4 border-b border-[#1a1a1a] bg-[#050505]">
              <Input 
                className="text-xl font-bold bg-transparent border-none text-white h-auto py-1 px-0 focus-visible:ring-0 placeholder:text-zinc-700" 
                value={activeCase.title}
                onChange={e => setActiveCase({...activeCase, title: e.target.value})}
                placeholder="Case Title"
              />
              <Input 
                className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs bg-transparent border-none text-zinc-400 h-auto py-1 px-0 mt-1 focus-visible:ring-0 placeholder:text-zinc-700" 
                value={activeCase.description}
                onChange={e => setActiveCase({...activeCase, description: e.target.value})}
                placeholder="Brief description or ticket ID..."
              />
            </div>

            <Tabs defaultValue="iocs" className="flex-1 flex flex-col p-4 overflow-hidden">
              <TabsList className="bg-[#1a1a1a] border-[#333] mb-4 self-start">
                <TabsTrigger value="iocs" className="data-[state=active]:bg-black data-[state=active]:text-[#00ff9c]">Indicators (IOCs)</TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-black data-[state=active]:text-[#00ff9c]">Timeline</TabsTrigger>
                <TabsTrigger value="findings" className="data-[state=active]:bg-black data-[state=active]:text-[#00ff9c]">Findings</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <TabsContent value="iocs" className="mt-0 h-full">
                  <IOCManager 
                    iocs={activeCase.iocs} 
                    onChange={iocs => setActiveCase({...activeCase, iocs})} 
                  />
                </TabsContent>
                <TabsContent value="timeline" className="mt-0 h-full">
                  <TimelineView 
                    events={activeCase.timeline} 
                    onChange={timeline => setActiveCase({...activeCase, timeline})} 
                  />
                </TabsContent>
                <TabsContent value="findings" className="mt-0 h-full">
                  <Findings 
                    findings={activeCase.findings} 
                    onChange={findings => setActiveCase({...activeCase, findings})} 
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-black border-x border-b border-[#1a1a1a] rounded-b-lg">
            <p className="text-zinc-500 mb-4">No cases available.</p>
            <Button onClick={createNewCase} className="bg-[#00ff9c] text-black hover:bg-[#00cc7a]">
              Create First Case
            </Button>
          </div>
        )}

      </div>
    </ToolLayout>
  );
}
