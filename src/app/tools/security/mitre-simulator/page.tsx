"use client";

import { useState, useEffect, Suspense } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Play, Shield, Terminal, RefreshCw, CheckCircle2, XCircle, Skull, Shuffle, Plus, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";

// --- Types ---
type TileType = "mitre" | "event";

type Tile = { id: string; type: TileType; label: string; };

type ScenarioStep = { id: string; description: string; requiredMitreId: string; requiredEventId: string; };

type Scenario = {
  id: string;
  title: string;
  description: string;
  steps: ScenarioStep[];
  pool?: Tile[]; 
};

// --- Helper Functions ---
const T = (id: string, label: string): Tile => ({ id, type: "mitre", label });
const E = (id: string, label: string): Tile => ({ id, type: "event", label });

// --- Procedural Generation Engine ---
const VECTORS = [
  {
    name: "Phishing & Ransomware",
    desc: "A client-side compromise starting with a phishing email and ending in massive data encryption.",
    phases: [
      [
        { desc: "Attacker sends an email with a malicious macro-enabled Word document.", mitre: "T1566", event: "none" },
        { desc: "Victim receives a spearphishing link pointing to a fake login portal.", mitre: "T1566", event: "Sysmon 22" },
      ],
      [
        { desc: "The macro executes an obfuscated PowerShell script in the background.", mitre: "T1059", event: "Sysmon 1" },
        { desc: "The user downloads a disguised executable and double-clicks it.", mitre: "T1204", event: "Sysmon 1" },
      ],
      [
        { desc: "Malware dumps LSASS memory using a custom procdump technique.", mitre: "T1003", event: "Sysmon 10" },
        { desc: "Malware searches local browser databases for saved passwords.", mitre: "T1555", event: "Sysmon 1" },
      ],
      [
        { desc: "The malware encrypts all user documents and drops a ransom note.", mitre: "T1486", event: "Sysmon 11" },
        { desc: "Malware disables Windows Defender via PowerShell cmdlets.", mitre: "T1562", event: "Sysmon 1" },
      ]
    ]
  },
  {
    name: "Web Exploitation to Data Theft",
    desc: "An attacker exploits a vulnerability on a public-facing web server to steal sensitive databases.",
    phases: [
      [
        { desc: "Attacker exploits an RCE vulnerability (e.g. Log4Shell) on the public Apache server.", mitre: "T1190", event: "none" },
        { desc: "Attacker performs SQL Injection on the main login form.", mitre: "T1190", event: "none" },
      ],
      [
        { desc: "A PHP web shell is written to the /var/www/html/uploads directory.", mitre: "T1505", event: "Sysmon 11" },
        { desc: "The attacker drops a Cobalt Strike beacon onto the disk.", mitre: "T1105", event: "Sysmon 11" },
      ],
      [
        { desc: "The attacker discovers local network segments using arp.", mitre: "T1016", event: "Sysmon 1" },
        { desc: "The attacker dumps local /etc/shadow or SAM registry hive.", mitre: "T1003", event: "Sysmon 1" },
      ],
      [
        { desc: "Attacker compresses the company database into a password-protected zip.", mitre: "T1560", event: "Sysmon 11" },
        { desc: "The stolen data is exfiltrated to an external MEGA cloud account.", mitre: "T1567", event: "Sysmon 3" },
      ]
    ]
  },
  {
    name: "The Insider Threat",
    desc: "A disgruntled employee abuses valid credentials to destroy company data and hide their tracks.",
    phases: [
      [
        { desc: "Employee logs into an internal file server via RDP using their valid domain account.", mitre: "T1078", event: "4624" },
        { desc: "Employee connects to the corporate VPN outside of working hours.", mitre: "T1078", event: "4624" },
      ],
      [
        { desc: "Employee accesses the sensitive 'HR_Confidential' network share.", mitre: "T1021", event: "5140" },
        { desc: "Employee maps the C$ admin share of the Domain Controller.", mitre: "T1021", event: "5140" },
      ],
      [
        { desc: "Employee uses wevtutil to completely clear the Windows Security Event logs.", mitre: "T1070", event: "1102" },
        { desc: "Employee deletes their own bash history to prevent auditing.", mitre: "T1070", event: "none" },
      ],
      [
        { desc: "Employee permanently deletes the primary financial databases.", mitre: "T1485", event: "Sysmon 23" },
        { desc: "Employee changes the passwords of critical service accounts.", mitre: "T1098", event: "4724" },
      ]
    ]
  },
  {
    name: "Supply Chain & Persistence",
    desc: "A trusted vendor update introduces a backdoor that establishes deep persistence on the system.",
    phases: [
      [
        { desc: "Victim installs a digitally signed but backdoored update of a popular tool.", mitre: "T1195", event: "none" },
        { desc: "A developer installs a malicious npm package via typo-squatting.", mitre: "T1195", event: "none" },
      ],
      [
        { desc: "The backdoor reaches out to a C2 server to download a secondary payload.", mitre: "T1105", event: "Sysmon 3" },
        { desc: "The backdoor establishes a beacon encapsulated in DNS queries.", mitre: "T1071", event: "Sysmon 22" },
      ],
      [
        { desc: "The payload creates a new Windows Service to ensure it runs on every boot.", mitre: "T1543", event: "7045" },
        { desc: "The malware adds a registry run key for persistence.", mitre: "T1547", event: "Sysmon 13" },
      ],
      [
        { desc: "The service injects a DLL into the legitimate explorer.exe process.", mitre: "T1055", event: "Sysmon 8" },
        { desc: "The malware creates a Scheduled Task to run silently every hour.", mitre: "T1053", event: "4698" },
      ]
    ]
  }
];

