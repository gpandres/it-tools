import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle, CheckSquare, Terminal, Info, GitBranch, ShieldCheck } from "lucide-react";
import { Runbook, RunbookStep, StepType } from "./types";

interface BuilderProps {
  runbook: Runbook;
  onChange: (runbook: Runbook) => void;
}

const STEP_ICONS: Record<StepType, any> = {
  checklist: CheckSquare,
  command: Terminal,
  information: Info,
  decision: GitBranch,
  warning: AlertTriangle,
  verification: ShieldCheck
};

export default function Builder({ runbook, onChange }: BuilderProps) {
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const messageTimer = useRef<number | undefined>(undefined);

  const showDecisionMessage = (message: string) => {
    setDecisionMessage(message);
    if (messageTimer.current !== undefined) window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setDecisionMessage(null), 3600);
  };

  useEffect(() => () => {
    if (messageTimer.current !== undefined) window.clearTimeout(messageTimer.current);
  }, []);
  
  const addStep = (type: StepType) => {
    const newStep: RunbookStep = {
      id: `step-${Date.now()}`,
      type,
      title: `New ${type} step`,
      items: type === 'checklist' ? [''] : undefined
    };
    onChange({ ...runbook, steps: [...runbook.steps, newStep] });
  };

  const updateStep = (id: string, updates: Partial<RunbookStep>) => {
    const currentStep = runbook.steps.find(step => step.id === id);
    const candidate = currentStep ? { ...currentStep, ...updates } : undefined;
    if (candidate?.type === 'decision' && candidate.decisionTrueNext && candidate.decisionTrueNext === candidate.decisionFalseNext) {
      showDecisionMessage('YES and NO cannot point to the same step.');
      return;
    }
    onChange({
      ...runbook,
      steps: runbook.steps.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const updateDecisionTarget = (step: RunbookStep, branch: 'yes' | 'no', value: string | null) => {
    const target = value || undefined;
    const otherTarget = branch === 'yes' ? step.decisionFalseNext : step.decisionTrueNext;
    if (target && target === otherTarget) {
      showDecisionMessage('YES and NO cannot point to the same step.');
      return;
    }
    updateStep(step.id, branch === 'yes' ? { decisionTrueNext: target } : { decisionFalseNext: target });
  };

  const removeStep = (id: string) => {
    onChange({
      ...runbook,
      steps: runbook.steps.filter(s => s.id !== id)
    });
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const newSteps = [...runbook.steps];
    if (index + direction < 0 || index + direction >= newSteps.length) return;
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + direction];
    newSteps[index + direction] = temp;
    onChange({ ...runbook, steps: newSteps });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 bg-[#050505] p-4 border border-[#1a1a1a] rounded-none">
        <div>
          <Label className="mb-2 block uppercase tracking-widest text-xs text-zinc-400">Runbook Title</Label>
          <Input 
            value={runbook.title} 
            onChange={(e) => onChange({ ...runbook, title: e.target.value })}
            className="rounded-none bg-black border-[#1a1a1a] text-sm font-bold text-zinc-200 focus-visible:ring-[#00ff9c]"
          />
        </div>
        <div>
          <Label className="mb-2 block uppercase tracking-widest text-xs text-zinc-400">Description</Label>
          <Textarea 
            value={runbook.description} 
            onChange={(e) => onChange({ ...runbook, description: e.target.value })}
            className="rounded-none bg-black border-[#1a1a1a] text-sm text-zinc-300 focus-visible:ring-[#00ff9c]"
          />
        </div>
        
        <div>
          <Label className="flex justify-between items-center mb-2 uppercase tracking-widest text-xs text-zinc-400">
            <span>Variables</span>
            <Button size="sm" variant="outline" className="h-7 px-3 rounded-none bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-white" onClick={() => {
              onChange({
                ...runbook,
                variables: [...runbook.variables, { name: 'NEW_VAR', description: '' }]
              })
            }}>
              <Plus className="w-3 h-3 mr-1" /> Add Variable
            </Button>
          </Label>
          {runbook.variables.length === 0 ? (
            <p className="text-xs text-zinc-500">No variables defined. Use {'{{VAR_NAME}}'} in your steps.</p>
          ) : (
            <div className="space-y-2">
              {runbook.variables.map((v, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input 
                    value={v.name} 
                    onChange={(e) => {
                      const newVars = [...runbook.variables];
                      newVars[i].name = e.target.value.toUpperCase();
                      onChange({ ...runbook, variables: newVars });
                    }}
                    placeholder="NAME"
                    className="w-1/4 rounded-none bg-black border-[#1a1a1a] font-mono text-xs focus-visible:ring-[#00ff9c]"
                  />
                  <Input 
                    value={v.description} 
                    onChange={(e) => {
                      const newVars = [...runbook.variables];
                      newVars[i].description = e.target.value;
                      onChange({ ...runbook, variables: newVars });
                    }}
                    placeholder="Description"
                    className="flex-1 rounded-none bg-black border-[#1a1a1a] text-xs focus-visible:ring-[#00ff9c]"
                  />
                  <Input 
                    value={v.defaultValue || ''} 
                    onChange={(e) => {
                      const newVars = [...runbook.variables];
                      newVars[i].defaultValue = e.target.value;
                      onChange({ ...runbook, variables: newVars });
                    }}
                    placeholder="Default Value"
                    className="w-1/4 rounded-none bg-black border-[#1a1a1a] text-xs focus-visible:ring-[#00ff9c]"
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                    const newVars = [...runbook.variables];
                    newVars.splice(i, 1);
                    onChange({ ...runbook, variables: newVars });
                  }} className="rounded-none text-zinc-500 hover:text-red-500 hover:bg-[#1a1a1a]">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
          <h3 className="font-bold text-sm uppercase tracking-widest text-[#ffb000]">Steps ({runbook.steps.length})</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STEP_ICONS) as StepType[]).map(type => {
              const Icon = STEP_ICONS[type];
              return (
                <Button key={type} size="sm" variant="outline" className="h-8 rounded-none bg-black border-[#1a1a1a] hover:border-[#00ff9c] hover:bg-[#00ff9c]/10 hover:text-[#00ff9c] text-xs font-bold uppercase tracking-widest text-zinc-400" onClick={() => addStep(type)}>
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  <span>{type}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {runbook.steps.length === 0 ? (
          <div className="p-8 text-center text-xs uppercase tracking-widest text-zinc-500 border border-dashed border-[#2a2a2a] rounded-none">
            No steps defined. Add a step using the buttons above.
          </div>
        ) : (
          <div className="space-y-4">
            {runbook.steps.map((step, index) => {
              const Icon = STEP_ICONS[step.type];
              return (
                <div key={step.id} className="flex gap-3 bg-[#050505] p-4 border border-[#1a1a1a] rounded-none relative group">
                  
                  <div className="flex flex-col items-center justify-start gap-2 pt-2 text-zinc-500">
                    <button onClick={() => moveStep(index, -1)} disabled={index === 0} className="hover:text-white disabled:opacity-30">▲</button>
                    <Icon className="w-5 h-5 text-zinc-400" />
                    <button onClick={() => moveStep(index, 1)} disabled={index === runbook.steps.length - 1} className="hover:text-white disabled:opacity-30">▼</button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-mono text-zinc-500">#{index + 1}</span>
                        <Input 
                          value={step.title}
                          onChange={(e) => updateStep(step.id, { title: e.target.value })}
                          className="bg-transparent border-0 font-bold px-1 h-auto py-1 focus-visible:ring-0 text-md text-[#00ff9c] rounded-none focus-visible:bg-[#00ff9c]/10"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="rounded-none text-zinc-500 hover:text-red-500 hover:bg-[#1a1a1a] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-xs font-mono text-zinc-600 mb-2">ID: {step.id}</div>

                    {(step.type === 'information' || step.type === 'warning' || step.type === 'verification' || step.type === 'command') && (
                      <div>
                        <Label className="text-xs text-zinc-400 uppercase tracking-widest block mb-2">Description / Content</Label>
                        <Textarea 
                          value={step.type === 'command' ? step.description : step.content}
                          onChange={(e) => updateStep(step.id, step.type === 'command' ? { description: e.target.value } : { content: e.target.value })}
                          className="rounded-none bg-black border-[#1a1a1a] text-sm text-zinc-300 focus-visible:ring-[#00ff9c] min-h-[60px]"
                          placeholder="Markdown supported..."
                        />
                      </div>
                    )}

                    {step.type === 'command' && (
                      <div>
                        <Label className="text-xs text-zinc-400 uppercase tracking-widest block mb-2">Command</Label>
                        <Textarea 
                          value={step.command}
                          onChange={(e) => updateStep(step.id, { command: e.target.value })}
                          className="rounded-none bg-black border-[#1a1a1a] font-mono text-[#00ff9c] text-sm focus-visible:ring-[#00ff9c] min-h-[60px]"
                          placeholder="e.g. ping {{TARGET_HOST}}"
                        />
                      </div>
                    )}

                    {(step.type === 'command' || step.type === 'verification') && (
                      <div>
                        <Label className="text-xs text-zinc-400 uppercase tracking-widest block mb-2">Expected Result</Label>
                        <Input 
                          value={step.expectedResult || ''}
                          onChange={(e) => updateStep(step.id, { expectedResult: e.target.value })}
                          className="rounded-none bg-black border-[#1a1a1a] text-sm text-zinc-300 focus-visible:ring-[#00ff9c]"
                          placeholder="e.g. 0% packet loss"
                        />
                      </div>
                    )}

                    {step.type === 'decision' && (
                      <div className="space-y-4 bg-[#0a0a0a] p-4 border border-[#1a1a1a] rounded-none">
                        <div>
                          <Label className="text-xs text-zinc-400 uppercase tracking-widest block mb-2">Decision Question</Label>
                          <Input 
                            value={step.decisionQuestion || ''}
                            onChange={(e) => updateStep(step.id, { decisionQuestion: e.target.value })}
                            className="rounded-none bg-black border-[#1a1a1a] text-sm text-zinc-300 focus-visible:ring-[#00ff9c]"
                            placeholder="e.g. Did the ping succeed?"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-[#00ff9c] block mb-2">If YES, jump to Step ID:</Label>
                            <Select value={step.decisionTrueNext || ''} onValueChange={(v) => updateDecisionTarget(step, 'yes', v)}>
                              <SelectTrigger className="rounded-none bg-black border-[#1a1a1a] text-sm focus:ring-[#00ff9c]">
                                <SelectValue placeholder="Select step..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-none bg-black border-[#1a1a1a]">
                                {runbook.steps.filter(s => s.id !== step.id).map(s => (
                                  <SelectItem key={s.id} value={s.id} className="focus:bg-[#1a1a1a]">{s.title} ({s.id})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-red-500 block mb-2">If NO, jump to Step ID:</Label>
                            <Select value={step.decisionFalseNext || ''} onValueChange={(v) => updateDecisionTarget(step, 'no', v)}>
                              <SelectTrigger className="rounded-none bg-black border-[#1a1a1a] text-sm focus:ring-[#00ff9c]">
                                <SelectValue placeholder="Select step..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-none bg-black border-[#1a1a1a]">
                                {runbook.steps.filter(s => s.id !== step.id).map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.title} ({s.id})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {decisionMessage && <p role="status" aria-live="polite" className="border border-[#6b4a00] bg-[#120e04] px-2 py-1.5 text-xs text-[#ffcc66]">{decisionMessage}</p>}
                      </div>
                    )}

                    {step.type === 'checklist' && (
                      <div>
                         <Label className="mb-3 block text-xs uppercase tracking-widest text-zinc-400">Checklist Items</Label>
                         <div className="space-y-3">
                          {(step.items || []).map((item, itemIdx) => (
                             <div key={itemIdx} className="flex min-w-0 items-center gap-3">
                              <Input 
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...(step.items || [])];
                                  newItems[itemIdx] = e.target.value;
                                  updateStep(step.id, { items: newItems });
                                }}
                                 className="min-w-0 flex-1 rounded-none bg-black border-[#1a1a1a] text-sm text-zinc-300 focus-visible:ring-[#00ff9c]"
                                placeholder="Item description..."
                              />
                              <Button variant="ghost" size="icon" onClick={() => {
                                const newItems = [...(step.items || [])];
                                newItems.splice(itemIdx, 1);
                                updateStep(step.id, { items: newItems });
                              }} className="rounded-none text-zinc-500 hover:text-red-500 hover:bg-[#1a1a1a] h-10 w-10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" className="h-8 rounded-none bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-white" onClick={() => {
                            updateStep(step.id, { items: [...(step.items || []), ''] });
                          }}>
                            <Plus className="w-3 h-3 mr-1" /> Add Item
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
