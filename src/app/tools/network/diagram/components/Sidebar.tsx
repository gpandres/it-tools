import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolActionButton } from "@/components/tool-action-panel";
import { AlertTriangle, Boxes, CheckCircle2, ChevronDown, Cloud, Database, Download, FileJson, Globe2, HardDriveDownload, KeyRound, Laptop, Network, Redo2, Router, Search, Server, ServerCog, Shield, ShieldCheck, Sparkles, Undo2, Upload, Wifi, X, Zap } from 'lucide-react';
import type { DiagramIssue } from '@/lib/diagram-validation';
import type { NetworkConnectionType, NetworkEdge, NetworkNode, NetworkNodeData, NetworkNodeType, NetworkStatus, NetworkZone } from '../types';

type PaletteItem = { type: NetworkNodeType; label: string; category: 'Network' | 'Security' | 'Compute' | 'Services' | 'Cloud' | 'Endpoints'; icon: typeof Router };

const NODE_TYPES: PaletteItem[] = [
  { type: 'router', label: 'Router', category: 'Network', icon: Router },
  { type: 'switch', label: 'Switch', category: 'Network', icon: Boxes },
  { type: 'wireless', label: 'WiFi AP', category: 'Network', icon: Wifi },
  { type: 'firewall', label: 'Firewall', category: 'Security', icon: Shield },
  { type: 'ids-ips', label: 'IDS / IPS', category: 'Security', icon: ShieldCheck },
  { type: 'vpn', label: 'VPN Gateway', category: 'Security', icon: KeyRound },
  { type: 'server', label: 'Server', category: 'Compute', icon: Server },
  { type: 'vm', label: 'Virtual Machine', category: 'Compute', icon: ServerCog },
  { type: 'container', label: 'Container', category: 'Compute', icon: Boxes },
  { type: 'kubernetes', label: 'Kubernetes', category: 'Compute', icon: Boxes },
  { type: 'database', label: 'Database', category: 'Services', icon: Database },
  { type: 'nas', label: 'NAS', category: 'Services', icon: HardDriveDownload },
  { type: 'dns', label: 'DNS', category: 'Services', icon: Globe2 },
  { type: 'dhcp', label: 'DHCP', category: 'Services', icon: Zap },
  { type: 'proxy', label: 'Proxy', category: 'Services', icon: Network },
  { type: 'load-balancer', label: 'Load Balancer', category: 'Services', icon: Zap },
  { type: 'cloud', label: 'Cloud / WAN', category: 'Cloud', icon: Cloud },
  { type: 'vpc', label: 'VPC / VNet', category: 'Cloud', icon: Globe2 },
  { type: 'pc', label: 'PC', category: 'Endpoints', icon: Laptop },
  { type: 'endpoint', label: 'Endpoint', category: 'Endpoints', icon: Laptop },
  { type: 'identity', label: 'Identity / AD', category: 'Services', icon: KeyRound },
];

const ZONES: NetworkZone[] = ['internet', 'wan', 'lan', 'dmz', 'management', 'server', 'cloud'];
const STATUSES: NetworkStatus[] = ['active', 'degraded', 'offline', 'maintenance'];

type SidebarProps = {
  selectedNode: NetworkNode | null;
  selectedEdge: NetworkEdge | null;
  updateNodeData: (nodeId: string, newData: Partial<NetworkNodeData>) => void;
  updateEdgeData: (edgeId: string, newData: Partial<NetworkEdge['data']>) => void;
  onAddNode: (type: NetworkNodeType, label: string) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  validationIssues: DiagramIssue[];
  validate: () => void;
  exportDiagram: () => void;
  importDiagram: (file: File) => void;
  loadTemplate: (templateName: string) => void;
  exportImage: (bgColor: 'black' | 'white' | 'transparent') => void;
};

