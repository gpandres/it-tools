"use client";

import React, { useState } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Trash2, Download, ShieldAlert, Loader2 } from "lucide-react";
import { DNS_RECORD_TYPES, mergeDnsRecords, normalizeDnsName, parseDnsAnswers, serializeDnsReconMarkdown, type DnsRecord, type DnsRecordType } from "@/lib/dns-recon";
import { downloadTextFile } from "@/lib/browser-download";

export default function DnsReconPage() {
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [queryDomain, setQueryDomain] = useState('');
  const [queryType, setQueryType] = useState<DnsRecordType>('A');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual Add State
  const [manualDomain, setManualDomain] = useState('');
  const [manualType, setManualType] = useState<DnsRecordType>('A');
  const [manualValue, setManualValue] = useState('');

  const fetchDns = async () => {
    const domain = normalizeDnsName(queryDomain);
    if (!domain) {
      setError("Enter a valid fully-qualified domain name, such as example.com.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${queryType}`, {
        headers: { 'Accept': 'application/dns-json' }
      });
      if (!res.ok) throw new Error("Failed to fetch DNS records.");
      const answers = parseDnsAnswers(await res.json(), queryType);
      if (answers.length > 0) {
        setRecords(current => mergeDnsRecords(current, answers.map(record => ({ ...record, id: crypto.randomUUID() }))));
      } else {
        setError(`No ${queryType} records found for ${domain}.`);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Network error. The DoH endpoint might be blocked.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAdd = () => {
    const domain = normalizeDnsName(manualDomain);
    const value = manualValue.trim().slice(0, 4096);
    if (!domain || !value) {
      setError("Manual records require a valid fully-qualified domain name and a value.");
      return;
    }
    setRecords(current => mergeDnsRecords(current, [{
        id: crypto.randomUUID(),
        domain,
        type: manualType,
        value,
        source: 'Manual',
        notes: ''
      }]));
    setManualValue('');
  };

  const removeRecord = (id: string) => {
    setRecords(current => current.filter(record => record.id !== id));
  };

  const updateNote = (id: string, note: string) => {
    setRecords(current => current.map(record => record.id === id ? { ...record, notes: note.slice(0, 1024) } : record));
  };

  const exportData = (format: 'json' | 'markdown') => {
    const content = format === 'json' ? JSON.stringify(records, null, 2) : serializeDnsReconMarkdown(records);
    downloadTextFile(content, `dns-recon-export.${format === 'json' ? 'json' : 'md'}`, format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8");
  };

  return (
    <ToolLayout
      title="DNS Recon Workspace"
      description="Analyze DNS information and organize authorized reconnaissance data locally."
    >
      <div className="w-full max-w-7xl mx-auto space-y-6">

        {/* DISCLAIMER */}
        <div className="bg-blue-950/30 border border-blue-900/50 rounded-none p-4 flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-200">
            <strong>External Queries Notice:</strong> By default, this workspace is local. If you use the "Resolve" feature, your browser will make a direct HTTPS request to <code>cloudflare-dns.com</code> (DNS over HTTPS) to fetch the records. No data is sent to our servers.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* RESOLVER TOOL */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-none p-4 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Resolve Records (DoH)</h3>
            <div className="flex gap-2">
              <Select value={queryType} onValueChange={(v) => setQueryType(v as DnsRecordType)}>
                <SelectTrigger className="w-[100px] bg-[#111] border-[#333] text-white rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                  {DNS_RECORD_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input 
                value={queryDomain}
                onChange={e => setQueryDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 bg-[#111] border-[#333] font-mono text-sm rounded-none focus-visible:ring-[#00ff9c]"
                onKeyDown={(e) => e.key === 'Enter' && fetchDns()}
              />
              
              <Button onClick={fetchDns} disabled={isLoading} className="bg-[#00ff9c] text-black hover:bg-[#00cc7d] rounded-none">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resolve'}
              </Button>
            </div>
            {error && <div className="text-xs text-red-400 font-mono">{error}</div>}
          </div>

          {/* MANUAL ADD TOOL */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-none p-4 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Manually Add Record</h3>
            <div className="flex gap-2">
              <Select value={manualType} onValueChange={(v) => setManualType(v as DnsRecordType)}>
                <SelectTrigger className="w-[100px] bg-[#111] border-[#333] text-white rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                  {DNS_RECORD_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input 
                value={manualDomain}
                onChange={e => setManualDomain(e.target.value)}
                placeholder="domain"
                className="w-1/3 bg-[#111] border-[#333] font-mono text-sm rounded-none focus-visible:ring-[#00ff9c]"
              />

              <Input 
                value={manualValue}
                onChange={e => setManualValue(e.target.value)}
                placeholder="value / IP"
                className="flex-1 bg-[#111] border-[#333] font-mono text-sm rounded-none focus-visible:ring-[#00ff9c]"
                onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
              />
              
              <Button onClick={handleManualAdd} variant="outline" className="border-[#333] text-zinc-300 hover:text-white rounded-none">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>

        {/* WORKSPACE TABLE */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-none overflow-hidden flex flex-col min-h-[400px]">
          <div className="bg-[#111] border-b border-[#1a1a1a] p-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Workspace Data ({records.length})</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => exportData('markdown')} className="h-6 text-xs text-zinc-400 hover:text-white rounded-none" disabled={records.length === 0}>
                <Download className="w-3 h-3 mr-1" /> MD
              </Button>
              <Button variant="ghost" size="sm" onClick={() => exportData('json')} className="h-6 text-xs text-zinc-400 hover:text-white rounded-none" disabled={records.length === 0}>
                <Download className="w-3 h-3 mr-1" /> JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRecords([])} className="h-6 text-xs text-zinc-400 hover:text-red-400 rounded-none" disabled={records.length === 0}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-[#111] border-b border-[#222]">
                <tr>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3 w-20">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3 w-32">Source</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-600 italic">
                      No records in workspace.
                    </td>
                  </tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="border-b border-[#1a1a1a] hover:bg-[#111]/50">
                      <td className="px-4 py-2 font-mono text-zinc-300">{record.domain}</td>
                      <td className="px-4 py-2 font-mono text-[#00ff9c]">{record.type}</td>
                      <td className="px-4 py-2 font-mono text-zinc-400 break-all">{record.value}</td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {record.source === 'Cloudflare DoH' && <ShieldAlert className="inline w-3 h-3 mr-1" />}
                        {record.source}
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          value={record.notes}
                          onChange={(e) => updateNote(record.id, e.target.value)}
                          placeholder="Add note..."
                          className="h-7 text-xs bg-transparent border-[#333] rounded-none focus-visible:ring-[#00ff9c]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Button variant="ghost" size="icon" onClick={() => removeRecord(record.id)} className="h-6 w-6 text-zinc-600 hover:text-red-400 rounded-none">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
