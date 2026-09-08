import { Handle, NodeResizer, Position } from '@xyflow/react';
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
  onSizeChange?: (size: { width: number; height: number }) => void;
};

export default function RunbookNode({ data }: { data: RunbookNodeData }) {
  const Icon = STEP_ICONS[data.type] || Info;
  
  return (
    <div className="runbook-node flex h-full min-w-[250px] w-full flex-col overflow-hidden rounded-lg border shadow-xl">
      <NodeResizer minWidth={250} minHeight={130} lineClassName="runbook-node-resizer-line" handleClassName="runbook-node-resizer-handle" onResizeEnd={(_, params) => data.onSizeChange?.({ width: params.width, height: params.height })} />
      <div className="runbook-node-header flex shrink-0 items-center gap-2 border-b p-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-wider truncate">
          {data.type}
        </span>
      </div>
      
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <input value={data.title} onChange={event => data.onTitleChange?.(event.target.value)} onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} aria-label="Step title" className="nodrag runbook-node-title mb-1 w-full shrink-0 truncate border-0 bg-transparent p-0 text-sm font-bold outline-none focus:ring-1 focus:ring-[#00ff9c]" />
        <textarea value={data.description ?? data.content ?? ''} onChange={event => data.onDescriptionChange?.(event.target.value)} onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} aria-label="Step description" placeholder="No description provided." className="nodrag runbook-node-description min-h-10 w-full min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 text-xs outline-none focus:ring-1 focus:ring-[#00ff9c]" />
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
