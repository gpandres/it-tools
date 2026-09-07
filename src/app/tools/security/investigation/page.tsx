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

export default function InvestigationWorkspace() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<InvestigationCase | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load all cases on mount
  useEffect(() => {
    loadCases();
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
    if (!confirm("Are you sure you want to delete this case? This cannot be undone.")) return;
    
    await db.deleteCase(activeCaseId);
    setActiveCaseId(null);
    setActiveCase(null);
    loadCases();
  };

  const exportJSON = () => {
    if (!activeCase) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeCase, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `investigation-${activeCase.title.replace(/\s+/g, '-')}.json`);
    dlAnchorElem.click();
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (content.length > 2_000_000) throw new Error("Investigation file is too large");
        const parsed = parseInvestigationCase(JSON.parse(content));
        if (parsed) {
          // Regenerate ID to prevent collisions if imported multiple times
          parsed.id = crypto.randomUUID();
          parsed.createdAt = Date.now();
          parsed.updatedAt = Date.now();
          await db.saveCase(parsed);
          loadCases();
          selectCase(parsed.id);
        } else {
          alert("Invalid case JSON format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
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
            <Button onClick={deleteCurrentCase} variant="outline" size="sm" className="bg-black border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
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
                className="text-sm bg-transparent border-none text-zinc-400 h-auto py-1 px-0 mt-1 focus-visible:ring-0 placeholder:text-zinc-700" 
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
