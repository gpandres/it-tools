import { Handle, Position } from '@xyflow/react';
import { Terminal, Info, ShieldCheck, GitBranch, AlertTriangle, CheckSquare } from "lucide-react";
import { StepType } from './types';

const STEP_ICONS: Record<StepType, any> = {
  checklist: CheckSquare,
  command: Terminal,
  information: Info,
  decision: GitBranch,
  warning: AlertTriangle,
  verification: ShieldCheck
};

export default function RunbookNode({ data }: { data: any }) {
  const Icon = STEP_ICONS[data.type as StepType] || Info;
  
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg shadow-xl w-[250px] overflow-hidden">
      <div className="bg-[#111] p-2 flex items-center gap-2 border-b border-[#1a1a1a]">
        <Icon className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider truncate">
          {data.type}
        </span>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-sm text-white truncate mb-1">{data.title}</h3>
        <p className="text-xs text-zinc-500 line-clamp-2">{data.description || data.content || "No description provided."}</p>
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
