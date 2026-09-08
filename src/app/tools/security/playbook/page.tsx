"use client";

import { useState, useEffect } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, PenTool, Download, Upload, FileText } from "lucide-react";
import Builder from '@/app/tools/sysadmin/runbook/components/Builder';
import Runner from '@/app/tools/sysadmin/runbook/components/Runner';
import DiagramBuilder from '@/app/tools/sysadmin/runbook/components/DiagramBuilder';
import { Runbook } from '@/app/tools/sysadmin/runbook/components/types';
import LZString from 'lz-string';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { parseRunbook } from '@/lib/runbook-validation';
import RunbookPdfExport from '@/app/tools/sysadmin/runbook/components/RunbookPdfExport';
import { ToolActionButton, ToolActionPanel } from '@/components/tool-action-panel';
import { useNotification } from '@/components/notification-provider';

const PLAYBOOK_TEMPLATES: Record<string, Runbook> = {
  "Empty Playbook": {
    id: "empty-01",
    title: "New Playbook",
    description: "Start building your incident response procedure.",
    variables: [],
    steps: []
  },
  "Ransomware Containment": {
    id: "pb-rw-01",
    title: "Ransomware Containment Playbook",
    description: "Initial response steps for suspected ransomware activity.",
    variables: [
      { name: "HOST_IP", description: "IP of the infected machine", defaultValue: "10.0.0.50" },
      { name: "INCIDENT_ID", description: "Ticket or case ID", defaultValue: "INC-2026-991" }
    ],
    steps: [
      {
        id: "step-1",
        type: "information",
        title: "Triage & Validation",
        content: "Confirm the ransomware report. Look for signs: file extension changes, ransom notes (e.g. README.txt), high CPU/Disk I/O.",
        uiPosition: { x: 250, y: 50 }
      },
      {
        id: "step-2",
        type: "decision",
        title: "Is Ransomware Confirmed?",
        decisionQuestion: "Are there clear indicators of active encryption?",
        decisionTrueNext: "step-3",
        decisionFalseNext: "step-4",
        uiPosition: { x: 250, y: 250 }
      },
      {
        id: "step-3",
        type: "command",
        title: "Isolate Host (EDR)",
        description: "Use EDR or network switch to isolate the host immediately. DO NOT power off.",
        command: "Invoke-EDRIsolation -Target {{HOST_IP}} -Reason {{INCIDENT_ID}}",
        uiPosition: { x: 50, y: 450 }
      },
      {
        id: "step-4",
        type: "verification",
        title: "Continue Monitoring",
        content: "False alarm. Continue monitoring the endpoint for suspicious activity.",
        uiPosition: { x: 450, y: 450 }
      }
    ]
  },
  "Phishing Investigation": {
    id: "pb-phish-01",
    title: "Phishing Investigation Playbook",
    description: "Steps to analyze and remediate a reported phishing email.",
    variables: [
      { name: "SENDER_IP", description: "Source IP of the email", defaultValue: "1.1.1.1" },
      { name: "TARGET_USER", description: "Email address of the victim", defaultValue: "user@company.local" }
    ],
    steps: [
      {
        id: "step-1",
        type: "checklist",
        title: "Email Header Analysis",
        items: [
          "Check SPF/DKIM/DMARC alignment",
          "Identify the true Sender IP",
          "Check for Reply-To mismatches"
        ],
        uiPosition: { x: 250, y: 50 }
      },
      {
        id: "step-2",
        type: "decision",
        title: "Did the user click the link?",
        decisionQuestion: "Are there proxy/DNS logs showing a connection from the user to the malicious domain?",
        decisionTrueNext: "step-3",
        decisionFalseNext: "step-4",
        uiPosition: { x: 250, y: 250 }
      },
      {
        id: "step-3",
        type: "warning",
        title: "Force Password Reset",
        content: "User likely compromised. Force a password reset and revoke all active sessions.",
        uiPosition: { x: 50, y: 450 }
      },
      {
        id: "step-4",
        type: "information",
        title: "Purge Email",
        content: "Search and purge the email from all inboxes to prevent future clicks.",
        uiPosition: { x: 450, y: 450 }
      }
    ]
  }
};

