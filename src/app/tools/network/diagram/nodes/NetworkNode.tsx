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
  server: "border-l-sky-400", router: "border-l-emerald-400", switch: "border-l-emerald-300", firewall: "border-l-amber-400", cloud: "border-l-violet-400", wireless: "border-l-cyan-400", nas: "border-l-amber-300", database: "border-l-sky-400", pc: "border-l-slate-400",
  'load-balancer': "border-l-orange-400", 'ids-ips': "border-l-rose-400", vpn: "border-l-violet-400", proxy: "border-l-sky-400", dns: "border-l-cyan-400", dhcp: "border-l-violet-400", kubernetes: "border-l-sky-400", container: "border-l-sky-400", vm: "border-l-violet-400", identity: "border-l-amber-400", endpoint: "border-l-slate-400", vpc: "border-l-teal-400", default: "border-l-zinc-500"
};

export default function NetworkNode({ data, selected }: NodeProps<NetworkNode>) {
  const Icon = ICON_MAP[data.type] || ICON_MAP.default;
  const colorClass = COLOR_MAP[data.type] || COLOR_MAP.default;
  const isGroup = data.type === 'group';
  const groupColor = data.groupColor || '#00ff9c';

  return (
    <div data-diagram-node-card style={isGroup ? { borderColor: groupColor, backgroundColor: `${groupColor}12` } : { minHeight: 'var(--diagram-node-min-height, 84px)', minWidth: 'var(--diagram-node-min-width, 156px)' }} className={`group/node relative flex h-full min-h-[72px] min-w-[136px] flex-col ${isGroup ? 'diagram-group-card items-start justify-start rounded-lg border border-dashed p-3' : 'items-center justify-center overflow-hidden rounded-lg border border-l-2 border-[#34353a] bg-[#101115]/95 p-3 text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.28)]'} transition-all ${colorClass} ${selected ? 'ring-1 ring-white/80 shadow-white/10' : ''}`}>
      <NodeResizer isVisible={selected} minWidth={120} minHeight={100} lineClassName="!border-[#00ff9c]/60" handleClassName="!h-2 !w-2 !border-[#00ff9c] !bg-[#050505]" />
      {!isGroup && <>
        <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="top-target" />
        <Handle type="source" position={Position.Top} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="top-source" />

        <div className="diagram-device-icon mb-1.5 text-zinc-400"><Icon className="h-6 w-6" strokeWidth={1.5} /></div>

        <div className="min-w-0 max-w-full text-center font-mono">
          <div className="diagram-device-title truncate text-xs font-semibold text-zinc-100" title={data.label}>{data.label}</div>
          {(data.hostname || data.ip) && <div className="diagram-device-meta truncate text-[10px] text-zinc-500" title={data.hostname || data.ip}>{data.hostname || data.ip}</div>}
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wide">
            {data.vlan && <span className="diagram-device-vlan text-zinc-400">VLAN {data.vlan}</span>}
            {data.status && <span className={data.status === 'offline' ? 'text-red-300' : data.status === 'degraded' ? 'text-amber-300' : data.status === 'maintenance' ? 'text-blue-300' : 'text-[#72e6b4]'}>● {data.status}</span>}
          </div>
        </div>

        <Handle type="source" position={Position.Right} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="right-source" />
        <Handle type="target" position={Position.Right} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="right-target" />
        <Handle type="source" position={Position.Bottom} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="bottom-source" />
        <Handle type="target" position={Position.Bottom} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="bottom-target" />
        <Handle type="source" position={Position.Left} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="left-source" />
        <Handle type="target" position={Position.Left} className="h-3 w-3 border-2 border-black bg-zinc-400 opacity-0 transition-opacity group-hover/node:opacity-100" id="left-target" />
      </>}
      {isGroup && <div className="font-mono"><div style={{ color: groupColor }} className="text-[10px] font-bold uppercase tracking-widest">{data.label}</div><div className="mt-1 text-[9px] text-zinc-500">Group container</div></div>}
    </div>
  );
}