export default function Sidebar({ selectedNode, selectedEdge, updateNodeData, updateEdgeData, onAddNode, duplicateSelected, deleteSelected, undo, redo, canUndo, canRedo, validationIssues, validate, exportDiagram, importDiagram, loadTemplate, exportImage }: SidebarProps) {
  const [query, setQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>(['Network', 'Security', 'Compute', 'Services']);
  const filteredItems = useMemo(() => NODE_TYPES.filter(item => `${item.label} ${item.category}`.toLowerCase().includes(query.toLowerCase().trim())), [query]);
  const categories = Array.from(new Set(filteredItems.map(item => item.category)));

  const toggleCategory = (category: string) => setOpenCategories(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category]);
  const onDragStart = (event: React.DragEvent<HTMLButtonElement>, nodeType: NetworkNodeType, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="flex h-full w-[19rem] shrink-0 flex-col overflow-hidden border-r border-[#1a1a1a] bg-[#050505]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#1a1a1a] p-3">
        <h2 className="flex items-center gap-2 font-bold"><Network className="h-4 w-4 text-[#00ff9c]" /> Diagram toolbox</h2>
        <div className="flex items-center gap-1">
          <ToolActionButton type="button" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 /></ToolActionButton>
          <ToolActionButton type="button" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Redo2 /></ToolActionButton>
          {(selectedNode || selectedEdge) && <ToolActionButton type="button" onClick={duplicateSelected} aria-label="Duplicate selection" title="Duplicate selection"><Sparkles /></ToolActionButton>}
          {(selectedNode || selectedEdge) && <ToolActionButton type="button" onClick={deleteSelected} tone="danger" aria-label="Delete selection" title="Delete selection (Delete)"><X /></ToolActionButton>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <section className="border-b border-[#1a1a1a] pb-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Node palette</h3><span className="text-[9px] text-zinc-700">{filteredItems.length}/{NODE_TYPES.length}</span></div>
          <div className="relative mb-3"><Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search nodes..." aria-label="Search nodes" className="h-8 bg-black pl-7 font-mono text-xs" /></div>
          <p className="mb-3 text-[10px] text-zinc-600">Click to add to the canvas or drag a node into position.</p>
          <div className="space-y-2">
            {categories.map(category => <div key={category}>
              <button type="button" onClick={() => toggleCategory(category)} aria-expanded={openCategories.includes(category)} className="flex w-full items-center gap-1 py-1 text-left text-[9px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-300"><ChevronDown className={`h-3 w-3 transition-transform ${openCategories.includes(category) ? '' : '-rotate-90'}`} />{category}<span className="ml-auto">{filteredItems.filter(item => item.category === category).length}</span></button>
              {openCategories.includes(category) && <div className="grid grid-cols-2 gap-1.5 pt-1">
                {filteredItems.filter(item => item.category === category).map(item => { const Icon = item.icon; return <button key={item.type} type="button" draggable onClick={() => onAddNode(item.type, item.label)} onDragStart={event => onDragStart(event, item.type, item.label)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded border border-[#1a1a1a] bg-black p-2 text-zinc-400 transition-colors hover:border-[#00ff9c]/60 hover:bg-[#00ff9c]/5 hover:text-[#00ff9c]"><Icon className="h-4 w-4" /><span className="text-center font-mono text-[9px] leading-tight">{item.label}</span></button>; })}
              </div>}
            </div>)}
          </div>
        </section>

        {selectedNode && <section className="border-b border-[#1a1a1a] py-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00aaff]">Node properties</h3><span className="font-mono text-[9px] text-zinc-700">{selectedNode.id}</span></div>
          <div className="space-y-3">
            <Field label="Label"><Input value={selectedNode.data.label || ''} onChange={event => updateNodeData(selectedNode.id, { label: event.target.value })} className="bg-black font-mono text-xs" /></Field>
            <Field label="Hostname"><Input value={selectedNode.data.hostname || ''} onChange={event => updateNodeData(selectedNode.id, { hostname: event.target.value })} placeholder="edge-fw-01" className="bg-black font-mono text-xs" /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="IP / CIDR"><Input value={selectedNode.data.ip || ''} onChange={event => updateNodeData(selectedNode.id, { ip: event.target.value })} placeholder="10.0.0.1/24" className="bg-black font-mono text-xs" /></Field><Field label="VLAN"><Input value={selectedNode.data.vlan || ''} onChange={event => updateNodeData(selectedNode.id, { vlan: event.target.value })} placeholder="10" className="bg-black font-mono text-xs" /></Field></div>
            <div className="grid grid-cols-2 gap-2"><Field label="Role"><Input value={selectedNode.data.role || ''} onChange={event => updateNodeData(selectedNode.id, { role: event.target.value })} placeholder="gateway" className="bg-black font-mono text-xs" /></Field><Field label="Vendor / model"><Input value={`${selectedNode.data.vendor || ''}${selectedNode.data.vendor && selectedNode.data.model ? ' / ' : ''}${selectedNode.data.model || ''}`} onChange={event => { const [vendor, ...model] = event.target.value.split('/'); updateNodeData(selectedNode.id, { vendor: vendor.trim(), model: model.join('/').trim() }); }} placeholder="Cisco / C9300" className="bg-black font-mono text-xs" /></Field></div>
            <div className="grid grid-cols-2 gap-2"><Field label="Zone"><select value={selectedNode.data.zone || ''} onChange={event => updateNodeData(selectedNode.id, { zone: event.target.value as NetworkZone })} className="h-8 w-full rounded-lg border border-[#1a1a1a] bg-black px-2 text-xs capitalize text-zinc-300"><option value="">Unassigned</option>{ZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)}</select></Field><Field label="Status"><select value={selectedNode.data.status || 'active'} onChange={event => updateNodeData(selectedNode.id, { status: event.target.value as NetworkStatus })} className="h-8 w-full rounded-lg border border-[#1a1a1a] bg-black px-2 text-xs capitalize text-zinc-300">{STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></Field></div>
            <Field label="Notes"><textarea value={selectedNode.data.notes || ''} onChange={event => updateNodeData(selectedNode.id, { notes: event.target.value })} placeholder="Purpose, owner, or change notes..." className="min-h-16 w-full resize-y rounded-lg border border-[#1a1a1a] bg-black px-2.5 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-[#00ff9c]" /></Field>
          </div>
        </section>}

        {selectedEdge && <section className="border-b border-[#1a1a1a] py-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00ff9c]">Connection properties</h3><span className="font-mono text-[9px] text-zinc-700">{selectedEdge.id}</span></div>
          <div className="space-y-3">
            <Field label="Connection type"><Select value={selectedEdge.data?.connectionType || 'ethernet'} onValueChange={value => updateEdgeData(selectedEdge.id, { connectionType: value as NetworkConnectionType })}><SelectTrigger className="bg-black font-mono text-xs"><SelectValue /></SelectTrigger><SelectContent className="bg-black font-mono text-xs text-zinc-300"><SelectItem value="ethernet">Ethernet (Copper)</SelectItem><SelectItem value="fiber">Fiber Optic</SelectItem><SelectItem value="wireless">Wireless</SelectItem><SelectItem value="vpn">VPN / Logical</SelectItem></SelectContent></Select></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Source port"><Input value={selectedEdge.data?.sourcePort || ''} onChange={event => updateEdgeData(selectedEdge.id, { sourcePort: event.target.value })} placeholder="Gi1/0/1" className="bg-black font-mono text-xs" /></Field><Field label="Target port"><Input value={selectedEdge.data?.targetPort || ''} onChange={event => updateEdgeData(selectedEdge.id, { targetPort: event.target.value })} placeholder="Gi1/0/24" className="bg-black font-mono text-xs" /></Field></div>
            <div className="grid grid-cols-2 gap-2"><Field label="Bandwidth"><Input value={selectedEdge.data?.bandwidth || ''} onChange={event => updateEdgeData(selectedEdge.id, { bandwidth: event.target.value })} placeholder="10 Gbps" className="bg-black font-mono text-xs" /></Field><Field label="VLAN mode"><select value={selectedEdge.data?.vlanMode || 'unknown'} onChange={event => updateEdgeData(selectedEdge.id, { vlanMode: event.target.value as NonNullable<NetworkEdge['data']>['vlanMode'] })} className="h-8 w-full rounded-lg border border-[#1a1a1a] bg-black px-2 text-xs text-zinc-300"><option value="unknown">Unknown</option><option value="access">Access</option><option value="trunk">Trunk</option><option value="routed">Routed</option></select></Field></div>
            <Field label="Label"><Input value={selectedEdge.data?.label || ''} onChange={event => updateEdgeData(selectedEdge.id, { label: event.target.value })} placeholder="uplink, 10G, trunk 10-20" className="bg-black font-mono text-xs" /></Field>
          </div>
        </section>}

        <section className="border-b border-[#1a1a1a] py-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Templates</h3><span className="text-[9px] text-zinc-700">starter topologies</span></div><div className="grid grid-cols-2 gap-2"><Button onClick={() => loadTemplate('Small Office')} variant="outline" size="sm" className="bg-black text-[10px]">Small Office</Button><Button onClick={() => loadTemplate('Enterprise Core')} variant="outline" size="sm" className="bg-black text-[10px]">Enterprise Core</Button><Button onClick={() => loadTemplate('DMZ')} variant="outline" size="sm" className="bg-black text-[10px]">DMZ</Button><Button onClick={() => loadTemplate('VLAN Segmentation')} variant="outline" size="sm" className="bg-black text-[10px]">VLAN Segmentation</Button><Button onClick={() => loadTemplate('Empty Canvas')} variant="outline" size="sm" className="col-span-2 bg-black text-[10px] text-red-400">Clear canvas</Button></div></section>

        <section className="border-b border-[#1a1a1a] py-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Validation</h3><button type="button" onClick={validate} className="text-[10px] font-bold uppercase text-[#00ff9c] hover:text-white">Run checks</button></div>{validationIssues.length === 0 ? <div className="flex items-center gap-2 text-[10px] text-[#72e6b4]"><CheckCircle2 className="h-3.5 w-3.5" />No issues detected</div> : <div className="space-y-2">{validationIssues.slice(0, 6).map(issue => <div key={issue.id} className={`flex gap-2 text-[10px] ${issue.severity === 'error' ? 'text-red-300' : 'text-amber-300'}`}><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /><span><strong>{issue.title}:</strong> {issue.detail}</span></div>)}{validationIssues.length > 6 && <p className="text-[9px] text-zinc-600">+{validationIssues.length - 6} more issues</p>}</div>}</section>

        <section className="py-4"><h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Export / import</h3><div className="grid grid-cols-2 gap-2"><Button onClick={() => exportImage('black')} variant="outline" size="sm" className="bg-black text-[10px]"><Download className="mr-1 h-3 w-3" />PNG dark</Button><Button onClick={() => exportImage('white')} variant="outline" size="sm" className="bg-black text-[10px]"><Download className="mr-1 h-3 w-3" />PNG light</Button><Button onClick={() => exportImage('transparent')} variant="outline" size="sm" className="bg-black text-[10px]"><Download className="mr-1 h-3 w-3" />PNG alpha</Button><Button onClick={exportDiagram} variant="outline" size="sm" className="bg-black text-[10px] text-purple-300"><FileJson className="mr-1 h-3 w-3" />JSON</Button><Button variant="outline" size="sm" className="relative col-span-2 w-full bg-black text-[10px]"><Upload className="mr-1 h-3 w-3" />Load JSON<input type="file" accept=".json" className="absolute inset-0 cursor-pointer opacity-0" onChange={event => { const file = event.target.files?.[0]; if (file) importDiagram(file); event.currentTarget.value = ''; }} /></Button></div></section>
      </div>
  </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[10px] text-zinc-500">{label}</Label>{children}</div>;
}
