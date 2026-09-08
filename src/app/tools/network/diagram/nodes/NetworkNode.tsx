import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';
import { Server, Router, HardDrive, Wifi, Globe, Monitor, Shield, Box, Database, HardDriveDownload, Scale, ShieldCheck, KeyRound, Globe2, Boxes, ServerCog, Laptop, Zap } from 'lucide-react';
import type { NetworkNode } from '../types';

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
  'load-balancer': Scale,
  'ids-ips': ShieldCheck,
  vpn: KeyRound,
  proxy: Globe2,
  dns: Globe2,
  dhcp: Zap,
  kubernetes: Boxes,
  container: Boxes,
  vm: ServerCog,
  identity: KeyRound,
  endpoint: Laptop,
  vpc: Globe2,
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
  'load-balancer': "bg-[#ff6b35]/10 text-[#ff8a65] border-[#ff6b35]/40",
  'ids-ips': "bg-[#ff0055]/10 text-[#ff557f] border-[#ff0055]/40",
  vpn: "bg-[#b026ff]/10 text-[#c56bff] border-[#b026ff]/40",
  proxy: "bg-[#00aaff]/10 text-[#38bdf8] border-[#00aaff]/40",
  dns: "bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/40",
  dhcp: "bg-[#7c3aed]/10 text-[#a78bfa] border-[#7c3aed]/40",
  kubernetes: "bg-[#326ce5]/10 text-[#6ea8ff] border-[#326ce5]/40",
  container: "bg-[#2496ed]/10 text-[#60b5ff] border-[#2496ed]/40",
  vm: "bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/40",
  identity: "bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/40",
  endpoint: "bg-[#94a3b8]/10 text-[#cbd5e1] border-[#94a3b8]/40",
  vpc: "bg-[#14b8a6]/10 text-[#2dd4bf] border-[#14b8a6]/40",
  default: "bg-zinc-800 text-zinc-300 border-zinc-700"
};

export default function NetworkNode({ data, selected }: NodeProps<NetworkNode>) {
  const Icon = ICON_MAP[data.type] || ICON_MAP.default;
  const colorClass = COLOR_MAP[data.type] || COLOR_MAP.default;
  const isGroup = data.type === 'group';

  return (
    <div className={`relative flex h-full min-h-[100px] min-w-[120px] flex-col ${isGroup ? 'items-start justify-start rounded-lg border border-dashed border-[#00ff9c]/50 bg-[#00ff9c]/5 p-3' : 'items-center justify-center overflow-hidden rounded-xl border-2 p-3 backdrop-blur-md shadow-2xl'} transition-all ${colorClass} ${selected ? 'ring-2 ring-white shadow-white/20' : ''}`}>
      <NodeResizer isVisible={selected} minWidth={120} minHeight={100} lineClassName="!border-[#00ff9c]/60" handleClassName="!h-2 !w-2 !border-[#00ff9c] !bg-[#050505]" />
      {!isGroup && <>
        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="top-target" />
        <Handle type="source" position={Position.Top} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="top-source" />

        <div className="mb-2"><Icon className="w-8 h-8" strokeWidth={1.5} /></div>

        <div className="min-w-0 max-w-full text-center font-mono">
          <div className="truncate text-xs font-bold" title={data.label}>{data.label}</div>
          {data.hostname && <div className="truncate text-[9px] opacity-70" title={data.hostname}>{data.hostname}</div>}
          {data.ip && <div className="truncate text-[9px] opacity-80" title={data.ip}>{data.ip}</div>}
          <div className="mt-1 flex items-center justify-center gap-1 text-[9px] uppercase tracking-wide opacity-80">
            {data.vlan && <span className="text-[#00ff9c]">VLAN {data.vlan}</span>}
            {data.status && <span className={data.status === 'offline' ? 'text-red-300' : data.status === 'degraded' ? 'text-amber-300' : data.status === 'maintenance' ? 'text-blue-300' : 'text-[#72e6b4]'}>● {data.status}</span>}
          </div>
        </div>

        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="right-source" />
        <Handle type="target" position={Position.Right} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="right-target" />
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="bottom-source" />
        <Handle type="target" position={Position.Bottom} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="bottom-target" />
        <Handle type="source" position={Position.Left} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="left-source" />
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-zinc-400 border-2 border-black" id="left-target" />
      </>}
      {isGroup && <div className="font-mono"><div className="text-[10px] font-bold uppercase tracking-widest text-[#00ff9c]">{data.label}</div><div className="mt-1 text-[9px] text-zinc-500">Group container</div></div>}
    </div>
  );
}
