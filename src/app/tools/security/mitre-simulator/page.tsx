"use client";

import { useState, useEffect, Suspense } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Play, Shield, ShieldAlert, Terminal, RefreshCw, CheckCircle2, XCircle, Skull, Shuffle, Plus, Share2, Copy, Info, Monitor, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { MITRE_DB, MitreDef } from "@/lib/mitre-db";
import { WIN_EVENTS_DB, WinEventDef } from "@/lib/windows-events-db";
import { LINUX_EVENTS_DB, LinuxEventDef } from "@/lib/linux-events-db";

// --- Types ---
type TileType = "mitre" | "event";

type Tile = { id: string; type: TileType; label: string; };

type ScenarioStep = { id: string; description: string; requiredMitreId: string; requiredEventId: string; };

type Scenario = {
  id: string;
  title: string;
  description: string;
  platform: "Windows" | "Linux";
  steps: ScenarioStep[];
  pool?: Tile[]; 
};

type ModalData = 
  | { type: "mitre", data: MitreDef }
  | { type: "windows", data: WinEventDef }
  | { type: "linux", data: LinuxEventDef };

// --- Helper Functions ---
const T = (id: string, label: string): Tile => ({ id, type: "mitre", label });
const E = (id: string, label: string): Tile => ({ id, type: "event", label });