export default function PlaybookPage() {
  const [mode, setMode] = useState<'build' | 'run'>('build');
  const [buildView, setBuildView] = useState<'list' | 'diagram'>('list');
  const [runbook, setRunbook] = useState<Runbook>(PLAYBOOK_TEMPLATES["Empty Playbook"]);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const { notify } = useNotification();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get("s");

    if (sharedData) {
      try {
        const decompressed = LZString.decompressFromBase64(sharedData);
        if (decompressed) {
          const parsed = parseRunbook(JSON.parse(decompressed));
          if (parsed) setRunbook(parsed);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to parse shared playbook");
      }
    } else {
      const saved = readLocalStorage('playbook_draft');
      if (saved) {
        try {
          const parsed = parseRunbook(JSON.parse(saved));
          if (parsed) setRunbook(parsed);
        } catch (e) {
          console.error("Failed to parse saved playbook", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      writeLocalStorage('playbook_draft', JSON.stringify(runbook));
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [runbook]);

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(runbook, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `playbook-${runbook.id}.json`);
    dlAnchorElem.click();
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (content.length > 2_000_000) throw new Error("Playbook file is too large");
        const parsed = parseRunbook(JSON.parse(content));
        if (parsed) {
          setRunbook(parsed);
        } else {
          notify("Invalid playbook JSON format.", "error");
        }
      } catch (err) {
        notify("Failed to parse JSON file.", "error");
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
    dlAnchorElem.setAttribute("download", `playbook-${runbook.id}.md`);
    dlAnchorElem.click();
  };

  const handleShare = () => {
    const compressed = LZString.compressToBase64(JSON.stringify(runbook));
    const url = `${window.location.origin}${window.location.pathname}?s=${compressed}`;
    navigator.clipboard.writeText(url);
    setShareLink(url);
    setTimeout(() => setShareLink(null), 3000);
  };

  return (
    <>
      <ToolLayout
        title="Interactive Playbook Builder"
        description="Design and execute structured security incident response workflows."
      >
        <div className="w-full max-w-6xl mx-auto space-y-6">

          {/* Top Action Bar */}
          <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex shrink-0 flex-wrap gap-2">
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
                  <Play className="w-4 h-4 mr-2" /> Execute
                </Button>

                {mode === 'build' && (
                  <div className="flex bg-black border border-[#1a1a1a] rounded-md overflow-hidden ml-2">
                    <button
                      onClick={() => setBuildView('list')}
                      className={`px-3 py-2 text-xs font-bold transition-colors ${buildView === 'list' ? 'bg-[#1a1a1a] text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                      LIST
                    </button>
                    <button
                      onClick={() => setBuildView('diagram')}
                      className={`px-3 py-2 text-xs font-bold transition-colors ${buildView === 'diagram' ? 'bg-[#1a1a1a] text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                      DIAGRAM
                    </button>
                  </div>
                )}
              </div>

              {mode === 'build' && (
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                  <Button onClick={handleShare} variant="outline" size="sm" className="bg-black border-[#1a1a1a] text-blue-400 hover:bg-blue-900/20 hover:text-blue-300">
                    {shareLink ? "Copied!" : "Share URL"}
                  </Button>
                  <div className="mx-1 hidden h-4 w-px bg-[#333] sm:block"></div>
                  <Select value={runbook.title} onValueChange={(v) => {
                    const tmpl = Object.values(PLAYBOOK_TEMPLATES).find(t => t.title === v);
                    if (tmpl) setRunbook(tmpl);
                  }}>
                    <SelectTrigger className="w-[200px] bg-black border-[#1a1a1a] h-9 text-xs">
                      <SelectValue placeholder="Load Template" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-[#1a1a1a]">
                      {Object.keys(PLAYBOOK_TEMPLATES).map(k => (
                        <SelectItem key={k} value={PLAYBOOK_TEMPLATES[k].title}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          {mode === 'build' ? (
            buildView === 'list' ? (
              <Builder runbook={runbook} onChange={setRunbook} />
            ) : (
              <DiagramBuilder runbook={runbook} onChange={setRunbook} />
            )
          ) : (
            <Runner runbook={runbook} onExit={() => setMode('build')} />
          )}

          {mode === 'build' && (
            <ToolActionPanel label="Export / Import" className="justify-end bg-[#080808]">
              <ToolActionButton onClick={exportJSON} variant="outline">
                <Download className="w-4 h-4 mr-2" /> JSON
              </ToolActionButton>
              <ToolActionButton variant="outline" className="relative overflow-hidden">
                <Upload className="w-4 h-4 mr-2" /> Load
                <input
                  type="file"
                  accept=".json"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
                  }}
                />
              </ToolActionButton>
              <ToolActionButton onClick={exportMarkdown} variant="outline">
                <FileText className="w-4 h-4 mr-2" /> Markdown
              </ToolActionButton>
              <RunbookPdfExport runbook={runbook} />
            </ToolActionPanel>
          )}

        </div>
      </ToolLayout>
    </>
  );
}
