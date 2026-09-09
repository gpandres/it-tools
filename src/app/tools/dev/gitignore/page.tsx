"use client";

import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Copy, Check, Search, Download, Trash2, Plus } from "lucide-react";
import { GITIGNORE_TEMPLATES } from "@/lib/gitignore-templates";

export default function GitignoreGenerator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const availableTemplates = useMemo(() => {
    return Object.keys(GITIGNORE_TEMPLATES).filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(name)
    );
  }, [searchTerm, selected]);

  const toggleSelect = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(s => s !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  const generatedGitignore = useMemo(() => {
    if (selected.length === 0) return "";
    
    let result = `# Created by Antigravity Toolbox\n# Edit at https://github.com/github/gitignore\n\n`;
    
    selected.forEach(name => {
      result += `### ${name} ###\n`;
      result += GITIGNORE_TEMPLATES[name];
      result += `\n`;
    });
    
    return result;
  }, [selected]);

  const copyToClipboard = async () => {
    if (!generatedGitignore) return;
    await navigator.clipboard.writeText(generatedGitignore);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!generatedGitignore) return;
    const blob = new Blob([generatedGitignore], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.gitignore';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title=".gitignore Generator"
      description="Create useful .gitignore files for your project instantly. 100% offline using standard templates."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
        {/* Left Side: Search and Selection */}
        <div className="space-y-6">
          <div className="space-y-4 border border-[#1a1a1a] p-4 bg-[#050505] rounded-none">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Search className="w-4 h-4" /> Add Templates
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                className="w-full bg-black border border-[#1a1a1a] py-2 pl-10 pr-4 text-zinc-300 font-mono text-sm focus:border-[#00ff9c] focus:outline-none transition-colors placeholder-zinc-700 rounded-none focus-visible:ring-[#00ff9c]"
                placeholder="Search templates (e.g. Node, React, Python...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pt-2">
              {availableTemplates.length === 0 ? (
                <span className="text-xs text-zinc-600 font-mono">No templates found.</span>
              ) : (
                availableTemplates.map(name => (
                  <button
                    key={name}
                    onClick={() => toggleSelect(name)}
                    className="flex items-center gap-1 bg-black border border-zinc-800 hover:border-[#00ff9c] hover:text-[#00ff9c] text-zinc-400 px-3 py-1 text-xs font-mono transition-colors rounded-none"
                  >
                    <Plus className="w-3 h-3" /> {name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 border border-[#1a1a1a] p-4 bg-[#050505] min-h-[150px] rounded-none">
             <h3 className="text-sm font-bold text-[#00ff9c] uppercase tracking-widest flex justify-between items-center">
              <span>Selected ({selected.length})</span>
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-xs text-zinc-500 hover:text-red-500 flex items-center gap-1 font-mono">
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {selected.length === 0 ? (
                <span className="text-xs text-zinc-600 font-mono">Select templates from above.</span>
              ) : (
                selected.map(name => (
                  <button
                    key={name}
                    onClick={() => toggleSelect(name)}
                    className="flex items-center gap-1 bg-[#00ff9c]/10 border border-[#00ff9c] text-[#00ff9c] hover:bg-red-900/20 hover:border-red-500 hover:text-red-500 px-3 py-1 text-xs font-mono transition-colors group rounded-none"
                  >
                    {name} <span className="text-xl leading-none ml-1 opacity-50 group-hover:opacity-100">&times;</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              .gitignore Content
            </h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-[#1a1a1a] hover:bg-[#1a1a1a] text-zinc-400 hover:text-zinc-200 rounded-none"
                disabled={!generatedGitignore}
              >
                {copied ? <Check className="w-3 h-3 mr-2 text-[#00ff9c]" /> : <Copy className="w-3 h-3 mr-2" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                onClick={downloadFile}
                className="h-7 text-xs bg-[#00ff9c] hover:bg-[#00cc7d] text-black disabled:bg-zinc-800 disabled:text-zinc-500 rounded-none"
                disabled={!generatedGitignore}
              >
                <Download className="w-3 h-3 mr-2" /> Download
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full h-[500px] bg-[#050505] border border-[#1a1a1a] p-4 text-[#00ff9c] font-mono text-xs focus:outline-none transition-colors resize-none custom-scrollbar rounded-none focus-visible:ring-[#00ff9c]"
              readOnly
              value={generatedGitignore}
              placeholder="Your .gitignore content will appear here..."
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