// --- Procedural Generation Engine ---
const VECTORS = [
  {
    name: "Phishing & Ransomware",
    desc: "A client-side compromise starting with a phishing email and ending in massive data encryption.",
    windows_phases: [
      [
        { desc: "Attacker sends an email with a malicious macro-enabled Word document.", mitre: "T1566", event: "none" },
        { desc: "Victim receives a spearphishing link pointing to a fake login portal.", mitre: "T1566", event: "Sysmon 22" },
      ],
      [
        { desc: "The macro executes an obfuscated PowerShell script in the background.", mitre: "T1059.001", event: "Sysmon 1" },
        { desc: "The user downloads a disguised executable and double-clicks it.", mitre: "T1204", event: "Sysmon 1" },
      ],
      [
        { desc: "Malware dumps LSASS memory using a custom procdump technique.", mitre: "T1003.001", event: "Sysmon 10" },
        { desc: "Malware searches local browser databases for saved passwords.", mitre: "T1555", event: "Sysmon 1" },
      ],
      [
        { desc: "The malware encrypts all user documents and drops a ransom note.", mitre: "T1486", event: "Sysmon 11" },
        { desc: "Malware disables Windows Defender via PowerShell cmdlets.", mitre: "T1562.001", event: "Sysmon 1" },
      ]
    ],
    linux_phases: [
      [
        { desc: "Employee receives an email with a malicious PDF attachment that exploits a local viewer.", mitre: "T1566", event: "none" },
        { desc: "Victim is tricked into running a curl command copied from a fake IT portal.", mitre: "T1204", event: "auditd EXECVE" },
      ],
      [
        { desc: "A malicious bash script is executed to download a secondary payload.", mitre: "T1059.004", event: "auditd EXECVE" },
        { desc: "The attacker drops a python script to run silently in the background.", mitre: "T1059.004", event: "auditd SYSCALL" },
      ],
      [
        { desc: "Malware searches local browser databases for saved passwords.", mitre: "T1555", event: "auditd SYSCALL" },
        { desc: "Attacker attempts to read /etc/shadow directly.", mitre: "T1003.008", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The malware encrypts all user home directories.", mitre: "T1486", event: "auditd SYSCALL" },
        { desc: "Malware echoes empty strings into /var/log/syslog to hide its tracks.", mitre: "T1070.002", event: "syslog" },
      ]
    ]
  },
  {
    name: "Web Exploitation to Data Theft",
    desc: "An attacker exploits a vulnerability on a public-facing web server to steal sensitive databases.",
    windows_phases: [
      [
        { desc: "Attacker exploits an RCE vulnerability on a public IIS server.", mitre: "T1190", event: "none" },
      ],
      [
        { desc: "An ASPX web shell is written to the webroot directory.", mitre: "T1505.003", event: "Sysmon 11" },
      ],
      [
        { desc: "The attacker dumps the SAM registry hive.", mitre: "T1003.001", event: "Sysmon 1" },
      ],
      [
        { desc: "The stolen data is exfiltrated to an external MEGA cloud account.", mitre: "T1567", event: "Sysmon 3" },
      ]
    ],
    linux_phases: [
      [
        { desc: "Attacker exploits an RCE vulnerability (e.g. Log4Shell) on a public Apache server.", mitre: "T1190", event: "none" },
      ],
      [
        { desc: "A PHP web shell is written to the /var/www/html/uploads directory.", mitre: "T1505.003", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The attacker dumps local /etc/shadow.", mitre: "T1003.008", event: "auditd EXECVE" },
      ],
      [
        { desc: "The stolen data is exfiltrated to an external MEGA cloud account.", mitre: "T1567", event: "auditd EXECVE" },
      ]
    ]
  },
  {
    name: "The Insider Threat",
    desc: "A disgruntled employee abuses valid credentials to destroy company data and hide their tracks.",
    windows_phases: [
      [
        { desc: "Employee logs into an internal file server via RDP.", mitre: "T1021.001", event: "4624" },
      ],
      [
        { desc: "Employee accesses the sensitive 'HR_Confidential' network share.", mitre: "T1069.002", event: "5140" },
      ],
      [
        { desc: "Employee uses wevtutil to completely clear the Windows Security Event logs.", mitre: "T1070.001", event: "1102" },
      ],
      [
        { desc: "Employee permanently deletes the primary financial databases.", mitre: "T1485", event: "Sysmon 23" },
      ]
    ],
    linux_phases: [
      [
        { desc: "Employee logs into an internal database server via SSH.", mitre: "T1021.004", event: "auth.log" },
      ],
      [
        { desc: "Employee uses sudo to elevate to root.", mitre: "T1548.003", event: "auditd USER_CMD" },
      ],
      [
        { desc: "Employee deletes their own bash history to prevent auditing.", mitre: "T1070.003", event: "bash_history" },
      ],
      [
        { desc: "Employee permanently deletes the primary financial databases.", mitre: "T1485", event: "auditd EXECVE" },
      ]
    ]
  },
  {
    name: "Supply Chain & Persistence",
    desc: "A trusted vendor update introduces a backdoor that establishes deep persistence on the system.",
    windows_phases: [
      [
        { desc: "Victim installs a digitally signed but backdoored update of a popular tool.", mitre: "T1195", event: "none" },
      ],
      [
        { desc: "The backdoor establishes a beacon encapsulated in DNS queries.", mitre: "T1071", event: "Sysmon 22" },
      ],
      [
        { desc: "The payload creates a new Windows Service to ensure it runs on every boot.", mitre: "T1543.003", event: "7045" },
      ],
      [
        { desc: "The malware creates a Scheduled Task to run silently every hour.", mitre: "T1053.005", event: "4698" },
      ]
    ],
    linux_phases: [
      [
        { desc: "A developer installs a malicious npm package via typo-squatting.", mitre: "T1195", event: "none" },
      ],
      [
        { desc: "The backdoor reaches out to a C2 server to download a secondary payload.", mitre: "T1105", event: "auditd EXECVE" },
      ],
      [
        { desc: "The payload creates a malicious systemd unit file for persistence.", mitre: "T1543.002", event: "syslog" },
      ],
      [
        { desc: "The malware adds an entry to /etc/crontab to run a reverse shell.", mitre: "T1053.003", event: "auditd SYSCALL" },
      ]
    ]
  }
];

const generateProceduralScenario = (): Scenario => {
  const vector = VECTORS[Math.floor(Math.random() * VECTORS.length)];
  const isWindows = Math.random() > 0.5;
  const platform = isWindows ? "Windows" : "Linux";
  const phases = isWindows ? vector.windows_phases : vector.linux_phases;
  
  const steps: ScenarioStep[] = [];
  const pool: Tile[] = [];

  phases.forEach((phase, idx) => {
    const choice = phase[Math.floor(Math.random() * phase.length)];
    steps.push({
      id: `step-${idx + 1}`,
      description: choice.desc,
      requiredMitreId: choice.mitre,
      requiredEventId: choice.event
    });
    
    pool.push(T(choice.mitre, choice.mitre));
    pool.push(E(choice.event, choice.event === "none" ? "No Event" : choice.event));
  });

  // Decoys tailored to OS
  const decoysMitreWin = ["T1566", "T1059.001", "T1003.001", "T1505.003", "T1486", "T1070.001", "T1021.001", "T1543.003", "T1055"];
  const decoysEventWin = ["Sysmon 1", "Sysmon 3", "Sysmon 10", "Sysmon 11", "Sysmon 22", "4624", "4688", "5140", "1102", "7045", "4698"];
  
  const decoysMitreLin = ["T1566", "T1059.004", "T1003.008", "T1505.003", "T1486", "T1070.003", "T1021.004", "T1543.002", "T1548.003"];
  const decoysEventLin = ["auditd EXECVE", "auditd USER_LOGIN", "auditd USER_CMD", "auditd SYSCALL", "auth.log", "syslog", "bash_history"];
  
  const decoysMitre = isWindows ? decoysMitreWin : decoysMitreLin;
  const decoysEvent = isWindows ? decoysEventWin : decoysEventLin;

  for(let i=0; i<3; i++) {
    const rm = decoysMitre[Math.floor(Math.random() * decoysMitre.length)];
    const re = decoysEvent[Math.floor(Math.random() * decoysEvent.length)];
    if (!pool.find(t => t.id === rm)) pool.push(T(rm, rm));
    if (!pool.find(t => t.id === re)) pool.push(E(re, re));
  }

  return {
    id: "procedural-" + Math.random().toString(36).substring(7),
    title: `Incident: ${vector.name}`,
    description: vector.desc,
    platform,
    steps,
    pool: pool.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
  };
};

// --- Component with Suspense ---
export default function MitreSimulatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#00ff9c] font-mono">Loading Simulator...</div>}>
      <MitreSimulator />
    </Suspense>
  );
}

