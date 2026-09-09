import { useState } from 'react';
import { IOC, IOCType, IOCTag } from './types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Copy, Shield, Plus } from "lucide-react";
import { useNotification } from "@/components/notification-provider";
import { ToolField } from "@/components/tool-design";

interface IOCManagerProps {
  iocs: IOC[];
  onChange: (iocs: IOC[]) => void;
}

export default function IOCManager({ iocs, onChange }: IOCManagerProps) {
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<IOCType>("ip");
  const { notify } = useNotification();

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Indicator copied to clipboard.");
    } catch {
      notify("Clipboard access is unavailable in this browser.", "error");
    }
  };

  const getTagColor = (tag: IOCTag) => {
    switch(tag) {
      case 'malicious': return 'text-red-400 border-red-900 bg-red-950/20';
      case 'suspicious': return 'text-[#ffb000] border-[#795c19] bg-[#795c19]/20';
      case 'benign': return 'text-[#00ff9c] border-[#176b52] bg-[#176b52]/20';
      default: return 'text-zinc-400 border-[#1a1a1a] bg-black';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add IOC Form */}
      <div className="border border-[#1a1a1a] bg-[#050505] p-4">
        <ToolField htmlFor="ioc-input" label="Add New Indicator">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input 
              id="ioc-input"
              placeholder="Paste IP, Domain, Hash, URL..." 
              value={newValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIOC()}
              className="flex-1 rounded-none border-[#1a1a1a] bg-black font-mono text-sm focus-visible:ring-[#00ff9c]"
            />
            <Select value={newType} onValueChange={(v) => setNewType(v as IOCType)}>
              <SelectTrigger className="w-full sm:w-[120px] rounded-none border-[#1a1a1a] bg-black font-mono text-xs uppercase tracking-widest text-zinc-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#1a1a1a] bg-black">
                <SelectItem value="ip">IP</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="hash">Hash</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={addIOC} 
              variant="outline"
              className="rounded-none border-[#1a1a1a] bg-black text-zinc-300 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]"
            >
              <Plus className="mr-2 h-4 w-4" /> Add IOC
            </Button>
          </div>
        </ToolField>
      </div>

      {/* IOC Grid */}
      <div className="border border-[#1a1a1a] bg-[#050505]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-[#1a1a1a] bg-[#0a0a0a] text-xs uppercase tracking-widest text-zinc-500 font-mono">
              <tr>
                <th className="px-4 py-3 font-normal">Type</th>
                <th className="px-4 py-3 font-normal">Indicator</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a] bg-[#050505]">
              {iocs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-mono text-xs text-zinc-500">
                    No indicators added yet.
                  </td>
                </tr>
              )}
              {iocs.map(ioc => (
                <tr key={ioc.id} className="transition-colors hover:bg-[#1a1a1a]/50">
                  <td className="px-4 py-3">
                    <span className="border border-[#1a1a1a] bg-black px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#00ff9c]">
                      {ioc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-200">
                    {ioc.value}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={ioc.tag} onValueChange={(v) => updateTag(ioc.id, v as IOCTag)}>
                      <SelectTrigger className={`h-7 w-[110px] rounded-none border font-mono text-[10px] uppercase tracking-wider ${getTagColor(ioc.tag)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-[#1a1a1a] bg-black">
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="malicious">Malicious</SelectItem>
                        <SelectItem value="suspicious">Suspicious</SelectItem>
                        <SelectItem value="benign">Benign</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10" onClick={() => copyToClipboard(ioc.value)} title="Copy raw">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-zinc-400 hover:text-[#ffb000] hover:bg-[#ffb000]/10" onClick={() => copyToClipboard(defang(ioc.value, ioc.type))} title="Copy defanged">
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-zinc-400 hover:bg-red-950/20 hover:text-red-400" onClick={() => removeIOC(ioc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
