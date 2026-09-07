"use client";

import { useState, useEffect } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, PenTool, Download, Upload, FileText, DownloadCloud } from "lucide-react";
import Builder from './components/Builder';
import Runner from './components/Runner';
import { TEMPLATES } from './components/Templates';
import { Runbook } from './components/types';

export default function RunbookPage() {
  const [mode, setMode] = useState<'build' | 'run'>('build');
  const [runbook, setRunbook] = useState<Runbook>(TEMPLATES["Network Outage Triage"]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('runbook_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id) {
          setRunbook(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved runbook", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('runbook_draft', JSON.stringify(runbook));
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [runbook]);

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(runbook, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `runbook-${runbook.id}.json`);
    dlAnchorElem.click();
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.id && parsed.steps) {
          setRunbook(parsed);
        } else {
          alert("Invalid runbook JSON format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const exportMarkdown = () => {
    let md = `# ${runbook.title}\n\n${runbook.description}\n\n## Variables\n`;
    runbook.variables.forEach(v => {
      md += `- **${v.name}**: ${v.description} (Default: ${v.defaultValue || 'None'})\n`;
    });
    md += `\n## Steps\n\n`;
    runbook.steps.forEach((s, idx) => {
      md += `### ${idx + 1}. [${s.type.toUpperCase()}] ${s.title} (ID: ${s.id})\n`;
      if (s.description || s.content) md += `${s.description || s.content}\n\n`;
      if (s.command) md += `\`\`\`bash\n${s.command}\n\`\`\`\n\n`;
      if (s.expectedResult) md += `**Expected Result:** ${s.expectedResult}\n\n`;
      if (s.items) {
        s.items.forEach(item => md += `- [ ] ${item}\n`);
        md += `\n`;
      }
      if (s.type === 'decision') {
        md += `**Question:** ${s.decisionQuestion}\n`;
        md += `- **YES** -> Go to Step ${s.decisionTrueNext}\n`;
        md += `- **NO** -> Go to Step ${s.decisionFalseNext}\n\n`;
      }
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `runbook-${runbook.id}.md`);
    dlAnchorElem.click();
  };

  return (
    <ToolLayout
      title="Interactive Runbook Builder"
      description="Build and execute IT operations and troubleshooting runbooks dynamically."
    >
      <div className="w-full max-w-6xl mx-auto space-y-6">
        
        {/* Top Action Bar */}
        <div className="flex justify-between items-center bg-[#0a0a0a] p-4 border border-[#1a1a1a] rounded-lg">
          <div className="flex gap-2">
            <Button 
              onClick={() => setMode('build')} 
              variant={mode === 'build' ? 'default' : 'outline'}
              className={mode === 'build' ? 'bg-white text-black' : 'bg-black border-[#1a1a1a] text-zinc-400 hover:text-white'}
            >
              <PenTool className="w-4 h-4 mr-2" /> Builder Mode
            </Button>
            <Button 
              onClick={() => setMode('run')} 
              variant={mode === 'run' ? 'default' : 'outline'}
              className={mode === 'run' ? 'bg-[#00ff9c] text-black hover:bg-[#00cc7a]' : 'bg-black border-[#1a1a1a] text-[#00ff9c] hover:bg-[#00ff9c]/10 hover:text-[#00ff9c]'}
            >
              <Play className="w-4 h-4 mr-2" /> Execute Runbook
            </Button>
          </div>

          {mode === 'build' && (
            <div className="flex gap-2 items-center">
              <Select value={runbook.title} onValueChange={(v) => {
                const tmpl = Object.values(TEMPLATES).find(t => t.title === v);
                if (tmpl) setRunbook(tmpl);
              }}>
                <SelectTrigger className="w-[200px] bg-black border-[#1a1a1a] h-9 text-xs">
                  <SelectValue placeholder="Load Template" />
                </SelectTrigger>
                <SelectContent className="bg-black border-[#1a1a1a]">
                  {Object.keys(TEMPLATES).map(k => (
                    <SelectItem key={k} value={TEMPLATES[k].title}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="h-4 w-px bg-[#333] mx-2"></div>
              
              <Button onClick={exportJSON} variant="outline" size="sm" className="bg-black border-[#1a1a1a]">
                <Download className="w-4 h-4 mr-2" /> JSON
              </Button>
              <Button variant="outline" size="sm" className="bg-black border-[#1a1a1a] relative overflow-hidden">
                <Upload className="w-4 h-4 mr-2" /> Load
                <input 
                  type="file" 
                  accept=".json"
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
                  }} 
                />
              </Button>
              <Button onClick={exportMarkdown} variant="outline" size="sm" className="bg-black border-[#1a1a1a]">
                <FileText className="w-4 h-4 mr-2" /> Markdown
              </Button>
            </div>
          )}
        </div>

        {/* Content Area */}
        {mode === 'build' ? (
          <Builder runbook={runbook} onChange={setRunbook} />
        ) : (
          <Runner runbook={runbook} onExit={() => setMode('build')} />
        )}

      </div>
    </ToolLayout>
  );
}
