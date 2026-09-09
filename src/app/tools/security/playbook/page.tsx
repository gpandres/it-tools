"use client";

import { useEffect, useMemo, useState } from "react";
import LZString from "lz-string";
import { Download, FileText, PenTool, Play, ShieldAlert, Upload } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Builder from "@/app/tools/sysadmin/runbook/components/Builder";
import Runner from "@/app/tools/sysadmin/runbook/components/Runner";
import DiagramBuilder from "@/app/tools/sysadmin/runbook/components/DiagramBuilder";
import RunbookPdfExport from "@/app/tools/sysadmin/runbook/components/RunbookPdfExport";
import type { Runbook } from "@/app/tools/sysadmin/runbook/components/types";
import { ToolActionButton, ToolActionPanel } from "@/components/tool-action-panel";
import { useNotification } from "@/components/notification-provider";
import { downloadTextFile, safeDownloadName } from "@/lib/browser-download";
import { createEvidenceBundle } from "@/lib/evidence-bundle";
import { createPlaybookDocument, defaultIncidentContext, parsePlaybookDocument, playbookMarkdown, type PlaybookDocument } from "@/lib/playbook-document";
import { readLocalStorage, writeLocalStorage } from "@/lib/storage";
import { IncidentCommandPanel } from "./components/incident-command-panel";

const EMPTY_PLAYBOOK = createPlaybookDocument({
  id: "empty-01", title: "New Incident Response Playbook", description: "Define a coordinated response procedure for a security incident.", variables: [], steps: [],
});

const PLAYBOOK_TEMPLATES: Record<string, PlaybookDocument> = {
  "Empty playbook": EMPTY_PLAYBOOK,
  "Ransomware containment": createPlaybookDocument({
    id: "pb-ransomware-01", title: "Ransomware Containment Playbook", description: "Initial response steps for suspected ransomware activity.",
    variables: [{ name: "HOST_IP", description: "IP of the affected machine", defaultValue: "10.0.0.50" }, { name: "INCIDENT_ID", description: "Ticket or case ID", defaultValue: "INC-2026-991" }],
    steps: [
      { id: "triage", type: "information", title: "Triage and validate", content: "Confirm the report and preserve the initial evidence. Look for extension changes, ransom notes, and abnormal encryption activity." },
      { id: "confirmed", type: "decision", title: "Is ransomware confirmed?", decisionQuestion: "Are there clear indicators of active encryption or a ransom note?", decisionTrueNext: "isolate", decisionFalseNext: "monitor" },
      { id: "isolate", type: "command", title: "Isolate the host", description: "Use EDR or network controls to isolate the endpoint. Do not power it off.", command: "Invoke-EDRIsolation -Target {{HOST_IP}} -Reason {{INCIDENT_ID}}", expectedResult: "The endpoint is isolated while preserving evidence." },
      { id: "monitor", type: "verification", title: "Continue monitoring", content: "Treat this as an unconfirmed event and continue endpoint and file activity monitoring." },
    ],
  }, { ...defaultIncidentContext(), phase: "Contain", priority: "Critical", escalationCriteria: "Escalate immediately when encryption, lateral movement, or material business impact is confirmed." }),
  "Phishing investigation": createPlaybookDocument({
    id: "pb-phishing-01", title: "Phishing Investigation Playbook", description: "Analyze, contain, and document a reported phishing email.",
    variables: [{ name: "TARGET_USER", description: "Recipient email address", defaultValue: "user@example.com" }, { name: "INCIDENT_ID", description: "Ticket or case ID", defaultValue: "INC-2026-992" }],
    steps: [
      { id: "headers", type: "checklist", title: "Analyze the email", items: ["Check SPF, DKIM, and DMARC alignment", "Identify the true sender and reply-to", "Defang URLs and preserve message headers"] },
      { id: "click", type: "decision", title: "Did the recipient interact?", decisionQuestion: "Do proxy, DNS, or endpoint logs show a click, download, or credential submission?", decisionTrueNext: "contain-account", decisionFalseNext: "purge" },
      { id: "contain-account", type: "warning", title: "Contain the account", content: "Reset credentials, revoke active sessions, and review mailbox rules. Preserve relevant sign-in and endpoint telemetry." },
      { id: "purge", type: "information", title: "Purge the message", content: "Search for the message across mailboxes and remove matching copies. Record the scope in the incident case." },
    ],
  }, { ...defaultIncidentContext(), phase: "Detect", priority: "High", escalationCriteria: "Escalate when credentials, OAuth consent, malware execution, or multiple recipients are involved." }),
};

