"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useRef, useEffect } from "react";
import { Copy, Download, FileJson, CheckCircle2, FileText, ClipboardList, ShieldAlert, X, FileUp, Palette, FileSearch } from "lucide-react";
import Script from "next/script";

type IncidentSeverity = "Informational" | "Low" | "Medium" | "High" | "Critical";
type IncidentStatus = "Open" | "Investigating" | "Contained" | "Resolved" | "Closed";

type IncidentReport = {
  title: string;
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  agentName: string;
  affectedUserDept: string;
  affectedSystems: string;
  summary: string;
  rawNotes: string;
  rootCause: string;
  resolution: string;
  actionsTaken: string;
  recommendations: string;
};

const DEFAULT_REPORT: IncidentReport = {
  title: "",
  id: "",
  date: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  severity: "Medium",
  status: "Open",
  agentName: "",
  affectedUserDept: "",
  affectedSystems: "",
  summary: "",
  rawNotes: "",
  rootCause: "",
  resolution: "",
  actionsTaken: "",
  recommendations: "",
};

const TEMPLATES: Record<string, Partial<IncidentReport>> = {
  "Network Outage": {
    title: "Network connectivity outage",
    severity: "High",
    status: "Investigating",
    agentName: "NOC Team",
    affectedUserDept: "Main Office - All Users",
    affectedSystems: "SW-CORE\nVLAN 20\nWEB-01",
    summary: "Users reported a complete loss of network connectivity.",
    rawNotes: "10:31 User reports no connectivity\n10:32 SW-CORE Gi0/1 shows down\n10:34 Interface restarted\n10:36 Connectivity restored",
    rootCause: "",
    resolution: "Connectivity restored after interface reset.",
    actionsTaken: "- Reset Gi0/1 on SW-CORE\n- Verified spanning-tree topology",
    recommendations: "Replace SFP module on Gi0/1 during next maintenance window.",
  },
  "Security Incident": {
    title: "Suspicious login activity",
    severity: "High",
    status: "Contained",
    agentName: "SOC Analyst",
    affectedUserDept: "Finance Dept",
    affectedSystems: "AD-DC-01\nUser Workstation",
    summary: "Multiple failed login attempts followed by a successful login from an anomalous IP address.",
    rawNotes: "08:15 Alert: Multiple failed logins\n08:20 Successful login from IP 198.51.100.44\n08:25 Account locked by SOC\n08:30 User contacted, confirmed they are not traveling",
    rootCause: "Compromised credentials due to phishing.",
    resolution: "Account secured and sessions revoked.",
    actionsTaken: "- Locked AD account\n- Revoked all active tokens\n- Initiated password reset",
    recommendations: "Enforce conditional access policies blocking logins from outside the home country.",
  },
  "Hardware Failure": {
    title: "Disk failure on DB cluster",
    severity: "Medium",
    status: "Resolved",
    agentName: "Datacenter Ops",
    affectedUserDept: "Backend Services",
    affectedSystems: "DB-NODE-03",
    summary: "Drive bay 4 reported SMART errors and eventually failed. RAID array operating in degraded mode.",
    rawNotes: "14:00 SMART monitoring alert\n14:15 Drive marked as offline by RAID controller\n15:00 Datacenter tech swapped drive\n15:10 Array rebuild started\n18:00 Rebuild completed",
    rootCause: "Hardware component failure (expected wear).",
    resolution: "Drive replaced and RAID array rebuilt successfully.",
    actionsTaken: "- Ordered drive replacement\n- Monitored rebuild process",
    recommendations: "Check age of other drives in the same batch.",
  },
  "Service Degradation": {
    title: "API Latency Spike",
    severity: "Medium",
    status: "Resolved",
    agentName: "SRE Team",
    affectedUserDept: "External API Consumers",
    affectedSystems: "API-GATEWAY\nAUTH-SVC",
    summary: "API response times degraded to >5000ms for 30 minutes, causing timeouts for clients.",
    rawNotes: "16:00 Datadog alert: API latency > 5s\n16:05 Identified DB lock on auth table\n16:15 Killed blocking query\n16:20 Latency returned to normal (<100ms)",
    rootCause: "An unoptimized analytics query caused a table lock on the authentication database.",
    resolution: "Killed the blocking query and moved analytics to a read replica.",
    actionsTaken: "- Killed PID 4592 on DB-AUTH\n- Updated proxy config to route analytics to replica",
    recommendations: "Review all automated reporting queries for missing indexes.",
  },
  "Data Breach": {
    title: "Unauthorized Exfiltration of PII",
    severity: "Critical",
    status: "Investigating",
    agentName: "Incident Response Lead",
    affectedUserDept: "Customers / Legal",
    affectedSystems: "S3-BUCKET-BACKUPS",
    summary: "An external actor gained access to a misconfigured S3 bucket containing older database dumps.",
    rawNotes: "09:00 AWS GuardDuty alerted on anomalous S3 access\n09:30 Identified 50GB egress to unknown IP\n10:00 Bucket permissions locked down to private\n10:30 Legal and PR teams notified",
    rootCause: "A recent terraform deployment accidentally removed the block-public-access flag from the backup bucket.",
    resolution: "Access revoked immediately. Investigation ongoing to determine exact records accessed.",
    actionsTaken: "- Applied block-public-access to all S3 buckets via SCP\n- Rotated AWS credentials for CI/CD",
    recommendations: "Implement strict SCPs preventing public S3 buckets in all accounts. Audit terraform plans.",
  }
};

