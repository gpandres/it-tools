import { Handle, Position } from '@xyflow/react';
import { Server, Router, HardDrive, Wifi, Globe, Monitor, Shield, Box, Database, HardDriveDownload } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  server: Server,
  router: Router,
  switch: Box,
  firewall: Shield,
  cloud: Globe,
  wireless: Wifi,
  nas: HardDriveDownload,
  database: Database,
  pc: Monitor,
  default: HardDrive
};

const COLOR_MAP: Record<string, string> = {
  server: "bg-[#0088ff]/10 text-[#0088ff] border-[#0088ff]/30",
  router: "bg-[#00ff9c]/10 text-[#00ff9c] border-[#00ff9c]/30",
  switch: "bg-[#ff0055]/10 text-[#ff0055] border-[#ff0055]/30",
  firewall: "bg-[#ff9900]/10 text-[#ff9900] border-[#ff9900]/30",
  cloud: "bg-[#b026ff]/10 text-[#b026ff] border-[#b026ff]/30",
  wireless: "bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/30",
  nas: "bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/30",
  database: "bg-[#00ff00]/10 text-[#00ff00] border-[#00ff00]/30",
  pc: "bg-zinc-800 text-zinc-300 border-zinc-700",
  default: "bg-zinc-800 text-zinc-300 border-zinc-700"
};

export default function NetworkNode({ data, selected }: any) {
  const Icon = ICON_MAP[data.type] || ICON_MAP.default;
  const colorClass = COLOR_MAP[data.type] || COLOR_MAP.default;

  return (
    <div className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 backdrop-blur-md shadow-2xl transition-all ${colorClass} ${selected ? 'ring-2 ring-white shadow-white/20' : ''} min-w-[120px]`}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="top-target" />
      <Handle type="source" position={Position.Top} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="top-source" />

      <div className="mb-2">
        <Icon className="w-8 h-8" strokeWidth={1.5} />
      </div>
      
      <div className="text-center font-mono">
        <div className="font-bold text-xs truncate max-w-[100px]">{data.label}</div>
        {data.ip && <div className="text-[9px] opacity-80 mt-1">{data.ip}</div>}
        {data.vlan && <div className="text-[9px] text-[#00ff9c] mt-0.5">VLAN {data.vlan}</div>}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="right-source" />
      <Handle type="target" position={Position.Right} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="right-target" />
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="bottom-source" />
      <Handle type="target" position={Position.Bottom} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="bottom-target" />

      <Handle type="source" position={Position.Left} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="left-source" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="left-target" />
    </div>
  );
}
