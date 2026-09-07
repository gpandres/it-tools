import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, AlertTriangle, CheckSquare, Terminal, Info, GitBranch, ShieldCheck } from "lucide-react";
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
    onChange({
      ...runbook,
      steps: runbook.steps.map(s => s.id === id ? { ...s, ...updates } : s)
    });
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
      <div className="grid gap-4 bg-[#0a0a0a] p-4 border border-[#1a1a1a] rounded-lg">
        <div>
          <Label>Runbook Title</Label>
          <Input 
            value={runbook.title} 
            onChange={(e) => onChange({ ...runbook, title: e.target.value })}
            className="bg-black border-[#1a1a1a] text-lg font-bold"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea 
            value={runbook.description} 
            onChange={(e) => onChange({ ...runbook, description: e.target.value })}
            className="bg-black border-[#1a1a1a]"
          />
        </div>
        
        <div>
          <Label className="flex justify-between items-center mb-2">
            <span>Variables</span>
            <Button size="sm" variant="outline" className="h-6 px-2 bg-[#1a1a1a] border-0" onClick={() => {
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
                    className="w-1/4 bg-black border-[#1a1a1a] font-mono text-xs"
                  />
                  <Input 
                    value={v.description} 
                    onChange={(e) => {
                      const newVars = [...runbook.variables];
                      newVars[i].description = e.target.value;
                      onChange({ ...runbook, variables: newVars });
                    }}
                    placeholder="Description"
                    className="flex-1 bg-black border-[#1a1a1a] text-xs"
                  />
                  <Input 
                    value={v.defaultValue || ''} 
                    onChange={(e) => {
                      const newVars = [...runbook.variables];
                      newVars[i].defaultValue = e.target.value;
                      onChange({ ...runbook, variables: newVars });
                    }}
                    placeholder="Default Value"
                    className="w-1/4 bg-black border-[#1a1a1a] text-xs"
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                    const newVars = [...runbook.variables];
                    newVars.splice(i, 1);
                    onChange({ ...runbook, variables: newVars });
                  }} className="text-zinc-500 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-zinc-300">Steps ({runbook.steps.length})</h3>
          <div className="flex gap-2">
            {(Object.keys(STEP_ICONS) as StepType[]).map(type => {
              const Icon = STEP_ICONS[type];
              return (
                <Button key={type} size="sm" variant="outline" className="bg-black border-[#1a1a1a]" onClick={() => addStep(type)}>
                  <Icon className="w-4 h-4 mr-1" />
                  <span className="capitalize">{type}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {runbook.steps.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border border-dashed border-[#2a2a2a] rounded-lg">
            No steps defined. Add a step using the buttons above.
          </div>
        ) : (
          <div className="space-y-4">
            {runbook.steps.map((step, index) => {
              const Icon = STEP_ICONS[step.type];
              return (
                <div key={step.id} className="flex gap-3 bg-[#0a0a0a] p-4 border border-[#1a1a1a] rounded-lg relative group">
                  
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
                          className="bg-transparent border-0 font-bold px-1 h-auto py-1 focus-visible:ring-0 text-md text-[#00ff9c]"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-xs font-mono text-zinc-600 mb-2">ID: {step.id}</div>

                    {(step.type === 'information' || step.type === 'warning' || step.type === 'verification' || step.type === 'command') && (
                      <div>
                        <Label className="text-xs text-zinc-400">Description / Content</Label>
                        <Textarea 
                          value={step.type === 'command' ? step.description : step.content}
                          onChange={(e) => updateStep(step.id, step.type === 'command' ? { description: e.target.value } : { content: e.target.value })}
                          className="bg-black border-[#1a1a1a] mt-1 text-xs min-h-[60px]"
                          placeholder="Markdown supported..."
                        />
                      </div>
                    )}

                    {step.type === 'command' && (
                      <div>
                        <Label className="text-xs text-zinc-400">Command</Label>
                        <Textarea 
                          value={step.command}
                          onChange={(e) => updateStep(step.id, { command: e.target.value })}
                          className="bg-zinc-900 border-[#333] font-mono text-[#00ff9c] mt-1 text-xs min-h-[60px]"
                          placeholder="e.g. ping {{TARGET_HOST}}"
                        />
                      </div>
                    )}

                    {(step.type === 'command' || step.type === 'verification') && (
                      <div>
                        <Label className="text-xs text-zinc-400">Expected Result</Label>
                        <Input 
                          value={step.expectedResult || ''}
                          onChange={(e) => updateStep(step.id, { expectedResult: e.target.value })}
                          className="bg-black border-[#1a1a1a] mt-1 text-xs"
                          placeholder="e.g. 0% packet loss"
                        />
                      </div>
                    )}

                    {step.type === 'decision' && (
                      <div className="space-y-3 bg-[#111] p-3 rounded border border-[#222]">
                        <div>
                          <Label className="text-xs text-zinc-400">Decision Question</Label>
                          <Input 
                            value={step.decisionQuestion || ''}
                            onChange={(e) => updateStep(step.id, { decisionQuestion: e.target.value })}
                            className="bg-black border-[#1a1a1a] mt-1 text-xs"
                            placeholder="e.g. Did the ping succeed?"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-[#00ff9c]">If YES, jump to Step ID:</Label>
                            <Select value={step.decisionTrueNext || ''} onValueChange={(v) => updateStep(step.id, { decisionTrueNext: v || undefined })}>
                              <SelectTrigger className="bg-black border-[#1a1a1a] mt-1 text-xs">
                                <SelectValue placeholder="Select step..." />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-[#1a1a1a]">
                                {runbook.steps.filter(s => s.id !== step.id).map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.title} ({s.id})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-red-500">If NO, jump to Step ID:</Label>
                            <Select value={step.decisionFalseNext || ''} onValueChange={(v) => updateStep(step.id, { decisionFalseNext: v || undefined })}>
                              <SelectTrigger className="bg-black border-[#1a1a1a] mt-1 text-xs">
                                <SelectValue placeholder="Select step..." />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-[#1a1a1a]">
                                {runbook.steps.filter(s => s.id !== step.id).map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.title} ({s.id})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {step.type === 'checklist' && (
                      <div>
                        <Label className="text-xs text-zinc-400 mb-2 block">Checklist Items</Label>
                        <div className="space-y-2">
                          {(step.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="flex gap-2">
                              <Input 
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...(step.items || [])];
                                  newItems[itemIdx] = e.target.value;
                                  updateStep(step.id, { items: newItems });
                                }}
                                className="bg-black border-[#1a1a1a] text-xs flex-1"
                                placeholder="Item description..."
                              />
                              <Button variant="ghost" size="icon" onClick={() => {
                                const newItems = [...(step.items || [])];
                                newItems.splice(itemIdx, 1);
                                updateStep(step.id, { items: newItems });
                              }} className="text-zinc-500 hover:text-red-500 h-9 w-9">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" className="bg-[#1a1a1a] border-0" onClick={() => {
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