function copyDocument(document: PlaybookDocument): PlaybookDocument {
  return JSON.parse(JSON.stringify(document)) as PlaybookDocument;
}

export default function PlaybookPage() {
  const [mode, setMode] = useState<"build" | "run">("build");
  const [buildView, setBuildView] = useState<"list" | "diagram">("list");
  const [document, setDocument] = useState<PlaybookDocument>(() => copyDocument(EMPTY_PLAYBOOK));
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");
  const { notify } = useNotification();
  const { playbook, incident } = document;

  useEffect(() => {
    const sharedData = new URLSearchParams(window.location.search).get("s");
    const serialized = sharedData ? LZString.decompressFromBase64(sharedData) : readLocalStorage("playbook_draft");
    if (!serialized) return;
    let parsed: PlaybookDocument | null = null;
    try {
      parsed = parsePlaybookDocument(JSON.parse(serialized));
    } catch { /* The notification is scheduled below with malformed documents. */ }
    const restoreTimer = window.setTimeout(() => {
      if (parsed) setDocument(parsed);
      else notify("This playbook could not be loaded.", "error");
    }, 0);
    if (sharedData) window.history.replaceState({}, window.document.title, window.location.pathname);
    return () => window.clearTimeout(restoreTimer);
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => writeLocalStorage("playbook_draft", JSON.stringify(document)), 700);
    return () => window.clearTimeout(timer);
  }, [document]);

  const updatePlaybook = (nextPlaybook: Runbook) => setDocument(current => ({ ...current, playbook: nextPlaybook }));
  const updateIncident = (nextIncident: PlaybookDocument["incident"]) => setDocument(current => ({ ...current, incident: nextIncident }));
  const incidentOwners = useMemo(() => [incident.incidentCommander, incident.technicalLead, incident.communicationsLead].filter(Boolean), [incident]);

  const importPlaybook = (file: File) => {
    if (file.size > 2_000_000) { notify("Playbook files are limited to 2 MB in the browser.", "error"); return; }
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = parsePlaybookDocument(JSON.parse(String(event.target?.result || "")));
        if (!parsed) throw new Error("Invalid document");
        setDocument(parsed);
        notify("Playbook loaded locally.");
      } catch { notify("Invalid playbook JSON format.", "error"); }
    };
    reader.onerror = () => notify("Could not read the playbook file.", "error");
    reader.readAsText(file);
  };

  const exportEvidenceBundle = () => {
    const stepSummary = playbook.steps.map((step, index) => `${index + 1}. [${step.type.toUpperCase()}] ${step.title}\n${step.description || step.content || ""}`.trim()).join("\n\n");
    const bundle = createEvidenceBundle({
      source: "playbook", title: playbook.title || "Incident response playbook", description: playbook.description, iocs: [], timeline: [],
      findings: `## Incident command\n- Phase: ${incident.phase}\n- Priority: ${incident.priority}\n- Escalation: ${incident.escalationCriteria}\n\n## Workflow\n${stepSummary || "No steps defined."}`,
      artifacts: [{ name: "Incident command", detail: `${incident.phase} · ${incident.priority}${incidentOwners.length ? ` · Owners: ${incidentOwners.join(", ")}` : ""}` }],
    });
    downloadTextFile(JSON.stringify(bundle, null, 2), `playbook-${safeDownloadName(playbook.id, "workflow")}.evidence.json`, "application/json;charset=utf-8");
    notify("Evidence bundle exported for Investigation.");
  };

  const sharePlaybook = async () => {
    const url = `${window.location.origin}${window.location.pathname}?s=${LZString.compressToBase64(JSON.stringify(document))}`;
    try { await navigator.clipboard.writeText(url); setShareStatus("copied"); }
    catch { setShareStatus("failed"); }
    window.setTimeout(() => setShareStatus("idle"), 3000);
  };

  return <ToolLayout title="Incident Response Playbook" description="Coordinate phases, ownership, decisions, and evidence for a security incident.">
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="border border-[#1a1a1a] bg-[#0a0a0a] p-4" aria-label="Playbook controls">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setMode("build")} variant={mode === "build" ? "default" : "outline"} className={mode === "build" ? "bg-white text-black" : "border-[#1a1a1a] bg-black text-zinc-400 hover:text-white"}><PenTool className="mr-2 h-4 w-4" />Builder Mode</Button>
            <Button onClick={() => setMode("run")} variant={mode === "run" ? "default" : "outline"} className={mode === "run" ? "bg-[#00ff9c] text-black hover:bg-[#00cc7a]" : "border-[#1a1a1a] bg-black text-[#00ff9c] hover:bg-[#00ff9c]/10"}><Play className="mr-2 h-4 w-4" />Execute</Button>
            {mode === "build" && <div className="ml-1 flex overflow-hidden border border-[#1a1a1a] bg-black"><button type="button" onClick={() => setBuildView("list")} className={`px-3 py-2 text-[10px] font-bold ${buildView === "list" ? "bg-[#1a1a1a] text-white" : "text-zinc-500 hover:text-white"}`}>LIST</button><button type="button" onClick={() => setBuildView("diagram")} className={`px-3 py-2 text-[10px] font-bold ${buildView === "diagram" ? "bg-[#1a1a1a] text-white" : "text-zinc-500 hover:text-white"}`}>DIAGRAM</button></div>}
          </div>
          {mode === "build" && <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
            <Button onClick={sharePlaybook} variant="outline" size="sm" className="border-[#1a1a1a] bg-black text-blue-400 hover:bg-blue-900/20 hover:text-blue-300">{shareStatus === "copied" ? "Copied" : shareStatus === "failed" ? "Copy failed" : "Share URL"}</Button>
            <Select value={playbook.title} onValueChange={templateTitle => { const template = Object.values(PLAYBOOK_TEMPLATES).find(item => item.playbook.title === templateTitle); if (template) setDocument(copyDocument(template)); }}><SelectTrigger className="h-9 w-[210px] border-[#1a1a1a] bg-black text-xs"><SelectValue placeholder="Load template" /></SelectTrigger><SelectContent className="border-[#1a1a1a] bg-black">{Object.entries(PLAYBOOK_TEMPLATES).map(([name, template]) => <SelectItem key={name} value={template.playbook.title}>{name}</SelectItem>)}</SelectContent></Select>
          </div>}
        </div>
      </section>

      {mode === "build" ? <>
        <IncidentCommandPanel incident={incident} onChange={updateIncident} />
        {buildView === "list" ? <Builder runbook={playbook} onChange={updatePlaybook} /> : <DiagramBuilder runbook={playbook} onChange={updatePlaybook} />}
        <ToolActionPanel label="Export / Import" className="justify-end bg-[#080808]">
          <ToolActionButton onClick={() => downloadTextFile(JSON.stringify(document, null, 2), `playbook-${safeDownloadName(playbook.id, "workflow")}.json`, "application/json;charset=utf-8")} variant="outline"><Download className="mr-2 h-4 w-4" />JSON</ToolActionButton>
          <ToolActionButton variant="outline" className="relative overflow-hidden"><Upload className="mr-2 h-4 w-4" />Load<input type="file" accept="application/json,.json" className="absolute inset-0 cursor-pointer opacity-0" onChange={event => { const file = event.target.files?.[0]; if (file) importPlaybook(file); event.currentTarget.value = ""; }} /></ToolActionButton>
          <ToolActionButton onClick={() => downloadTextFile(playbookMarkdown(document), `playbook-${safeDownloadName(playbook.id, "workflow")}.md`, "text/markdown;charset=utf-8")} variant="outline"><FileText className="mr-2 h-4 w-4" />Markdown</ToolActionButton>
          <ToolActionButton onClick={exportEvidenceBundle} variant="outline"><ShieldAlert className="mr-2 h-4 w-4" />Evidence bundle</ToolActionButton>
          <RunbookPdfExport runbook={playbook} />
        </ToolActionPanel>
      </> : <>
        <section className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-[#1a1a1a] bg-[#080808] px-4 py-3 text-xs text-zinc-400" aria-label="Active incident command"><span className="font-bold text-[#ffb000]">{incident.phase.toUpperCase()}</span><span className="text-zinc-600">/</span><span className={incident.priority === "Critical" ? "text-red-400" : "text-[#00ff9c]"}>{incident.priority} priority</span>{incidentOwners.length > 0 && <><span className="text-zinc-600">/</span><span>{incidentOwners.join(" · ")}</span></>}</section>
        <Runner runbook={playbook} onExit={() => setMode("build")} />
      </>}
    </div>
  </ToolLayout>;
}
