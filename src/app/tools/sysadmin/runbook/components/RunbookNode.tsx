import { Handle, Position } from '@xyflow/react';
import { Terminal, Info, ShieldCheck, GitBranch, AlertTriangle, CheckSquare, type LucideIcon } from "lucide-react";
import { RunbookStep, StepType } from './types';

const STEP_ICONS: Record<StepType, LucideIcon> = {
  checklist: CheckSquare,
  command: Terminal,
  information: Info,
  decision: GitBranch,
  warning: AlertTriangle,
  verification: ShieldCheck
};

type RunbookNodeData = RunbookStep & {
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
};

export default function RunbookNode({ data }: { data: RunbookNodeData }) {
  const Icon = STEP_ICONS[data.type] || Info;
  
  return (
    <div className="runbook-node border rounded-lg shadow-xl w-[250px] overflow-hidden">
      <div className="runbook-node-header p-2 flex items-center gap-2 border-b">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-wider truncate">
          {data.type}
        </span>
      </div>
      
      <div className="p-4">
        <input value={data.title} onChange={event => data.onTitleChange?.(event.target.value)} onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} aria-label="Step title" className="nodrag runbook-node-title mb-1 w-full truncate border-0 bg-transparent p-0 font-bold text-sm outline-none focus:ring-1 focus:ring-[#00ff9c]" />
        <textarea value={data.description ?? data.content ?? ''} onChange={event => data.onDescriptionChange?.(event.target.value)} onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} aria-label="Step description" placeholder="No description provided." className="nodrag runbook-node-description min-h-10 w-full resize-none border-0 bg-transparent p-0 text-xs outline-none focus:ring-1 focus:ring-[#00ff9c]" />
      </div>

      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-zinc-500" />
      
      {data.type === 'decision' ? (
        <>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="true" 
            style={{ left: '25%', background: '#00ff9c' }} 
            className="w-2 h-2" 
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="false" 
            style={{ left: '75%', background: '#ef4444' }} 
            className="w-2 h-2" 
          />
        </>
      ) : (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-2 h-2 bg-[#00ff9c]" 
        />
      )}
    </div>
  );
}
