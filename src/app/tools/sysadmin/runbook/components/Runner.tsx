import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Runbook, RunbookVariable } from "./types";
import { Check, Copy, ArrowRight, Terminal, Info, ShieldCheck, GitBranch, AlertTriangle, CheckSquare } from "lucide-react";

function isValidIPv4(value: string) {
  const octets = value.trim().split('.');
  return octets.length === 4 && octets.every(octet => /^(0|[1-9]\d{0,2})$/.test(octet) && Number(octet) <= 255);
}

function isAddressVariable(name: string) {
  return /(^|_)(IP|CIDR|ADDRESS|HOST)(_|$)/i.test(name);
}

interface RunnerProps {
  runbook: Runbook;
  onExit: () => void;
}

type DecisionSelection = { stepKey: string; choice: 'yes' | 'no' } | null;

export default function Runner({ runbook, onExit }: RunnerProps) {
  const [variables, setVariables] = useState<RunbookVariable[]>(
    runbook.variables.map(v => ({ ...v, value: v.defaultValue || '' }))
  );
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [decisionChoice, setDecisionChoice] = useState<DecisionSelection>(null);

  const currentStep = useMemo(() => {
    if (completed || currentStepIndex >= runbook.steps.length) return null;
    return runbook.steps[currentStepIndex];
  }, [runbook.steps, currentStepIndex, completed]);

  const currentStepKey = currentStep ? `${runbook.id}:${currentStep.id}` : '';

  // Replace variables in text
  const hydrateText = (text: string = '') => {
    let hydrated = text;
    variables.forEach(v => {
      const val = v.value || v.defaultValue || `{{${v.name}}}`;
      hydrated = hydrated.replace(new RegExp(`{{${v.name}}}`, 'g'), val);
    });
    return hydrated;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const validateVariables = () => {
    const errors: Record<string, string> = {};
    variables.forEach(variable => {
      const value = (variable.value || '').trim();
      if (isAddressVariable(variable.name) && value && !isValidIPv4(value)) {
        errors[variable.name] = 'Enter a valid IPv4 address, for example 10.0.0.50.';
      }
    });
    setVariableErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const proceedToNext = () => {
    if (!currentStep) return;
    if (!validateVariables()) return;
    setHistory([...history, currentStep.id]);
    
    // Linear progression if no branching
    if (currentStepIndex + 1 < runbook.steps.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  const proceedToSpecific = (stepId: string) => {
    if (!currentStep) return;
    if (!validateVariables()) return;
    setHistory([...history, currentStep.id]);
    
    const idx = runbook.steps.findIndex(s => s.id === stepId);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
    } else {
      // Step not found, just finish
      setCompleted(true);
    }
  };

  const chooseDecision = (choice: 'yes' | 'no', stepId: string) => {
    if (decisionChoice?.stepKey === currentStepKey) return;
    setDecisionChoice({ stepKey: currentStepKey, choice });
    proceedToSpecific(stepId);
  };

  const progressPercent = runbook.steps.length > 0 
    ? Math.round((history.length / runbook.steps.length) * 100) 
    : 100;

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-none">
        <Check className="w-16 h-16 text-[#00ff9c] mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Runbook Completed!</h2>
        <p className="text-zinc-400 mb-8">You have reached the end of the procedure.</p>
        <div className="flex gap-4">
          <Button onClick={onExit} variant="outline" className="bg-black border-[#1a1a1a] rounded-none">Exit Runner</Button>
          <Button onClick={() => { setHistory([]); setCurrentStepIndex(0); setCompleted(false); setDecisionChoice(null); }} className="bg-[#00ff9c] text-black hover:bg-[#00cc7a] rounded-none">
            Restart Runbook
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[800px]">
      
      {/* Left panel: Variables & Progress */}
      <div className="w-72 bg-[#050505] border border-[#1a1a1a] rounded-none flex flex-col">
        <div className="p-4 border-b border-[#1a1a1a]">
          <h2 className="font-bold text-lg text-white truncate" title={runbook.title}>{runbook.title}</h2>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{runbook.description}</p>
        </div>

        <div className="p-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400">Progress</span>
            <span className="text-[#00ff9c]">{Math.min(100, progressPercent)}%</span>
          </div>
          <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 mb-6">
            <div className="bg-[#00ff9c] h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progressPercent)}%` }}></div>
          </div>
          
          {variables.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-4">Environment Variables</h3>
              <div className="space-y-4">
                {variables.map((v, i) => (
                  <div key={i}>
                    <Label className="text-xs text-zinc-300">{v.name}</Label>
                    <Input 
                       value={v.value || ''}
                       onChange={(e) => {
                         const newVars = [...variables];
                         newVars[i].value = e.target.value;
                         setVariables(newVars);
                         if (isAddressVariable(v.name)) {
                           const nextValue = e.target.value.trim();
                           setVariableErrors(current => ({
                             ...current,
                             [v.name]: nextValue && !isValidIPv4(nextValue) ? 'Enter a valid IPv4 address, for example 10.0.0.50.' : ''
                           }));
                         }
                       }}
                      placeholder={v.defaultValue}
                       inputMode={isAddressVariable(v.name) ? 'decimal' : undefined}
                       className={`mt-1 bg-black text-xs font-mono focus-visible:ring-[#00ff9c] ${variableErrors[v.name] ? 'border-red-500 focus-visible:ring-red-500' : 'border-[#1a1a1a]'}`}
                     />
                     {variableErrors[v.name] && <p className="mt-1 text-[10px] text-red-400">{variableErrors[v.name]}</p>}
                    {v.description && <p className="text-[10px] text-zinc-500 mt-1">{v.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-auto p-4 border-t border-[#1a1a1a]">
           <Button onClick={onExit} variant="outline" size="sm" className="w-full bg-black border-[#1a1a1a] text-zinc-400 hover:text-white rounded-none">
             Abort Execution
           </Button>
        </div>
      </div>

      {/* Right panel: Active Step Execution */}
      <div className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-none p-8 overflow-y-auto">
        {currentStep && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-none bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                {currentStep.type === 'information' && <Info className="w-5 h-5 text-blue-400" />}
                {currentStep.type === 'command' && <Terminal className="w-5 h-5 text-[#00ff9c]" />}
                {currentStep.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                {currentStep.type === 'verification' && <ShieldCheck className="w-5 h-5 text-purple-400" />}
                {currentStep.type === 'decision' && <GitBranch className="w-5 h-5 text-orange-400" />}
                {currentStep.type === 'checklist' && <CheckSquare className="w-5 h-5 text-green-400" />}
              </div>
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{currentStep.type} • Step {history.length + 1}</div>
                <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
              </div>
            </div>

            <div className="space-y-6">
              {(currentStep.description || currentStep.content) && (
                <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {hydrateText(currentStep.description || currentStep.content)}
                </div>
              )}

              {currentStep.type === 'command' && currentStep.command && (
                <div className="bg-black border border-[#1a1a1a] rounded-none p-4 relative group">
                  <pre className="text-[#00ff9c] font-mono text-sm whitespace-pre-wrap">
                    {hydrateText(currentStep.command)}
                  </pre>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleCopy(hydrateText(currentStep.command))}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a] hover:bg-[#333]"
                  >
                    {copied === hydrateText(currentStep.command) ? <Check className="w-4 h-4 text-[#00ff9c]" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  </Button>
                </div>
              )}

              {(currentStep.type === 'command' || currentStep.type === 'verification') && currentStep.expectedResult && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-none p-4">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Expected Result</div>
                  <div className="text-sm text-zinc-200">{hydrateText(currentStep.expectedResult)}</div>
                </div>
              )}

              {currentStep.type === 'checklist' && currentStep.items && (
                <div className="space-y-3 bg-[#111] border border-[#222] p-4 rounded-none">
                  {currentStep.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 py-0.5">
                      <Checkbox 
                        id={`check-${idx}`} 
                        checked={!!checklistState[`${currentStep.id}-${idx}`]}
                        onCheckedChange={(c) => setChecklistState({ ...checklistState, [`${currentStep.id}-${idx}`]: !!c })}
                        className="mt-1 shrink-0 border-zinc-500 data-[state=checked]:bg-[#00ff9c] data-[state=checked]:border-[#00ff9c]"
                      />
                      <Label htmlFor={`check-${idx}`} className="cursor-pointer pl-1 text-sm leading-relaxed text-zinc-300">
                        {hydrateText(item)}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {currentStep.type === 'decision' && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-none p-6 text-center space-y-6">
                  <h3 className="text-lg font-bold text-orange-400">{hydrateText(currentStep.decisionQuestion)}</h3>
                  <div className="flex justify-center gap-4">
                    <Button 
                      onClick={() => chooseDecision('yes', currentStep.decisionTrueNext || '')}
                      disabled={decisionChoice?.stepKey === currentStepKey}
                      className="bg-[#00ff9c] text-black hover:bg-[#00cc7a] px-8 rounded-none"
                    >
                      YES
                    </Button>
                    <Button 
                      onClick={() => chooseDecision('no', currentStep.decisionFalseNext || '')}
                      disabled={decisionChoice?.stepKey === currentStepKey}
                      className="bg-red-500 text-white hover:bg-red-600 px-8 rounded-none"
                    >
                      NO
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Button for non-decision steps */}
              {currentStep.type !== 'decision' && (
                <div className="pt-8 flex justify-end">
                  <Button onClick={proceedToNext} className="bg-white text-black hover:bg-zinc-200 rounded-none">
                    Next Step <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
