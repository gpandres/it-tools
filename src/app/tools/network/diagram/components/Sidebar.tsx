import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Router, HardDrive, Wifi, Globe, Monitor, Shield, Box, Database, HardDriveDownload, Download, Upload, Network } from 'lucide-react';

const NODE_TYPES = [
  { type: 'router', label: 'Router', icon: Router },
  { type: 'switch', label: 'Switch', icon: Box },
  { type: 'firewall', label: 'Firewall', icon: Shield },
  { type: 'server', label: 'Server', icon: Server },
  { type: 'database', label: 'Database', icon: Database },
  { type: 'nas', label: 'NAS', icon: HardDriveDownload },
  { type: 'wireless', label: 'WiFi AP', icon: Wifi },
  { type: 'pc', label: 'PC', icon: Monitor },
  { type: 'cloud', label: 'Cloud/WAN', icon: Globe },
];

export default function Sidebar({ 
  selectedNode, 
  selectedEdge, 
  updateNodeData, 
  updateEdgeData, 
  exportDiagram, 
  importDiagram,
  loadTemplate 
}: any) {

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 bg-[#050505] border-r border-[#1a1a1a] flex flex-col h-full h-[800px] overflow-y-auto">
      <div className="p-4 border-b border-[#1a1a1a]">
        <h2 className="font-bold text-lg flex items-center gap-2"><Network className="w-5 h-5 text-purple-500" /> Toolbox</h2>
      </div>

      {!selectedNode && !selectedEdge ? (
        <div className="p-4 flex-1">
          <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-4">Node Palette</h3>
          <p className="text-xs text-zinc-400 mb-4">Drag and drop nodes onto the canvas.</p>
          <div className="grid grid-cols-2 gap-3">
            {NODE_TYPES.map((nt) => {
              const Icon = nt.icon;
              return (
                <div
                  key={nt.type}
                  className="flex flex-col items-center justify-center p-3 border border-[#1a1a1a] rounded cursor-grab hover:bg-[#1a1a1a] transition-colors"
                  onDragStart={(event) => onDragStart(event, nt.type, nt.label)}
                  draggable
                >
                  <Icon className="w-6 h-6 mb-2 text-zinc-400" />
                  <span className="text-[10px] font-mono text-zinc-300">{nt.label}</span>
                </div>
              );
            })}
          </div>

          <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mt-8 mb-4">Templates</h3>
          <div className="space-y-2">
            <Button onClick={() => loadTemplate("Small Office")} variant="outline" size="sm" className="w-full justify-start bg-black border-[#1a1a1a] hover:border-[#00ff9c] hover:text-[#00ff9c]">Small Office</Button>
            <Button onClick={() => loadTemplate("Enterprise Core")} variant="outline" size="sm" className="w-full justify-start bg-black border-[#1a1a1a] hover:border-[#00ff9c] hover:text-[#00ff9c]">Enterprise Core</Button>
            <Button onClick={() => loadTemplate("Empty Canvas")} variant="outline" size="sm" className="w-full justify-start bg-black border-[#1a1a1a] hover:border-red-500 hover:text-red-500">Clear Canvas</Button>
          </div>

          <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mt-8 mb-4">Data</h3>
          <div className="flex gap-2">
            <Button onClick={exportDiagram} variant="outline" size="sm" className="flex-1 bg-black border-[#1a1a1a]">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" size="sm" className="flex-1 bg-black border-[#1a1a1a] relative overflow-hidden">
              <Upload className="w-4 h-4 mr-2" /> Import
              <input 
                type="file" 
                accept=".json"
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    importDiagram(e.target.files[0]);
                  }
                }} 
              />
            </Button>
          </div>
        </div>
      ) : selectedNode ? (
        <div className="p-4 flex-1 space-y-4">
          <h3 className="text-xs font-bold text-[#0088ff] tracking-widest uppercase mb-4">Node Properties</h3>
          
          <div className="space-y-2">
            <Label className="text-xs">Node Label</Label>
            <Input 
              value={selectedNode.data.label || ''} 
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
              className="bg-black border-[#1a1a1a] font-mono text-xs" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">IP Address</Label>
            <Input 
              value={selectedNode.data.ip || ''} 
              onChange={(e) => updateNodeData(selectedNode.id, { ip: e.target.value })}
              placeholder="e.g. 192.168.1.1"
              className="bg-black border-[#1a1a1a] font-mono text-xs" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">VLAN</Label>
            <Input 
              value={selectedNode.data.vlan || ''} 
              onChange={(e) => updateNodeData(selectedNode.id, { vlan: e.target.value })}
              placeholder="e.g. 10"
              className="bg-black border-[#1a1a1a] font-mono text-xs" 
            />
          </div>
        </div>
      ) : selectedEdge ? (
        <div className="p-4 flex-1 space-y-4">
          <h3 className="text-xs font-bold text-[#00ff9c] tracking-widest uppercase mb-4">Connection Properties</h3>
          
          <div className="space-y-2">
            <Label className="text-xs">Connection Type</Label>
            <Select 
              value={selectedEdge.data?.connectionType || 'ethernet'} 
              onValueChange={(v) => updateEdgeData(selectedEdge.id, { connectionType: v })}
            >
              <SelectTrigger className="bg-black border-[#1a1a1a] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#1a1a1a] font-mono text-xs text-zinc-300">
                <SelectItem value="ethernet">Ethernet (Copper)</SelectItem>
                <SelectItem value="fiber">Fiber Optic</SelectItem>
                <SelectItem value="wireless">Wireless</SelectItem>
                <SelectItem value="vpn">VPN / Logical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Label (Optional)</Label>
            <Input 
              value={selectedEdge.data?.label || ''} 
              onChange={(e) => updateEdgeData(selectedEdge.id, { label: e.target.value })}
              placeholder="e.g. trunk, 10G"
              className="bg-black border-[#1a1a1a] font-mono text-xs" 
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
