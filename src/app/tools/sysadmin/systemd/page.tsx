"use client";

import { Suspense, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Terminal, Settings, Copy, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function SystemdGeneratorContent() {
  const [serviceName, setServiceName] = useState("my-app");
  const [description, setDescription] = useState("My Custom Node.js App");
  const [execStart, setExecStart] = useState("/usr/bin/node /opt/myapp/server.js");
  const [workingDir, setWorkingDir] = useState("/opt/myapp");
  const [user, setUser] = useState("nobody");
  const [restart, setRestart] = useState("on-failure");
  const [restartSec, setRestartSec] = useState("5");

  const [envVars, setEnvVars] = useState<{ id: string; key: string; val: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const generateService = () => {
    let out = `[Unit]\nDescription=${description || serviceName}\nAfter=network.target\n\n`;
    out += `[Service]\nType=simple\n`;
    if (user) out += `User=${user}\n`;
    if (workingDir) out += `WorkingDirectory=${workingDir}\n`;
    if (execStart) out += `ExecStart=${execStart}\n`;
    
    out += `Restart=${restart}\n`;
    if (restart !== "no") {
      out += `RestartSec=${restartSec}\n`;
    }

    if (envVars.length > 0) {
      out += "\n";
      envVars.forEach(env => {
        if (env.key) out += `Environment="${env.key}=${env.val}"\n`;
      });
    }

    out += `\n[Install]\nWantedBy=multi-user.target`;
    return out;
  };

  const code = generateService();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addEnv = () => {
    setEnvVars([...envVars, { id: crypto.randomUUID(), key: "", val: "" }]);
  };

  const updateEnv = (id: string, field: "key" | "val", val: string) => {
    setEnvVars(envVars.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const removeEnv = (id: string) => {
    setEnvVars(envVars.filter(e => e.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
      
      {/* Controls */}
      <div className="lg:col-span-6 space-y-6">
        <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Unit & Service Config
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Service Name</label>
                <div className="flex">
                  <input 
                    type="text" 
                    value={serviceName} 
                    onChange={(e) => setServiceName(e.target.value)} 
                    className="w-full bg-black border border-[#1a1a1a] border-r-0 p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none"
                    placeholder="my-app"
                  />
                  <span className="bg-[#1a1a1a] text-zinc-500 font-mono text-sm px-3 flex items-center">.service</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">ExecStart (Command)</label>
              <input 
                type="text" 
                value={execStart} 
                onChange={(e) => setExecStart(e.target.value)} 
                className="w-full bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono focus:border-[#00ff9c] focus:outline-none"
                placeholder="/usr/bin/node /app/server.js"
              />
              <p className="text-[10px] text-zinc-600 font-mono">Use absolute paths for executables.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">User</label>
                <input 
                  type="text" 
                  value={user} 
                  onChange={(e) => setUser(e.target.value)} 
                  className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Working Directory</label>
                <input 
                  type="text" 
                  value={workingDir} 
                  onChange={(e) => setWorkingDir(e.target.value)} 
                  className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Restart Policy</label>
                <select 
                  value={restart} 
                  onChange={(e) => setRestart(e.target.value)} 
                  className="w-full bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                >
                  <option value="no">no (Never)</option>
                  <option value="on-failure">on-failure (Exit code != 0)</option>
                  <option value="always">always (Any exit)</option>
                  <option value="unless-stopped">unless-stopped</option>
                </select>
              </div>
              {restart !== "no" && (
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400">RestartSec (Delay)</label>
                  <div className="flex">
                    <input 
                      type="number" 
                      value={restartSec} 
                      onChange={(e) => setRestartSec(e.target.value)} 
                      className="w-full bg-black border border-[#1a1a1a] border-r-0 p-2 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                    />
                    <span className="bg-[#1a1a1a] text-zinc-500 font-mono text-xs px-3 flex items-center">sec</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                Environment Variables
              </h3>
              <Button onClick={addEnv} size="sm" className="h-7 text-xs bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 hover:bg-[#00ff9c]/20">
                <Plus className="w-3 h-3 mr-1" /> Add Env
              </Button>
            </div>
            
            <div className="space-y-2">
              {envVars.length === 0 ? (
                <div className="text-center p-4 text-zinc-600 font-mono text-xs border border-dashed border-[#1a1a1a]">
                  No environment variables defined.
                </div>
              ) : (
                envVars.map((env) => (
                  <div key={env.id} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="KEY" 
                      value={env.key} 
                      onChange={(e) => updateEnv(env.id, "key", e.target.value)} 
                      className="flex-1 bg-black border border-[#1a1a1a] p-2 text-[#00ff9c] font-mono text-sm focus:border-[#00ff9c] focus:outline-none"
                    />
                    <span className="text-zinc-600 self-center">=</span>
                    <input 
                      type="text" 
                      placeholder="value" 
                      value={env.val} 
                      onChange={(e) => updateEnv(env.id, "val", e.target.value)} 
                      className="flex-1 bg-black border border-[#1a1a1a] p-2 text-zinc-300 font-mono text-sm focus:border-[#00ff9c] focus:outline-none"
                    />
                    <button onClick={() => removeEnv(env.id)} className="text-zinc-600 hover:text-red-500 px-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="border border-[#1a1a1a] bg-[#050505] flex flex-col flex-1 h-full">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-400 text-xs font-mono">/etc/systemd/system/{serviceName || "service"}.service</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-zinc-500 hover:text-[#00ff9c] transition-colors flex items-center gap-1 text-xs uppercase tracking-wider font-bold"
            >
              {copied ? <><Check className="w-3 h-3"/> Copied</> : <><Copy className="w-3 h-3"/> Copy</>}
            </button>
          </header>
          
          <pre className="p-4 text-[#00ff9c] font-mono text-sm overflow-x-auto whitespace-pre-wrap flex-1">
            {code}
          </pre>
        </div>
        
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 text-zinc-400">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Installation Commands</span>
          <code className="text-xs font-mono block mb-1 text-zinc-300">sudo nano /etc/systemd/system/{serviceName || "app"}.service</code>
          <code className="text-xs font-mono block mb-1 text-zinc-300">sudo systemctl daemon-reload</code>
          <code className="text-xs font-mono block mb-1 text-zinc-300">sudo systemctl enable --now {serviceName || "app"}</code>
        </div>
      </div>

    </div>
  );
}

export default function SystemdGeneratorTool() {
  return (
    <ToolLayout
      title="Systemd Service Generator"
      description="Visually construct a Linux systemd .service file to easily daemonize your scripts, apps, and containers."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <SystemdGeneratorContent />
      </Suspense>
    </ToolLayout>
  );
}
