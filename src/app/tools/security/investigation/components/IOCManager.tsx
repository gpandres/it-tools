import { useState } from 'react';
import { IOC, IOCType, IOCTag } from './types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Copy, Shield, Plus } from "lucide-react";
import { useNotification } from "@/components/notification-provider";

interface IOCManagerProps {
  iocs: IOC[];
  onChange: (iocs: IOC[]) => void;
}

export default function IOCManager({ iocs, onChange }: IOCManagerProps) {
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<IOCType>("ip");
  const { notify } = useNotification();

  // Auto-detect IOC type if user just pastes something
  const handleValueChange = (val: string) => {
    setNewValue(val);
    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(val)) setNewType('ip');
    else if (/^[a-fA-F0-9]{32,64}$/.test(val)) setNewType('hash');
    else if (/^https?:\/\//.test(val)) setNewType('url');
    else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) setNewType('email');
    else if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) setNewType('domain');
  };

  const addIOC = () => {
    const value = newValue.trim();
    if (!value) {
      notify("Enter an indicator before adding it.", "error");
      return;
    }
    if (iocs.length >= 500) {
      notify("An investigation can contain up to 500 indicators.", "error");
      return;
    }
    if (iocs.some((ioc) => ioc.type === newType && ioc.value.trim().toLowerCase() === value.toLowerCase())) {
      notify("That indicator is already in this investigation.", "error");
      return;
    }
    const newIOC: IOC = {
      id: crypto.randomUUID(),
      type: newType,
      value,
      tag: 'unknown',
      timestamp: Date.now()
    };
    onChange([newIOC, ...iocs]);
    setNewValue("");
  };

  const removeIOC = (id: string) => {
    onChange(iocs.filter(ioc => ioc.id !== id));
  };

  const updateTag = (id: string, tag: IOCTag) => {
    onChange(iocs.map(ioc => ioc.id === id ? { ...ioc, tag } : ioc));
  };

  const defang = (val: string, type: IOCType) => {
    let defanged = val;
    if (type === 'ip') defanged = val.replace(/\./g, '[.]');
    else if (type === 'url' || type === 'domain') {
      defanged = val.replace(/\./g, '[.]').replace(/http/ig, 'hxxp');
    }
    return defanged;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTagColor = (tag: IOCTag) => {
    switch(tag) {
      case 'malicious': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'suspicious': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'benign': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Add IOC Form */}
      <div className="flex gap-2 p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
        <Input 
          placeholder="Paste IP, Domain, Hash, URL..." 
          value={newValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIOC()}
          className="bg-black border-[#333] font-mono text-sm"
        />
        <Select value={newType} onValueChange={(v) => setNewType(v as IOCType)}>
          <SelectTrigger className="w-[120px] bg-black border-[#333]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-[#333]">
            <SelectItem value="ip">IP</SelectItem>
            <SelectItem value="domain">Domain</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="hash">Hash</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={addIOC} className="bg-[#00ff9c] text-black hover:bg-[#00cc7a] whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" /> Add IOC
        </Button>
      </div>

      {/* IOC Grid */}
      <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs text-zinc-500 uppercase bg-[#0a0a0a] border-b border-[#1a1a1a]">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Indicator</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a] bg-black">
            {iocs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No indicators added yet.
                </td>
              </tr>
            )}
            {iocs.map(ioc => (
              <tr key={ioc.id} className="hover:bg-[#0a0a0a] transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 uppercase">
                    {ioc.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {ioc.value}
                </td>
                <td className="px-4 py-3">
                  <Select value={ioc.tag} onValueChange={(v) => updateTag(ioc.id, v as IOCTag)}>
                    <SelectTrigger className={`w-[110px] h-7 text-xs border ${getTagColor(ioc.tag)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-[#333]">
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="malicious">Malicious</SelectItem>
                      <SelectItem value="suspicious">Suspicious</SelectItem>
                      <SelectItem value="benign">Benign</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => copyToClipboard(ioc.value)} title="Copy raw">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-400" onClick={() => copyToClipboard(defang(ioc.value, ioc.type))} title="Copy defanged">
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400" onClick={() => removeIOC(ioc.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