const PATTERNS = [
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/i,
  /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/i,
  /\d{2}\/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/\d{4}:\d{2}:\d{2}:\d{2}\s+[+-]\d{4}/i,
  /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?/,
  /^(?:\[)?(?:(?:\d{4}-\d{2}-\d{2}\s+)?\d{2}:\d{2}(?::\d{2})?)(?:\])?/
];

const PDF_THEMES = ["Modern", "Classic", "Cyber", "Minimal", "Executive"] as const;
type PdfTheme = typeof PDF_THEMES[number];

export default function IncidentReportTool() {
  const [report, setReport] = useState<IncidentReport>(DEFAULT_REPORT);
  const [logo, setLogo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<PdfTheme>("Modern");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof IncidentReport, value: string) => {
    setReport(prev => ({ ...prev, [field]: value as any }));
  };

  const loadTemplate = (name: string) => {
    if (TEMPLATES[name]) {
      setReport({ ...DEFAULT_REPORT, ...TEMPLATES[name], date: new Date().toISOString().split("T")[0] });
    } else {
      setReport(DEFAULT_REPORT);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const parsedTimeline = useMemo(() => {
    const lines = report.rawNotes.split('\n').filter(l => l.trim() !== '');
    const events: { time: string; text: string }[] = [];
    const undated: string[] = [];
    for (const line of lines) {
      let matched = false;
      for (const regex of PATTERNS) {
        const match = line.match(regex);
        if (match) {
          const timeStr = match[0];
          const text = line.replace(timeStr, '').trim().replace(/^[-:]\s*/, '');
          events.push({ time: timeStr.replace(/[\[\]]/g, '').trim(), text });
          matched = true;
          break;
        }
      }
      if (!matched) {
        undated.push(line.trim());
      }
    }
    return { events, undated };
  }, [report.rawNotes]);

  // --- PDF GENERATION LOGIC ---
  const generateDocDef = () => {
    const baseStyles = {
      metaValue: { fontSize: 10, margin: [0, 0, 0, 5] },
      normalText: { fontSize: 10, margin: [0, 0, 0, 10], lineHeight: 1.4 },
      timelineTime: { fontSize: 10, bold: true },
      timelineText: { fontSize: 10, margin: [0, 0, 0, 5], lineHeight: 1.3 },
      listText: { fontSize: 10, margin: [0, 2, 0, 2], lineHeight: 1.3 },
      footer: { fontSize: 8, color: '#888', alignment: 'center', margin: [0, 10, 0, 0] }
    };

    let themeStyles: any = {};
    const themeColors = {
      Modern: { bg: null, headerBg: '#2563eb', headerText: '#ffffff', line: '#cbd5e1' },
      Classic: { bg: null, headerBg: '#e5e5e5', headerText: '#000000', line: '#000000' },
      Cyber: { bg: '#111111', headerBg: '#00ff9c', headerText: '#000000', line: '#333333' },
      Minimal: { bg: null, headerBg: '#f4f4f5', headerText: '#18181b', line: '#ffffff' },
      Executive: { bg: null, headerBg: '#0a192f', headerText: '#ffffff', line: '#d4af37' }
    };
    const c = themeColors[theme];

    switch (theme) {
      case "Modern":
        themeStyles = {
          ...baseStyles,
          header: { fontSize: 24, bold: true, color: '#2563eb', margin: [0, 0, 0, 5] },
          subheader: { fontSize: 14, color: '#475569', margin: [0, 0, 0, 20] },
          sectionTitle: { fontSize: 12, bold: true, color: '#1e293b', margin: [0, 15, 0, 8] },
          metaKey: { bold: true, fontSize: 9, margin: [0, 0, 0, 2] },
        };
        break;
      case "Classic":
        themeStyles = {
          ...baseStyles,
          header: { fontSize: 26, bold: true, color: '#000000', margin: [0, 0, 0, 5] },
          subheader: { fontSize: 14, italics: true, color: '#000000', margin: [0, 0, 0, 20] },
          sectionTitle: { fontSize: 14, bold: true, decoration: 'underline', color: '#000000', margin: [0, 15, 0, 8] },
          metaKey: { bold: true, fontSize: 10, margin: [0, 0, 0, 2] },
        };
        break;
      case "Cyber":
        themeStyles = {
          ...baseStyles,
          header: { fontSize: 24, bold: true, color: '#00ff9c', margin: [0, 0, 0, 5] },
          subheader: { fontSize: 14, color: '#00ff9c', margin: [0, 0, 0, 20] },
          sectionTitle: { fontSize: 12, bold: true, color: '#ff0055', margin: [0, 15, 0, 8] },
          metaKey: { bold: true, fontSize: 10, margin: [0, 0, 0, 2] },
          metaValue: { fontSize: 10, color: '#ffffff', margin: [0, 0, 0, 5] },
          normalText: { fontSize: 10, color: '#dddddd', margin: [0, 0, 0, 10], lineHeight: 1.4 },
          timelineTime: { fontSize: 10, bold: true, color: '#00ff9c' },
          timelineText: { fontSize: 10, color: '#dddddd', margin: [0, 0, 0, 5], lineHeight: 1.3 },
          listText: { fontSize: 10, color: '#dddddd', margin: [0, 2, 0, 2], lineHeight: 1.3 }
        };
        break;
      case "Minimal":
        themeStyles = {
          ...baseStyles,
          header: { fontSize: 20, color: '#111111', margin: [0, 0, 0, 5] },
          subheader: { fontSize: 12, color: '#999999', margin: [0, 0, 0, 20] },
          sectionTitle: { fontSize: 11, bold: true, color: '#111111', margin: [0, 20, 0, 8] },
          metaKey: { fontSize: 9, margin: [0, 0, 0, 2] },
        };
        break;
      case "Executive":
        themeStyles = {
          ...baseStyles,
          header: { fontSize: 24, bold: true, color: '#0a192f', margin: [0, 0, 0, 5] },
          subheader: { fontSize: 14, color: '#d4af37', margin: [0, 0, 0, 20] },
          sectionTitle: { fontSize: 13, bold: true, color: '#0a192f', margin: [0, 15, 0, 8] },
          metaKey: { bold: true, fontSize: 9, margin: [0, 0, 0, 2] },
        };
        break;
    }

    const docDef: any = {
      content: [],
      styles: themeStyles,
      defaultStyle: { font: 'Roboto' },
      footer: function (currentPage: number, pageCount: number) {
        return {
          text: `Page ${currentPage.toString()} of ${pageCount}`,
          style: 'footer'
        };
      }
    };

    if (c.bg) {
      docDef.background = function (currentPage: number, pageSize: any) {
        if (!pageSize) return null;
        return { canvas: [{ type: 'rect', x: 0, y: 0, w: pageSize.width, h: pageSize.height, color: c.bg }] };
      };
    }

    if (logo) docDef.content.push({ image: logo, width: 120, margin: [0, 0, 0, 20] });

    docDef.content.push(
      { text: 'INCIDENT REPORT', style: 'header' },
      { text: report.title || 'Untitled Incident', style: 'subheader' }
    );

    // Premium Metadata Table
    docDef.content.push({
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [
            { text: 'SEVERITY', style: 'metaKey', fillColor: c.headerBg, color: c.headerText, margin: [5, 5, 5, 5] },
            { text: 'STATUS', style: 'metaKey', fillColor: c.headerBg, color: c.headerText, margin: [5, 5, 5, 5] },
            { text: 'DATE', style: 'metaKey', fillColor: c.headerBg, color: c.headerText, margin: [5, 5, 5, 5] },
            { text: 'DURATION', style: 'metaKey', fillColor: c.headerBg, color: c.headerText, margin: [5, 5, 5, 5] }
          ],
          [
            { text: report.severity.toUpperCase(), style: 'metaValue', margin: [5, 5, 5, 5] },
            { text: report.status.toUpperCase(), style: 'metaValue', margin: [5, 5, 5, 5] },
            { text: report.date || 'N/A', style: 'metaValue', margin: [5, 5, 5, 5] },
            { text: `${report.startTime || '?'} - ${report.endTime || 'Ongoing'}`, style: 'metaValue', margin: [5, 5, 5, 5] }
          ],
          [
            { text: 'INCIDENT ID', style: 'metaKey', fillColor: c.headerBg, color: c.headerText, margin: [5, 5, 5, 5] },
            { text: 'AGENT/RESPONDER', style: 'metaKey', fillColor: c.headerBg, color: c.headerText, margin: [5, 5, 5, 5] },
            { text: 'AFFECTED USER/DEPT', style: 'metaKey', fillColor: c.headerBg, color: c.headerText, margin: [5, 5, 5, 5], colSpan: 2 },
            {}
          ],
          [
            { text: report.id || 'N/A', style: 'metaValue', margin: [5, 5, 5, 5] },
            { text: report.agentName || 'N/A', style: 'metaValue', margin: [5, 5, 5, 5] },
            { text: report.affectedUserDept || 'N/A', style: 'metaValue', margin: [5, 5, 5, 5], colSpan: 2 },
            {}
          ]
        ]
      },
      layout: {
        hLineWidth: () => theme === 'Minimal' ? 0 : 1,
        vLineWidth: () => theme === 'Minimal' ? 0 : 1,
        hLineColor: () => c.line,
        vLineColor: () => c.line,
      },
      margin: [0, 0, 0, 20]
    });

    if (report.summary) {
      docDef.content.push({
        stack: [
          { text: 'SUMMARY', style: 'sectionTitle' },
          { text: report.summary, style: 'normalText' }
        ], unbreakable: true
      });
    }

    if (report.affectedSystems) {
      docDef.content.push({
        stack: [
          { text: 'AFFECTED SYSTEMS', style: 'sectionTitle' },
          { ul: report.affectedSystems.split('\n').filter(s => s.trim() !== ''), style: 'listText' }
        ], unbreakable: true
      });
    }

    if (parsedTimeline.events.length > 0 || parsedTimeline.undated.length > 0) {
      docDef.content.push({ text: 'TIMELINE', style: 'sectionTitle' });
      const tlBody: any[] = [];
      parsedTimeline.events.forEach(e => tlBody.push([{ text: e.time, style: 'timelineTime' }, { text: e.text, style: 'timelineText' }]));
      if (tlBody.length > 0) docDef.content.push({ table: { widths: ['20%', '80%'], body: tlBody }, layout: 'noBorders', margin: [0, 0, 0, 10] });
      if (parsedTimeline.undated.length > 0) {
        docDef.content.push({
          stack: [
            { text: 'Undated Events', style: 'metaKey', margin: [0, 10, 0, 5] },
            { ul: parsedTimeline.undated, style: 'listText' }
          ], unbreakable: true
        });
      }
    }

    docDef.content.push({
      stack: [
        { text: 'ROOT CAUSE', style: 'sectionTitle' },
        { text: report.rootCause || 'Not provided.', style: 'normalText', italics: !report.rootCause }
      ], unbreakable: true
    });

    if (report.resolution) {
      docDef.content.push({
        stack: [
          { text: 'RESOLUTION', style: 'sectionTitle' },
          { text: report.resolution, style: 'normalText' }
        ], unbreakable: true
      });
    }

    if (report.actionsTaken) {
      docDef.content.push({
        stack: [
          { text: 'ACTIONS TAKEN', style: 'sectionTitle' },
          { text: report.actionsTaken, style: 'normalText' }
        ], unbreakable: true
      });
    }

    if (report.recommendations) {
      docDef.content.push({
        stack: [
          { text: 'RECOMMENDATIONS', style: 'sectionTitle' },
          { text: report.recommendations, style: 'normalText' }
        ], unbreakable: true
      });
    }

    return docDef;
  };

  useEffect(() => {
    let objectUrl: string | null = null;
    let timer: any;

    const generate = () => {
      try {
        setPdfError(null);
        
        const win = window as any;
        if (!win.pdfMake || !win.pdfMake.vfs) {
          // Retry in a bit if CDN hasn't loaded yet
          setPdfError("Loading PDF engine...");
          timer = setTimeout(generate, 500);
          return;
        }

        const pdfMake = win.pdfMake;
        const docDef = generateDocDef();
        const pdfGen = pdfMake.createPdf(docDef);
        
        pdfGen.getBlob((blob: Blob) => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
          setPdfError(null);
        });
      } catch (e: any) {
        console.error("PDF Preview generation error:", e);
        setPdfError(e.message || "Unknown error generating PDF");
      }
    };

    timer = setTimeout(generate, 800);

    return () => {
      clearTimeout(timer);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [report, logo, theme, parsedTimeline]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportPDF = () => {
    try {
      const win = window as any;
      if (!win.pdfMake) {
        alert("PDF engine is still loading, please wait a moment.");
        return;
      }
      
      const pdfMake = win.pdfMake;
      const docDef = generateDocDef();
      pdfMake.createPdf(docDef).download(`incident-${report.id || report.date}.pdf`);
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  // --- MD, TXT, DOCX EXPORTS ---
  const generateMarkdown = () => {
    let md = `# INCIDENT REPORT\n\n## Meta\n`;
    md += `- **Incident:** ${report.title || 'Untitled Incident'}\n`;
    if (report.id) md += `- **ID:** ${report.id}\n`;
    md += `- **Severity:** ${report.severity.toUpperCase()}\n`;
    md += `- **Status:** ${report.status.toUpperCase()}\n`;
    md += `- **Date:** ${report.date || 'Not specified'}\n`;
    if (report.startTime || report.endTime) md += `- **Duration:** ${report.startTime || '?'} - ${report.endTime || 'Ongoing'}\n`;
    if (report.agentName) md += `- **Agent/Responder:** ${report.agentName}\n`;
    if (report.affectedUserDept) md += `- **Affected User/Dept:** ${report.affectedUserDept}\n`;
    md += `\n---\n\n`;
    if (report.summary) md += `## Summary\n${report.summary}\n\n`;
    if (report.affectedSystems) {
      md += `## Affected Systems\n`;
      report.affectedSystems.split('\n').filter(s => s.trim() !== '').forEach(s => md += `- ${s}\n`);
      md += `\n`;
    }
    if (parsedTimeline.events.length > 0 || parsedTimeline.undated.length > 0) {
      md += `## Timeline\n`;
      parsedTimeline.events.forEach(e => md += `**${e.time}**\n${e.text}\n\n`);
      if (parsedTimeline.undated.length > 0) {
        md += `### Undated Events\n`;
        parsedTimeline.undated.forEach(e => md += `- ${e}\n`);
        md += `\n`;
      }
    }
    md += `## Root Cause\n${report.rootCause ? report.rootCause : 'Not provided.'}\n\n`;
    if (report.resolution) md += `## Resolution\n${report.resolution}\n\n`;
    if (report.actionsTaken) md += `## Actions Taken\n${report.actionsTaken}\n\n`;
    if (report.recommendations) md += `## Recommendations\n${report.recommendations}\n\n`;
    return md;
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `incident-${report.id || report.date}.json`;
    a.click();
  };

  const handleExportTXT = () => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(generateMarkdown());
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `incident-${report.id || report.date}.txt`;
    a.click();
  };

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js" strategy="lazyOnload" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.min.js" strategy="lazyOnload" />
      <ToolLayout
        title="Incident Report Generator"
      description="Create structured IT and cybersecurity incident reports from raw notes, logs, and timelines."
    >
      <div className="flex items-center gap-2 mb-8 p-3 bg-[#00ff9c]/10 border border-[#00ff9c]/30 rounded text-[#00ff9c] text-xs font-mono max-w-4xl mx-auto">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <p><strong>Processed locally in your browser.</strong> No data is ever sent to a server. Safe for confidential logs.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">

        {/* Editor Form */}
        <div className="space-y-6">
          <div className="p-4 bg-black border border-[#1a1a1a] rounded">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Load Template Data</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => loadTemplate("")} className="border-[#1a1a1a] hover:text-white text-xs">Clear</Button>
              {Object.keys(TEMPLATES).map(tmpl => (
                <Button key={tmpl} variant="outline" size="sm" onClick={() => loadTemplate(tmpl)} className="border-[#1a1a1a] hover:border-[#00ff9c] hover:text-[#00ff9c] text-xs transition-colors">
                  {tmpl}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">Meta Information</h3>

            <div className="space-y-2">
              <Label>Company Logo (For PDF)</Label>
              <div className="flex items-center gap-4">
                {logo ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="Logo Preview" className="h-12 w-auto object-contain bg-white rounded p-1" />
                    <button onClick={() => setLogo(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="bg-black border-[#1a1a1a] hover:border-[#00ff9c] hover:text-[#00ff9c]">
                    <FileUp className="w-4 h-4 mr-2" /> Upload Logo
                  </Button>
                )}
                <input type="file" accept="image/png, image/jpeg" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Incident Title</Label>
                <Input value={report.title} onChange={e => updateField("title", e.target.value)} placeholder="Network connectivity outage" className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Incident ID <span className="text-zinc-600">(Optional)</span></Label>
                <Input value={report.id} onChange={e => updateField("id", e.target.value)} placeholder="INC-2026-001" className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agent / Responder</Label>
                <Input value={report.agentName} onChange={e => updateField("agentName", e.target.value)} placeholder="John Doe (SOC)" className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Affected User / Dept</Label>
                <Input value={report.affectedUserDept} onChange={e => updateField("affectedUserDept", e.target.value)} placeholder="Finance Dept" className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={report.date} onChange={e => updateField("date", e.target.value)} className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={report.startTime} onChange={e => updateField("startTime", e.target.value)} className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={report.endTime} onChange={e => updateField("endTime", e.target.value)} className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={report.severity} onValueChange={(v) => updateField("severity", v || "")}>
                  <SelectTrigger className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[#1a1a1a] text-zinc-300 font-mono">
                    <SelectItem value="Informational">Informational</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={report.status} onValueChange={(v) => updateField("status", v || "")}>
                  <SelectTrigger className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[#1a1a1a] text-zinc-300 font-mono">
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Investigating">Investigating</SelectItem>
                    <SelectItem value="Contained">Contained</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mt-8">Incident Details</h3>

            <div className="space-y-2">
              <Label>Affected Systems (One per line)</Label>
              <Textarea value={report.affectedSystems} onChange={e => updateField("affectedSystems", e.target.value)} placeholder="SW-CORE\nVLAN 20\nWEB-01" className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea value={report.summary} onChange={e => updateField("summary", e.target.value)} placeholder="Brief description of the incident and impact..." className="bg-black border-[#1a1a1a] focus:border-purple-500 text-sm min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between items-center">
                <span>Raw Notes / Timeline</span>
                <span className="text-[10px] text-zinc-500 font-normal">Auto-parses Syslog, ISO 8601, HH:MM</span>
              </Label>
              <Textarea value={report.rawNotes} onChange={e => updateField("rawNotes", e.target.value)} placeholder={"10:31 User reports no connectivity\n10:32 SW-CORE Gi0/1 shows down"} className="bg-black border-[#1a1a1a] focus:border-purple-500 font-mono text-sm min-h-[200px]" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mt-8">Post-Incident</h3>

            <div className="space-y-2">
              <Label>Root Cause</Label>
              <Textarea value={report.rootCause} onChange={e => updateField("rootCause", e.target.value)} placeholder="Leave empty if unknown. Do not guess." className="bg-black border-[#1a1a1a] focus:border-purple-500 text-sm min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label>Resolution</Label>
              <Textarea value={report.resolution} onChange={e => updateField("resolution", e.target.value)} placeholder="How was the incident resolved?" className="bg-black border-[#1a1a1a] focus:border-purple-500 text-sm min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label>Actions Taken</Label>
              <Textarea value={report.actionsTaken} onChange={e => updateField("actionsTaken", e.target.value)} placeholder="List of specific actions performed..." className="bg-black border-[#1a1a1a] focus:border-purple-500 text-sm min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label>Recommendations <span className="text-zinc-600">(Optional)</span></Label>
              <Textarea value={report.recommendations} onChange={e => updateField("recommendations", e.target.value)} placeholder="Steps to prevent recurrence..." className="bg-black border-[#1a1a1a] focus:border-purple-500 text-sm min-h-[100px]" />
            </div>
          </div>
        </div>

        {/* Live Preview & Export Section */}
        <div className="mt-16 pt-8 border-t border-[#1a1a1a]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <FileSearch className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold">Document Preview</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-[#050505] p-2 rounded border border-[#1a1a1a]">
              <div className="flex items-center gap-2 pr-4 border-r border-[#1a1a1a]">
                <Palette className="w-4 h-4 text-zinc-500" />
                <Select value={theme} onValueChange={(v) => setTheme(v as PdfTheme)}>
                  <SelectTrigger className="h-8 w-[130px] text-xs bg-black border-[#1a1a1a] focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[#1a1a1a] text-zinc-300 text-xs">
                    {PDF_THEMES.map(t => <SelectItem key={t} value={t}>{t} Theme</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleExportPDF} size="sm" className="bg-[#ff0055] hover:bg-[#ff0055]/90 text-white font-bold h-8">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>

              <div className="flex items-center gap-1 pl-4 border-l border-[#1a1a1a]">
                <Button onClick={handleCopyMarkdown} variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#1a1a1a] hover:text-white" title="Copy Markdown">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                </Button>
                <Button onClick={handleExportTXT} variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#1a1a1a] hover:text-white" title="Download TXT">
                  <FileText className="w-4 h-4 text-zinc-500" />
                </Button>
                <Button onClick={handleExportJSON} variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#1a1a1a] hover:text-white" title="Download JSON">
                  <FileJson className="w-4 h-4 text-zinc-500" />
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#323639] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-10 bg-[#2b2b2b] border-b border-[#1a1a1a] flex items-center px-4 justify-center">
              <span className="text-xs text-zinc-400 font-mono tracking-widest uppercase">Live PDF Render</span>
            </div>
            {pdfError ? (
              <div className="w-full h-[800px] mt-10 flex flex-col items-center justify-center text-red-500 space-y-4">
                <ShieldAlert className="w-12 h-12" />
                <p className="font-mono text-sm tracking-widest uppercase">Error Rendering PDF</p>
                <p className="text-xs text-red-400 font-mono text-center px-8">{pdfError}</p>
              </div>
            ) : pdfUrl ? (
              <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} className="w-full h-[800px] mt-10 border-0" />
            ) : (
              <div className="w-full h-[800px] mt-10 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <div className="w-8 h-8 border-4 border-zinc-600 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="font-mono text-sm tracking-widest uppercase">Rendering Document...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </ToolLayout>
    </>
  );
}