function MitreSimulator() {
  const searchParams = useSearchParams();
  const sharedScenarioBase64 = searchParams.get("s");

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isHardMode, setIsHardMode] = useState(false);
  const [showHints, setShowHints] = useState(true);
  
  // Custom Scenario Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderPlatform, setBuilderPlatform] = useState<"Windows" | "Linux">("Windows");
  const [builderSteps, setBuilderSteps] = useState([{ desc: "", mitre: "", event: "" }]);
  const [shareLink, setShareLink] = useState("");
  const [builderError, setBuilderError] = useState("");
  const [focusedField, setFocusedField] = useState<{index: number, type: "mitre" | "event"} | null>(null);
  const [seedError, setSeedError] = useState<string>("");

  // Info Modal State
  const [infoModalData, setInfoModalData] = useState<ModalData | null>(null);

  const [pool, setPool] = useState<Tile[]>([]);
  type MappingState = { mitre: Tile | null; event: Tile | null; textMitre: string; textEvent: string; };
  const [mapping, setMapping] = useState<Record<string, MappingState>>({});
  
  const [validation, setValidation] = useState<{ isChecked: boolean, results: Record<string, { mitre: boolean, event: boolean }> }>({
    isChecked: false,
    results: {}
  });

  useEffect(() => {
    if (sharedScenarioBase64) {
      try {
        const decodedStr = atob(sharedScenarioBase64);
        if (decodedStr.length > 5000) throw new Error("Payload too large");
        
        const decoded = JSON.parse(decodedStr);
        if (decoded && typeof decoded === "object" && typeof decoded.title === "string" && Array.isArray(decoded.steps)) {
          
          // Strict Validation
          if (decoded.title.length > 100 || (decoded.description && decoded.description.length > 500)) {
             throw new Error("Payload text fields too long");
          }
          if (decoded.platform !== "Windows" && decoded.platform !== "Linux") {
             throw new Error("Invalid platform");
          }

          const customPool: Tile[] = [];
          for (const s of decoded.steps) {
            if (typeof s.description !== "string" || s.description.length > 500) throw new Error("Invalid step description");
            if (typeof s.requiredMitreId !== "string" || typeof s.requiredEventId !== "string") throw new Error("Invalid step IDs");
            
            const mitreId = s.requiredMitreId.trim().toUpperCase();
            const eventId = s.requiredEventId.trim();
            
            // Validate against DBs
            const mitreExists = MITRE_DB.some(m => m.id.toUpperCase() === mitreId);
            if (!mitreExists) throw new Error(`MITRE ID ${mitreId} does not exist in DB.`);
            
            let eventExists = false;
            if (eventId.toLowerCase() === "none" || eventId.toLowerCase() === "no event") {
              eventExists = true;
            } else if (decoded.platform === "Windows") {
              eventExists = WIN_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
            } else {
              eventExists = LINUX_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
            }
            if (!eventExists) throw new Error(`Event ID ${eventId} does not exist in ${decoded.platform} DB.`);

            customPool.push(T(mitreId, mitreId));
            customPool.push(E(eventId, eventId.toLowerCase() === "none" ? "No Event" : eventId));
            s.requiredMitreId = mitreId;
            s.requiredEventId = eventId;
          }
          
          decoded.pool = customPool;
          loadScenario(decoded as Scenario);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        } else {
           throw new Error("Invalid structure");
        }
      } catch (e: any) {
        window.history.replaceState({}, '', window.location.pathname);
        setSeedError("The provided custom scenario data is corrupt, manipulated, or contains invalid telemetry IDs.");
      }
    }
    handleGenerateProcedural();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedScenarioBase64]);

  function loadScenario(sc: Scenario) {
    setScenario(sc);
    const shuffledPool = sc.pool ? [...sc.pool].sort(() => Math.random() - 0.5) : [];
    setPool(shuffledPool);
    
    const initialMapping: Record<string, MappingState> = {};
    sc.steps.forEach(s => {
      initialMapping[s.id] = { mitre: null, event: null, textMitre: "", textEvent: "" };
    });
    setMapping(initialMapping);
    setValidation({ isChecked: false, results: {} });
  };

  function handleGenerateProcedural() {
    loadScenario(generateProceduralScenario());
  }

  const toggleHardMode = () => {
    setIsHardMode(!isHardMode);
    if (scenario) loadScenario(scenario);
  };

  // --- Builder Handlers ---
  const handleAddBuilderStep = () => {
    setBuilderSteps([...builderSteps, { desc: "", mitre: "", event: "" }]);
  };
  const handleBuilderGenerateLink = () => {
    setBuilderError("");
    setShareLink("");
    
    if (!builderTitle.trim()) {
      setBuilderError("Title is required.");
      return;
    }
    
    if (builderSteps.length === 0) {
      setBuilderError("At least one step is required.");
      return;
    }

    try {
      const steps = builderSteps.map((s, i) => {
        const mitreId = s.mitre.trim().toUpperCase() || "T1566";
        const eventId = s.event.trim() || "none";
        
        // Validate MITRE
        if (!MITRE_DB.some(m => m.id.toUpperCase() === mitreId)) {
           throw new Error(`Step ${i+1}: MITRE ID '${mitreId}' not found in database.`);
        }
        
        // Validate Event
        let eventExists = false;
        if (eventId.toLowerCase() === "none" || eventId.toLowerCase() === "no event") {
          eventExists = true;
        } else if (builderPlatform === "Windows") {
          eventExists = WIN_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
        } else {
          eventExists = LINUX_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
        }
        
        if (!eventExists) {
          throw new Error(`Step ${i+1}: Event ID '${eventId}' not found in ${builderPlatform} database.`);
        }

        return {
          id: `step-${i+1}`,
          description: s.desc.trim() || "Step",
          requiredMitreId: mitreId,
          requiredEventId: eventId
        };
      });

      const sc = {
        id: "custom-" + Date.now(),
        title: builderTitle.trim(),
        description: builderDesc.trim() || "A custom incident response scenario created by a user.",
        platform: builderPlatform,
        steps: steps
      };
      const b64 = btoa(JSON.stringify(sc));
      const url = `${window.location.origin}${window.location.pathname}?s=${b64}`;
      setShareLink(url);
    } catch (err: any) {
      setBuilderError(err.message);
    }
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, tile: Tile, sourceLoc: "pool" | "step", stepId?: string, stepSlotType?: TileType) => {
    if (isHardMode) return;
    e.dataTransfer.setData("application/json", JSON.stringify({ tile, sourceLoc, stepId, stepSlotType }));
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { if (!isHardMode) e.preventDefault(); };
  const handleDropToSlot = (e: React.DragEvent, targetStepId: string, targetSlotType: TileType) => {
    if (isHardMode) return;
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const { tile, sourceLoc, stepId: sourceStepId, stepSlotType: sourceSlotType } = data;
      if (tile.type !== targetSlotType) return;

      const newMapping = { ...mapping };
      const newPool = [...pool];
      const existingTileInTarget = newMapping[targetStepId][targetSlotType];
      
      if (sourceLoc === "pool") {
        const idx = newPool.findIndex(t => t.id === tile.id);
        if (idx > -1) newPool.splice(idx, 1);
      } else if (sourceLoc === "step" && sourceStepId && sourceSlotType) {
        newMapping[sourceStepId][sourceSlotType as TileType] = null;
      }
      if (existingTileInTarget) newPool.push(existingTileInTarget);
      
      newMapping[targetStepId][targetSlotType] = tile;
      setMapping(newMapping);
      setPool(newPool);
      setValidation({ isChecked: false, results: {} }); 
    } catch (err) {}
  };
  const handleDropToPool = (e: React.DragEvent) => {
    if (isHardMode) return;
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.sourceLoc === "step" && data.stepId && data.stepSlotType) {
        const newMapping = { ...mapping };
        newMapping[data.stepId][data.stepSlotType as TileType] = null;
        setMapping(newMapping);
        setPool([...pool, data.tile]);
        setValidation({ isChecked: false, results: {} });
      }
    } catch (err) {}
  };

  const handleTextChange = (stepId: string, type: "textMitre" | "textEvent", value: string) => {
    const newMapping = { ...mapping };
    newMapping[stepId][type] = value;
    setMapping(newMapping);
    setValidation({ isChecked: false, results: {} });
  };

  const validate = () => {
    if (!scenario) return;
    const results: Record<string, { mitre: boolean, event: boolean }> = {};
    scenario.steps.forEach(step => {
      const state = mapping[step.id];
      let isMitreCorrect = false;
      let isEventCorrect = false;
      if (isHardMode) {
        isMitreCorrect = state.textMitre.trim().toLowerCase() === step.requiredMitreId.toLowerCase();
        isEventCorrect = state.textEvent.trim().toLowerCase() === step.requiredEventId.toLowerCase();
      } else {
        isMitreCorrect = state.mitre?.id.toLowerCase() === step.requiredMitreId.toLowerCase();
        isEventCorrect = state.event?.id.toLowerCase() === step.requiredEventId.toLowerCase();
      }
      results[step.id] = { mitre: isMitreCorrect, event: isEventCorrect };
    });
    setValidation({ isChecked: true, results });
  };

  // --- Modal Openers ---
  const openInfoModalMitre = (mitreId: string) => {
    const info = MITRE_DB.find(m => m.id.toUpperCase() === mitreId.toUpperCase());
    if (info) setInfoModalData({ type: "mitre", data: info });
  };
  
  const openInfoModalEvent = (eventId: string) => {
    if (!scenario) return;
    if (scenario.platform === "Windows") {
      const info = WIN_EVENTS_DB.find(e => e.id.toLowerCase() === eventId.toLowerCase());
      if (info) setInfoModalData({ type: "windows", data: info });
    } else {
      const info = LINUX_EVENTS_DB.find(e => e.id.toLowerCase() === eventId.toLowerCase());
      if (info) setInfoModalData({ type: "linux", data: info });
    }
  };

  if (!scenario) return null;

  return (
    <ToolLayout
      title="MITRE ATT&CK Simulator"
      description="Interactive Incident Response generator. Map real attack scenarios to MITRE techniques and Windows/Linux Event telemetry."
    >
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 border border-[#1a1a1a] bg-[#050505]">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[#00ff9c] font-bold uppercase tracking-widest text-sm flex items-center gap-2">
              {scenario.platform === "Windows" ? <Monitor className="w-4 h-4 text-blue-400" /> : <TerminalSquare className="w-4 h-4 text-orange-400" />}
              {scenario.title}
            </h2>
            {sharedScenarioBase64 && <span className="bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Custom Seed</span>}
          </div>
          <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed mt-2"><strong className="text-zinc-300">Environment: {scenario.platform || "Unknown"}</strong> — {scenario.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Button onClick={() => setIsBuilderOpen(!isBuilderOpen)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 font-mono text-xs h-9">
            <Plus className="w-3 h-3 mr-2" /> Custom Scenario
          </Button>
          <div className="flex items-center space-x-2 border-l border-[#1a1a1a] pl-4">
            <Switch id="hard-mode" checked={isHardMode} onCheckedChange={toggleHardMode} />
            <Label htmlFor="hard-mode" className={`font-bold font-mono text-xs uppercase tracking-widest flex items-center gap-1 ${isHardMode ? 'text-red-500' : 'text-zinc-500'}`}>
              <Skull className="w-3 h-3" /> Hard Mode
            </Label>
          </div>
          <Button onClick={handleGenerateProcedural} variant="outline" className="border-[#00ff9c]/50 text-[#00ff9c] hover:bg-[#00ff9c]/10 h-9 font-mono text-xs ml-2">
            <Shuffle className="w-3 h-3 mr-2" /> Random Incident
          </Button>
        </div>
      </div>

      {/* Builder Modal */}
      {isBuilderOpen && (
        <div className="mb-6 border border-purple-500/30 bg-[#050505] p-6 relative">
          <button onClick={() => setIsBuilderOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
          <h3 className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-4">Create & Share Custom Scenario</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500">Scenario Title</label>
              <input type="text" value={builderTitle} onChange={(e)=>setBuilderTitle(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-xs text-zinc-300 focus:border-purple-500 outline-none mt-1" placeholder="My APT29 Simulation" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500">Platform OS</label>
              <select value={builderPlatform} onChange={(e)=>setBuilderPlatform(e.target.value as "Windows" | "Linux")} className="w-full bg-black border border-[#1a1a1a] p-2 text-xs text-zinc-300 focus:border-purple-500 outline-none mt-1">
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500">Description</label>
              <input type="text" value={builderDesc} onChange={(e)=>setBuilderDesc(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-xs text-zinc-300 focus:border-purple-500 outline-none mt-1" placeholder="Brief backstory of the attack..." />
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 border-b border-[#1a1a1a] pb-1">Attack Steps</h4>
            {builderSteps.map((step, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 border border-[#1a1a1a] bg-black">
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-500">Narrative Step {i+1}</label>
                  <input type="text" value={step.desc} onChange={(e) => { const n = [...builderSteps]; n[i].desc = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs text-zinc-300 focus:border-purple-500 outline-none" placeholder="Attacker does X..." />
                </div>
                <div className="w-48 shrink-0 relative">
                  <label className="text-[10px] text-zinc-500">MITRE ID</label>
                  <input type="text" value={step.mitre} onFocus={() => setFocusedField({index: i, type: "mitre"})} onBlur={() => setTimeout(() => setFocusedField(null), 200)} onChange={(e) => { const n = [...builderSteps]; n[i].mitre = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs font-mono text-[#00ff9c] focus:border-purple-500 outline-none" placeholder="T1566" />
                  {focusedField?.index === i && focusedField?.type === "mitre" && step.mitre && (
                    <div className="absolute z-10 w-[300px] left-0 bg-black border border-purple-500/50 mt-1 max-h-48 overflow-y-auto shadow-2xl divide-y divide-[#1a1a1a]">
                      {MITRE_DB.filter(m => m.id.toLowerCase().includes(step.mitre.toLowerCase()) || m.name.toLowerCase().includes(step.mitre.toLowerCase())).slice(0, 10).map(s => (
                        <div key={s.id} className="p-2 text-[10px] hover:bg-purple-500/20 cursor-pointer" onClick={() => { const n = [...builderSteps]; n[i].mitre = s.id; setBuilderSteps(n); setFocusedField(null); }}>
                          <span className="font-bold text-[#00ff9c]">{s.id}</span> - {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-48 shrink-0 relative">
                  <label className="text-[10px] text-zinc-500">Telemetry ID</label>
                  <input type="text" value={step.event} onFocus={() => setFocusedField({index: i, type: "event"})} onBlur={() => setTimeout(() => setFocusedField(null), 200)} onChange={(e) => { const n = [...builderSteps]; n[i].event = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs font-mono text-blue-400 focus:border-purple-500 outline-none" placeholder="Sysmon 1 / auditd" />
                  {focusedField?.index === i && focusedField?.type === "event" && step.event && (
                    <div className="absolute z-10 w-[300px] right-0 sm:left-0 bg-black border border-purple-500/50 mt-1 max-h-48 overflow-y-auto shadow-2xl divide-y divide-[#1a1a1a]">
                      {(builderPlatform === "Windows" ? WIN_EVENTS_DB : LINUX_EVENTS_DB).filter(e => e.id.toLowerCase().includes(step.event.toLowerCase()) || e.name.toLowerCase().includes(step.event.toLowerCase())).slice(0, 10).map(s => (
                        <div key={s.id} className="p-2 text-[10px] hover:bg-purple-500/20 cursor-pointer" onClick={() => { const n = [...builderSteps]; n[i].event = s.id; setBuilderSteps(n); setFocusedField(null); }}>
                          <span className="font-bold text-blue-400">{s.id}</span> - {s.name}
                        </div>
                      ))}
                      <div className="p-2 text-[10px] hover:bg-purple-500/20 cursor-pointer text-zinc-400" onClick={() => { const n = [...builderSteps]; n[i].event = "none"; setBuilderSteps(n); setFocusedField(null); }}>
                        <span className="font-bold">none</span> - No Telemetry
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button onClick={handleAddBuilderStep} variant="ghost" className="text-zinc-500 hover:text-white text-xs"><Plus className="w-3 h-3 mr-1" /> Add Step</Button>
          </div>

          <div className="pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button onClick={handleBuilderGenerateLink} className="bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-xs h-10 shrink-0">
              <Share2 className="w-4 h-4 mr-2" /> Generate Shareable Link
            </Button>
            {builderError && <p className="text-red-500 text-xs font-bold">{builderError}</p>}
            {shareLink && (
              <div className="flex-1 flex w-full border border-purple-500/50 bg-black">
                <input type="text" readOnly value={shareLink} className="flex-1 bg-transparent text-zinc-400 text-xs p-2 outline-none font-mono" />
                <button onClick={() => navigator.clipboard.writeText(shareLink)} className="p-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 transition-colors"><Copy className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Modal Renderer */}
      {infoModalData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setInfoModalData(null)}>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 max-w-lg w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setInfoModalData(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded bg-black border border-[#1a1a1a] ${infoModalData.data.color}`}>
                <infoModalData.data.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-lg font-mono ${infoModalData.type === 'mitre' ? 'text-[#00ff9c]' : infoModalData.type === 'windows' ? 'text-blue-400' : 'text-orange-400'}`}>
                  {infoModalData.data.id}
                </h3>
                <p className="text-zinc-400 text-xs uppercase tracking-widest">{infoModalData.data.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              {infoModalData.type === 'mitre' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Tactic</h4>
                    <p className="text-xs text-zinc-300 bg-black border border-[#1a1a1a] p-2 font-mono">{(infoModalData.data as MitreDef).tactic}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Platform</h4>
                    <p className="text-xs text-zinc-300 bg-black border border-[#1a1a1a] p-2 font-mono">{(infoModalData.data as MitreDef).platform}</p>
                  </div>
                </div>
              )}

              {(infoModalData.type === 'windows' || infoModalData.type === 'linux') && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Log Type</h4>
                  <p className="text-xs text-zinc-300 bg-black border border-[#1a1a1a] p-2 font-mono">{(infoModalData.data as WinEventDef | LinuxEventDef).type}</p>
                </div>
              )}

              <div>
                <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Description</h4>
                <p className="text-sm text-zinc-300 leading-relaxed bg-black border border-[#1a1a1a] p-3">{infoModalData.data.description}</p>
              </div>

              {infoModalData.type === 'mitre' && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Example in the Wild</h4>
                  <p className="text-sm text-[#00ff9c] leading-relaxed bg-[#00ff9c]/10 border border-[#00ff9c]/30 p-3 italic">"{(infoModalData.data as MitreDef).example}"</p>
                </div>
              )}

              {(infoModalData.type === 'windows' || infoModalData.type === 'linux') && (
                <>
                  <div className="bg-black border border-[#1a1a1a] p-3 mb-2 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${infoModalData.type === 'windows' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                    <p className="text-zinc-300 text-xs font-mono ml-2">
                      <span className={`${infoModalData.type === 'windows' ? 'text-blue-500' : 'text-orange-500'} font-bold mr-2`}>Useful Fields:</span>
                      {(infoModalData.data as WinEventDef | LinuxEventDef).fields.join(", ")}
                    </p>
                  </div>
                  <div className="bg-red-900/10 border border-red-900/30 p-3 mb-2 relative overflow-hidden">
                    <p className="text-red-400 text-xs font-mono">
                      <span className="font-bold mr-2">Malicious Use:</span>
                      {(infoModalData.data as WinEventDef | LinuxEventDef).maliciousUse}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center mr-1">Related MITRE:</span>
                    {(infoModalData.data as WinEventDef | LinuxEventDef).mitre.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 text-[10px] font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seed Error Modal */}
      {seedError && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSeedError("")}>
          <div className="bg-[#050505] border border-red-500/50 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-500">Seed Invalid</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">{seedError}</p>
            <div className="flex justify-end">
              <Button onClick={() => setSeedError("")} className="bg-red-500/20 text-red-500 hover:bg-red-500/40 border border-red-500/30">
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Core */}
      <div className={`grid grid-cols-1 ${isHardMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 transition-all`}>
        
        {/* Main: Scenario Timeline */}
        <div className={`${isHardMode ? 'lg:col-span-1' : 'lg:col-span-8'} space-y-4 max-w-5xl mx-auto w-full`}>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Attack Timeline</h3>
          
          <div className="space-y-4">
            {scenario.steps.map((step, idx) => {
              const res = validation.results[step.id];
              return (
                <div key={step.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded bg-black border border-[#1a1a1a] flex items-center justify-center font-mono text-[#00ff9c] font-bold text-sm z-10 shrink-0">{idx + 1}</div>
                    {idx < scenario.steps.length - 1 && <div className="w-px h-full bg-[#1a1a1a] -mb-4 mt-2"></div>}
                  </div>

                  <div className={`flex-1 border border-[#1a1a1a] bg-[#050505] p-4 ${validation.isChecked && res?.mitre && res?.event ? 'border-l-4 border-l-[#00ff9c]' : ''} ${validation.isChecked && (!res?.mitre || !res?.event) ? 'border-l-4 border-l-red-500' : ''}`}>
                    <p className="text-zinc-300 text-sm mb-4 leading-relaxed">{step.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* MITRE Area */}
                      {isHardMode ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Shield className="w-3 h-3"/> Mitre ID</label>
                          <input type="text" placeholder="e.g. T1566" value={mapping[step.id].textMitre} onChange={(e) => handleTextChange(step.id, "textMitre", e.target.value)} className={`w-full bg-black border p-3 text-xs font-mono text-[#00ff9c] focus:outline-none transition-colors ${validation.isChecked && !res?.mitre ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-[#1a1a1a] focus:border-[#00ff9c]'}`} />
                        </div>
                      ) : (
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDropToSlot(e, step.id, "mitre")} className={`min-h-[60px] border-2 border-dashed flex flex-col items-center justify-center p-2 transition-colors ${mapping[step.id]?.mitre ? 'border-transparent bg-transparent p-0' : 'border-zinc-800 bg-black/50'} ${validation.isChecked && !res?.mitre ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                          {mapping[step.id]?.mitre ? (
                            <div draggable onDragStart={(e) => handleDragStart(e, mapping[step.id].mitre!, "step", step.id, "mitre")} className="w-full bg-[#1a1a1a] border border-[#00ff9c]/50 p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a]">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Shield className="w-4 h-4 text-[#00ff9c] shrink-0" />
                                <span className="text-xs font-mono text-[#00ff9c] truncate">{mapping[step.id].mitre!.label}</span>
                              </div>
                              <button onClick={() => openInfoModalMitre(mapping[step.id].mitre!.id)} className="p-1 hover:bg-[#00ff9c]/20 text-[#00ff9c]/50 hover:text-[#00ff9c] transition-colors rounded shrink-0">
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center flex flex-col items-center gap-1"><Shield className="w-4 h-4 mb-1"/> Drop MITRE Technique</span>
                          )}
                        </div>
                      )}

                      {/* Event Area */}
                      {isHardMode ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Terminal className="w-3 h-3"/> Event / Telemetry</label>
                          <input type="text" placeholder="e.g. Sysmon 1, auditd, auth.log" value={mapping[step.id].textEvent} onChange={(e) => handleTextChange(step.id, "textEvent", e.target.value)} className={`w-full bg-black border p-3 text-xs font-mono text-blue-400 focus:outline-none transition-colors ${validation.isChecked && !res?.event ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-[#1a1a1a] focus:border-blue-400'}`} />
                        </div>
                      ) : (
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDropToSlot(e, step.id, "event")} className={`min-h-[60px] border-2 border-dashed flex flex-col items-center justify-center p-2 transition-colors ${mapping[step.id]?.event ? 'border-transparent bg-transparent p-0' : 'border-zinc-800 bg-black/50'} ${validation.isChecked && !res?.event ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                          {mapping[step.id]?.event ? (
                            <div draggable onDragStart={(e) => handleDragStart(e, mapping[step.id].event!, "step", step.id, "event")} className={`w-full bg-[#1a1a1a] border border-blue-400/50 p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a]`}>
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-xs font-mono text-blue-400 truncate">{mapping[step.id].event!.label}</span>
                              </div>
                              <button onClick={() => openInfoModalEvent(mapping[step.id].event!.id)} className="p-1 hover:bg-blue-400/20 text-blue-400/50 hover:text-blue-400 transition-colors rounded shrink-0">
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center flex flex-col items-center gap-1"><Terminal className="w-4 h-4 mb-1"/> Drop Telemetry</span>
                          )}
                        </div>
                      )}

                    </div>

                    {validation.isChecked && (
                      <div className="mt-3 flex gap-4 text-[10px] uppercase font-bold tracking-widest">
                        {res?.mitre ? <span className="text-[#00ff9c] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> MITRE OK</span> : <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> MITRE WRONG</span>}
                        {res?.event ? <span className="text-[#00ff9c] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> EVENT OK</span> : <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> EVENT WRONG</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6">
            <Button onClick={validate} className="w-full bg-[#00ff9c] text-black hover:bg-[#00cc7d] font-bold uppercase tracking-widest h-12 shadow-[0_0_15px_rgba(0,255,156,0.2)]">
              Verify Incident Report <Play className="w-4 h-4 ml-2 fill-black" />
            </Button>
          </div>
        </div>

        {/* Right: Tile Inventory (Hidden in Hard Mode) */}
        {!isHardMode && (
          <div className="lg:col-span-4">
            <div className="sticky top-24 border border-[#1a1a1a] bg-[#050505] flex flex-col h-[calc(100vh-140px)]" onDragOver={handleDragOver} onDrop={handleDropToPool}>
              <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Tiles</h3>
                  <p className="text-[10px] text-zinc-600 mt-1">Drag tiles to the timeline</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-hints" className="text-[10px] uppercase font-bold text-zinc-500">Hints</Label>
                  <Switch id="show-hints" checked={showHints} onCheckedChange={setShowHints} className="scale-75 origin-right" />
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-[#00ff9c] uppercase tracking-widest mb-3 flex items-center gap-2"><Shield className="w-3 h-3" /> MITRE Techniques</h4>
                  <div className="flex flex-col gap-2">
                    {pool.filter(t => t.type === "mitre").length === 0 && <p className="text-xs text-zinc-600 italic">None available.</p>}
                    {pool.filter(t => t.type === "mitre").map(tile => {
                      const dbInfo = MITRE_DB.find(m => m.id.toUpperCase() === tile.id.toUpperCase());
                      return (
                        <div key={tile.id} draggable onDragStart={(e) => handleDragStart(e, tile, "pool")} className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-[#00ff9c] transition-colors group">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Shield className="w-4 h-4 text-[#00ff9c] shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs font-mono text-zinc-300 leading-tight">{tile.label}</span>
                              {showHints && dbInfo && <span className="text-[9px] text-zinc-500 truncate mt-0.5">{dbInfo.name}</span>}
                            </div>
                          </div>
                          {dbInfo && (
                            <button onClick={() => openInfoModalMitre(tile.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#00ff9c]/20 text-[#00ff9c]/50 hover:text-[#00ff9c] transition-all rounded shrink-0">
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${scenario.platform === 'Windows' ? 'text-blue-400' : 'text-orange-400'}`}>
                    <Terminal className="w-3 h-3" /> {scenario.platform} Telemetry
                  </h4>
                  <div className="flex flex-col gap-2">
                    {pool.filter(t => t.type === "event").length === 0 && <p className="text-xs text-zinc-600 italic">None available.</p>}
                    {pool.filter(t => t.type === "event").map(tile => {
                      const isWin = scenario.platform === "Windows";
                      const dbInfo = isWin ? WIN_EVENTS_DB.find(e => e.id.toLowerCase() === tile.id.toLowerCase()) : LINUX_EVENTS_DB.find(e => e.id.toLowerCase() === tile.id.toLowerCase());
                      const colorHover = isWin ? 'hover:border-blue-400' : 'hover:border-orange-400';
                      const textColor = isWin ? 'text-blue-400' : 'text-orange-400';
                      
                      return (
                        <div key={tile.id} draggable onDragStart={(e) => handleDragStart(e, tile, "pool")} className={`bg-[#0a0a0a] border border-[#1a1a1a] p-3 flex items-center justify-between cursor-grab active:cursor-grabbing ${colorHover} transition-colors group`}>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Terminal className={`w-4 h-4 ${textColor} shrink-0`} />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-mono text-zinc-300 leading-tight">{tile.label}</span>
                              {showHints && dbInfo && <span className="text-[9px] text-zinc-500 truncate mt-0.5">{dbInfo.name}</span>}
                            </div>
                          </div>
                          {dbInfo && (
                            <button onClick={() => openInfoModalEvent(tile.id)} className={`p-1 opacity-0 group-hover:opacity-100 hover:bg-black text-zinc-600 hover:${textColor} transition-all rounded shrink-0`}>
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
