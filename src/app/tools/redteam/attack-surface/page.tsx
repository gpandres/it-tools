"use client";

import React, { useState, useMemo } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, Globe, Link2, Plus, Trash2, Bug, Download, ShieldAlert, Cpu } from "lucide-react";
import Link from 'next/link';

type NodeType = 'Domain' | 'Subdomain' | 'Directory' | 'Endpoint';
type Severity = 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';

interface Finding {
  id: string;
  title: string;
  severity: Severity;
}

interface SurfaceNode {
  id: string;
  parentId: string | null;
  name: string;
  type: NodeType;
  method?: string; // For endpoints
  tech: string[];
  findings: Finding[];
}

export default function AttackSurfaceMapperPage() {
  const [nodes, setNodes] = useState<SurfaceNode[]>([
    { id: 'root', parentId: null, name: 'example.com', type: 'Domain', tech: ['Cloudflare'], findings: [] }
  ]);
  
  // Selection
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  
  // Add Node State
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<NodeType>('Subdomain');
  
  // New Finding State
  const [findingTitle, setFindingTitle] = useState('');
  const [findingSev, setFindingSev] = useState<Severity>('Low');

  // New Tech State
  const [newTech, setNewTech] = useState('');

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const addNode = (parentId: string) => {
    if (!newNodeName.trim()) return;
    const newNode: SurfaceNode = {
      id: Math.random().toString(36).substring(7),
      parentId,
      name: newNodeName.trim(),
      type: newNodeType,
      tech: [],
      findings: []
    };
    setNodes([...nodes, newNode]);
    setNewNodeName('');
  };

  const removeNode = (id: string) => {
    // Need to recursively remove children
    const getChildrenIds = (parentId: string): string[] => {
      const children = nodes.filter(n => n.parentId === parentId);
      return children.flatMap(c => [c.id, ...getChildrenIds(c.id)]);
    };
    const idsToRemove = [id, ...getChildrenIds(id)];
    setNodes(nodes.filter(n => !idsToRemove.includes(n.id)));
    if (idsToRemove.includes(selectedNodeId)) {
      setSelectedNodeId(nodes.find(n => !idsToRemove.includes(n.id))?.id || '');
    }
  };

  const addFinding = (nodeId: string) => {
    if (!findingTitle.trim()) return;
    setNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          findings: [...n.findings, { id: Math.random().toString(36).substring(7), title: findingTitle, severity: findingSev }]
        };
      }
      return n;
    }));
    setFindingTitle('');
  };

  const removeFinding = (nodeId: string, findingId: string) => {
    setNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, findings: n.findings.filter(f => f.id !== findingId) };
      }
      return n;
    }));
  };

  const addTech = (nodeId: string) => {
    if (!newTech.trim()) return;
    setNodes(nodes.map(n => {
      if (n.id === nodeId && !n.tech.includes(newTech.trim())) {
        return { ...n, tech: [...n.tech, newTech.trim()] };
      }
      return n;
    }));
    setNewTech('');
  };

  const removeTech = (nodeId: string, tech: string) => {
    setNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, tech: n.tech.filter(t => t !== tech) };
      }
      return n;
    }));
  };

  // Render Tree visually
  const renderTree = (parentId: string | null, depth = 0) => {
    const children = nodes.filter(n => n.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className="space-y-1">
        {children.map(child => (
          <div key={child.id}>
            <div 
              className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${selectedNodeId === child.id ? 'bg-[#333]' : 'hover:bg-[#1a1a1a]'}`}
              style={{ paddingLeft: `${(depth * 16) + 8}px` }}
              onClick={() => setSelectedNodeId(child.id)}
            >
              <div className="text-zinc-500">
                {child.type === 'Domain' && <Globe className="w-3 h-3" />}
                {child.type === 'Subdomain' && <Globe className="w-3 h-3" />}
                {child.type === 'Directory' && <Folder className="w-3 h-3" />}
                {child.type === 'Endpoint' && <Link2 className="w-3 h-3 text-[#00ff9c]" />}
              </div>
              <span className={`text-sm ${child.type === 'Endpoint' ? 'text-zinc-400 font-mono' : 'text-zinc-200'}`}>
                {child.name}
              </span>
              {child.findings.length > 0 && (
                <div className="ml-auto bg-red-900/50 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center">
                  <Bug className="w-2 h-2 mr-1" /> {child.findings.length}
                </div>
              )}
            </div>
            {renderTree(child.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  const exportMarkdown = () => {
    let md = "# Attack Surface Map\n\n";
    
    const buildMdTree = (parentId: string | null, depth = 0) => {
      const children = nodes.filter(n => n.parentId === parentId);
      children.forEach(child => {
        const indent = "  ".repeat(depth);
        md += `${indent}- **${child.name}** (${child.type})\n`;
        if (child.tech.length > 0) md += `${indent}  - Tech: ${child.tech.join(", ")}\n`;
        if (child.findings.length > 0) {
          child.findings.forEach(f => {
            md += `${indent}  - [${f.severity}] ${f.title}\n`;
          });
        }
        buildMdTree(child.id, depth + 1);
      });
    };
    buildMdTree(null, 0);

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attack-surface.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (sev: Severity) => {
    switch(sev) {
      case 'Critical': return 'text-purple-400 bg-purple-900/30 border-purple-900/50';
      case 'High': return 'text-red-400 bg-red-900/30 border-red-900/50';
      case 'Medium': return 'text-amber-400 bg-amber-900/30 border-amber-900/50';
      case 'Low': return 'text-blue-400 bg-blue-900/30 border-blue-900/50';
      case 'Info': return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <ToolLayout
      title="Attack Surface Mapper"
      description="Map assets, endpoints, technologies and findings during an authorized security assessment."
    >
      <div className="w-full max-w-7xl mx-auto space-y-6">

        {/* TOP BAR / EXPORT */}
        <div className="flex justify-between items-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00ff9c]" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Asset Map</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportMarkdown} className="h-7 text-xs bg-transparent border-[#333] text-zinc-300 hover:text-white">
              <Download className="w-3 h-3 mr-1" /> Export MD
            </Button>
            <Link href="/tools/security/incident-report">
              <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-[#333] text-zinc-300 hover:text-white">
                Incident Report
              </Button>
            </Link>
            <Link href="/tools/security/investigation">
              <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-[#333] text-zinc-300 hover:text-white">
                Investigation Workspace
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TREE VIEW */}
          <div className="lg:col-span-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 min-h-[500px]">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-[#1a1a1a] pb-2">Architecture Tree</h3>
            <div className="font-mono">
              {renderTree(null)}
            </div>
            {nodes.length === 0 && (
              <div className="text-center text-xs text-zinc-600 mt-10">
                Tree is empty.
              </div>
            )}
          </div>

          {/* NODE DETAILS */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 space-y-8">
            
            {selectedNode ? (
              <>
                {/* NODE HEADER */}
                <div className="flex justify-between items-start border-b border-[#1a1a1a] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {selectedNode.type === 'Endpoint' && <Link2 className="w-5 h-5 text-[#00ff9c]" />}
                      {selectedNode.name}
                    </h2>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{selectedNode.type}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeNode(selectedNode.id)} className="h-8 text-xs text-zinc-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete Node
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ADD CHILD NODE */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-[#00ff9c] uppercase tracking-wider">Add Child Node</h3>
                    <div className="flex gap-2">
                      <Select value={newNodeType} onValueChange={(v) => setNewNodeType(v as NodeType)}>
                        <SelectTrigger className="w-[110px] h-8 text-xs bg-[#111] border-[#333] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#333] text-white">
                          <SelectItem value="Domain">Domain</SelectItem>
                          <SelectItem value="Subdomain">Subdomain</SelectItem>
                          <SelectItem value="Directory">Directory</SelectItem>
                          <SelectItem value="Endpoint">Endpoint</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        value={newNodeName}
                        onChange={e => setNewNodeName(e.target.value)}
                        placeholder="Name (e.g. /api or dev.ex.com)"
                        className="flex-1 h-8 bg-[#111] border-[#333] text-xs font-mono"
                        onKeyDown={e => e.key === 'Enter' && addNode(selectedNode.id)}
                      />
                      <Button onClick={() => addNode(selectedNode.id)} size="sm" className="h-8 bg-[#333] hover:bg-[#444] text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* TECHNOLOGIES */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-[#00ff9c] uppercase tracking-wider">Technologies</h3>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        value={newTech}
                        onChange={e => setNewTech(e.target.value)}
                        placeholder="Nginx, PHP, React..."
                        className="flex-1 h-8 bg-[#111] border-[#333] text-xs"
                        onKeyDown={e => e.key === 'Enter' && addTech(selectedNode.id)}
                      />
                      <Button onClick={() => addTech(selectedNode.id)} size="sm" className="h-8 bg-[#333] hover:bg-[#444] text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.tech.map(t => (
                        <div key={t} className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-zinc-300">
                          <Cpu className="w-3 h-3 text-zinc-500" />
                          {t}
                          <Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-400 cursor-pointer ml-1" onClick={() => removeTech(selectedNode.id, t)} />
                        </div>
                      ))}
                      {selectedNode.tech.length === 0 && <span className="text-xs text-zinc-600 italic">No technologies added.</span>}
                    </div>
                  </div>
                </div>

                {/* FINDINGS */}
                <div className="space-y-4 pt-6 border-t border-[#1a1a1a]">
                  <h3 className="text-[10px] font-bold text-[#00ff9c] uppercase tracking-wider flex items-center gap-2">
                    <Bug className="w-3 h-3" /> Security Findings
                  </h3>
                  
                  <div className="flex gap-2">
                    <Select value={findingSev} onValueChange={(v) => setFindingSev(v as Severity)}>
                      <SelectTrigger className="w-[110px] h-8 text-xs bg-[#111] border-[#333] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-[#333] text-white">
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      value={findingTitle}
                      onChange={e => setFindingTitle(e.target.value)}
                      placeholder="e.g. Open Directory Listing"
                      className="flex-1 h-8 bg-[#111] border-[#333] text-xs"
                      onKeyDown={e => e.key === 'Enter' && addFinding(selectedNode.id)}
                    />
                    <Button onClick={() => addFinding(selectedNode.id)} size="sm" className="h-8 bg-[#333] hover:bg-[#444] text-white">
                      Add Finding
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4">
                    {selectedNode.findings.map(finding => (
                      <div key={finding.id} className={`flex items-center justify-between p-2 rounded border ${getSeverityColor(finding.severity)}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider">{finding.severity}</span>
                          <span className="text-sm font-medium">{finding.title}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFinding(selectedNode.id, finding.id)} className="h-6 w-6 hover:bg-black/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {selectedNode.findings.length === 0 && <div className="text-xs text-zinc-600 italic">No findings reported for this node.</div>}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <Globe className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a node from the tree to view or edit details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
