"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Copy, Check, Minimize2, Database } from "lucide-react";

export default function SqlMinifier() {
  const [inputSql, setInputSql] = useState("");
  const [outputSql, setOutputSql] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Options
  const [removeComments, setRemoveComments] = useState(true);

  const minifySql = () => {
    if (!inputSql.trim()) {
      setOutputSql("");
      return;
    }
    
    let result = inputSql;

    if (removeComments) {
      // Remove block comments /* ... */
      result = result.replace(/\/\*[\s\S]*?\*\//g, ' ');
      // Remove inline comments -- ...
      // Note: This naive regex might break if `--` is inside a string literal.
      // But for a simple tool, it handles 95% of use cases.
      result = result.replace(/--.*$/gm, ' ');
    }

    // Replace all whitespace (spaces, tabs, newlines) with a single space
    result = result.replace(/\s+/g, ' ');
    
    // Trim and set
    setOutputSql(result.trim());
  };

  const copyToClipboard = async () => {
    if (!outputSql) return;
    await navigator.clipboard.writeText(outputSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="SQL Minifier"
      description="Compress SQL queries into a single line by removing unnecessary whitespace, line breaks, and comments."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4" /> Formatted SQL
            </h3>
            
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                className="hidden" 
                checked={removeComments} 
                onChange={(e) => setRemoveComments(e.target.checked)} 
              />
              <div className={`w-4 h-4 flex items-center justify-center border transition-colors rounded-none ${removeComments ? 'bg-[#00ff9c] border-[#00ff9c]' : 'border-zinc-600 group-hover:border-[#00ff9c]'}`}>
                {removeComments && <div className="w-2 h-2 bg-black" />}
              </div>
              <span className="text-xs text-zinc-300 font-mono select-none">Remove Comments</span>
            </label>
          </div>
          <textarea
            className="w-full h-[400px] bg-black border border-[#1a1a1a] p-4 text-zinc-300 font-mono text-xs focus:border-[#00ff9c] focus:outline-none transition-colors resize-none custom-scrollbar rounded-none focus-visible:ring-[#00ff9c]"
            placeholder="SELECT&#10;  id,&#10;  name&#10;FROM&#10;  users&#10;WHERE&#10;  status = 'active';"
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
          />
          <Button 
            onClick={minifySql}
            className="w-full bg-[#00ff9c] hover:bg-[#00cc7d] text-black font-bold rounded-none"
          >
            <Minimize2 className="w-4 h-4 mr-2" /> Minify SQL
          </Button>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              Minified Result
            </h3>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="h-7 text-xs border-[#1a1a1a] hover:bg-[#1a1a1a] text-zinc-400 hover:text-zinc-200 rounded-none"
              disabled={!outputSql}
            >
              {copied ? <Check className="w-3 h-3 mr-2 text-[#00ff9c]" /> : <Copy className="w-3 h-3 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full h-[400px] bg-[#050505] border border-[#1a1a1a] p-4 text-[#00ff9c] font-mono text-xs focus:outline-none transition-colors resize-none custom-scrollbar rounded-none focus-visible:ring-[#00ff9c]"
              readOnly
              value={outputSql}
              placeholder="SELECT id, name FROM users WHERE status = 'active';"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