const generateProceduralScenario = (): Scenario => {
  const vector = VECTORS[Math.floor(Math.random() * VECTORS.length)];
  const steps: ScenarioStep[] = [];
  const pool: Tile[] = [];

  vector.phases.forEach((phase, idx) => {
    const choice = phase[Math.floor(Math.random() * phase.length)];
    steps.push({
      id: `step-${idx + 1}`,
      description: choice.desc,
      requiredMitreId: choice.mitre,
      requiredEventId: choice.event
    });
    
    // Add correct tiles
    pool.push(T(choice.mitre, `${choice.mitre}`));
    pool.push(E(choice.event, choice.event === "none" ? "No Event / Not Logged" : choice.event));
  });

  // Add some random decoys to make it challenging
  const decoysMitre = ["T1566", "T1059", "T1003", "T1078", "T1505", "T1567", "T1486", "T1070", "T1021", "T1543", "T1055", "T1555", "T1190"];
  const decoysEvent = ["Sysmon 1", "Sysmon 3", "Sysmon 10", "Sysmon 11", "Sysmon 22", "4624", "4625", "4688", "5140", "1102", "7045", "4698"];
  
  for(let i=0; i<3; i++) {
    const rm = decoysMitre[Math.floor(Math.random() * decoysMitre.length)];
    const re = decoysEvent[Math.floor(Math.random() * decoysEvent.length)];
    if (!pool.find(t => t.id === rm)) pool.push(T(rm, `${rm}`));
    if (!pool.find(t => t.id === re)) pool.push(E(re, re));
  }

  return {
    id: "procedural-" + Math.random().toString(36).substring(7),
    title: `Incident: ${vector.name}`,
    description: vector.desc,
    steps,
    pool: pool.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // deduplicate
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
  
  // Custom Scenario Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderSteps, setBuilderSteps] = useState([{ desc: "", mitre: "", event: "" }]);
  const [shareLink, setShareLink] = useState("");

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
        const decoded = JSON.parse(atob(sharedScenarioBase64));
        if (decoded && decoded.title && decoded.steps) {
          // Generate pool for custom scenario
          const customPool: Tile[] = [];
          decoded.steps.forEach((s: any) => {
            customPool.push(T(s.requiredMitreId, s.requiredMitreId));
            customPool.push(E(s.requiredEventId, s.requiredEventId));
          });
          decoded.pool = customPool;
          loadScenario(decoded);
          return;
        }
      } catch (e) {
        console.error("Failed to decode shared scenario", e);
      }
    }
    
    // Default to procedural
    handleGenerateProcedural();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedScenarioBase64]);

  const loadScenario = (sc: Scenario) => {
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

  const handleGenerateProcedural = () => {
    loadScenario(generateProceduralScenario());
  };

  const toggleHardMode = () => {
    setIsHardMode(!isHardMode);
    if (scenario) loadScenario(scenario); // reset when switching modes
  };

  // --- Builder Handlers ---
  const handleAddBuilderStep = () => {
    setBuilderSteps([...builderSteps, { desc: "", mitre: "", event: "" }]);
  };
  const handleBuilderGenerateLink = () => {
    const sc = {
      id: "custom-" + Date.now(),
      title: builderTitle || "Custom Challenge",
      description: builderDesc || "A custom incident response scenario created by a user.",
      steps: builderSteps.map((s, i) => ({
        id: `step-${i+1}`,
        description: s.desc || "Step",
        requiredMitreId: s.mitre.trim().toUpperCase() || "T1566",
        requiredEventId: s.event.trim() || "none"
      }))
    };
    const b64 = btoa(JSON.stringify(sc));
    const url = `${window.location.origin}${window.location.pathname}?s=${b64}`;
    setShareLink(url);
  };

  // --- Drag & Drop Handlers (Normal Mode) ---
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

  if (!scenario) return null;

  return (
    <ToolLayout
      title="MITRE ATT&CK Simulator"
      description="Interactive Incident Response generator. Map real attack scenarios to MITRE techniques and Windows Event IDs."
    >
      
      {/* Top Bar: Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 border border-[#1a1a1a] bg-[#050505]">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[#00ff9c] font-bold uppercase tracking-widest text-sm">{scenario.title}</h2>
            {sharedScenarioBase64 && <span className="bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Custom Seed</span>}
          </div>
          <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">{scenario.description}</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500">Scenario Title</label>
              <input type="text" value={builderTitle} onChange={(e)=>setBuilderTitle(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-xs text-zinc-300 focus:border-purple-500 outline-none mt-1" placeholder="My APT29 Simulation" />
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
                <div className="w-24 shrink-0">
                  <label className="text-[10px] text-zinc-500">MITRE ID</label>
                  <input type="text" value={step.mitre} onChange={(e) => { const n = [...builderSteps]; n[i].mitre = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs font-mono text-[#00ff9c] focus:border-purple-500 outline-none" placeholder="T1566" />
                </div>
                <div className="w-32 shrink-0">
                  <label className="text-[10px] text-zinc-500">Event ID</label>
                  <input type="text" value={step.event} onChange={(e) => { const n = [...builderSteps]; n[i].event = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs font-mono text-blue-400 focus:border-purple-500 outline-none" placeholder="Sysmon 1 / 4624" />
                </div>
              </div>
            ))}
            <Button onClick={handleAddBuilderStep} variant="ghost" className="text-zinc-500 hover:text-white text-xs"><Plus className="w-3 h-3 mr-1" /> Add Step</Button>
          </div>

          <div className="pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row gap-4 items-center">
            <Button onClick={handleBuilderGenerateLink} className="bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-xs h-10">
              <Share2 className="w-4 h-4 mr-2" /> Generate Shareable Link
            </Button>
            {shareLink && (
              <div className="flex-1 flex border border-purple-500/50 bg-black">
                <input type="text" readOnly value={shareLink} className="flex-1 bg-transparent text-zinc-400 text-xs p-2 outline-none font-mono" />
                <button onClick={() => navigator.clipboard.writeText(shareLink)} className="p-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 transition-colors"><Copy className="w-4 h-4" /></button>
              </div>
            )}
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
                            <div draggable onDragStart={(e) => handleDragStart(e, mapping[step.id].mitre!, "step", step.id, "mitre")} className="w-full bg-[#1a1a1a] border border-[#00ff9c]/50 p-3 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a]">
                              <Shield className="w-4 h-4 text-[#00ff9c]" />
                              <span className="text-xs font-mono text-[#00ff9c] truncate">{mapping[step.id].mitre!.label}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center flex flex-col items-center gap-1"><Shield className="w-4 h-4 mb-1"/> Drop MITRE Technique</span>
                          )}
                        </div>
                      )}

                      {/* Event Area */}
                      {isHardMode ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Terminal className="w-3 h-3"/> Event ID</label>
                          <input type="text" placeholder="e.g. 4624, Sysmon 1, none" value={mapping[step.id].textEvent} onChange={(e) => handleTextChange(step.id, "textEvent", e.target.value)} className={`w-full bg-black border p-3 text-xs font-mono text-blue-400 focus:outline-none transition-colors ${validation.isChecked && !res?.event ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-[#1a1a1a] focus:border-blue-400'}`} />
                        </div>
                      ) : (
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDropToSlot(e, step.id, "event")} className={`min-h-[60px] border-2 border-dashed flex flex-col items-center justify-center p-2 transition-colors ${mapping[step.id]?.event ? 'border-transparent bg-transparent p-0' : 'border-zinc-800 bg-black/50'} ${validation.isChecked && !res?.event ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                          {mapping[step.id]?.event ? (
                            <div draggable onDragStart={(e) => handleDragStart(e, mapping[step.id].event!, "step", step.id, "event")} className="w-full bg-[#1a1a1a] border border-blue-400/50 p-3 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a]">
                              <Terminal className="w-4 h-4 text-blue-400" />
                              <span className="text-xs font-mono text-blue-400 truncate">{mapping[step.id].event!.label}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center flex flex-col items-center gap-1"><Terminal className="w-4 h-4 mb-1"/> Drop Event ID</span>
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
              <div className="p-4 border-b border-[#1a1a1a]">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Tiles</h3>
                <p className="text-[10px] text-zinc-600 mt-1">Drag tiles to the timeline</p>
              </div>
              
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-[#00ff9c] uppercase tracking-widest mb-3 flex items-center gap-2"><Shield className="w-3 h-3" /> MITRE Techniques</h4>
                  <div className="flex flex-col gap-2">
                    {pool.filter(t => t.type === "mitre").length === 0 && <p className="text-xs text-zinc-600 italic">None available.</p>}
                    {pool.filter(t => t.type === "mitre").map(tile => (
                      <div key={tile.id} draggable onDragStart={(e) => handleDragStart(e, tile, "pool")} className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:border-[#00ff9c] transition-colors">
                        <Shield className="w-4 h-4 text-[#00ff9c] shrink-0" />
                        <span className="text-xs font-mono text-zinc-300 leading-tight">{tile.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Terminal className="w-3 h-3" /> Windows Event IDs</h4>
                  <div className="flex flex-col gap-2">
                    {pool.filter(t => t.type === "event").length === 0 && <p className="text-xs text-zinc-600 italic">None available.</p>}
                    {pool.filter(t => t.type === "event").map(tile => (
                      <div key={tile.id} draggable onDragStart={(e) => handleDragStart(e, tile, "pool")} className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors">
                        <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-xs font-mono text-zinc-300 leading-tight">{tile.label}</span>
                      </div>
                    ))}
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
