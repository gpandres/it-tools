"use client";

import React, { useState, useMemo } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Plus, Trash2, ArrowRight, RotateCcw } from "lucide-react";
import { Transformers } from '@/lib/transformers';

type TransformerKey = keyof typeof Transformers;

const AVAILABLE_TRANSFORMS: { id: TransformerKey; name: string }[] = [
  { id: 'urlEncode', name: 'URL Encode' },
  { id: 'urlDecode', name: 'URL Decode' },
  { id: 'base64Encode', name: 'Base64 Encode' },
  { id: 'base64Decode', name: 'Base64 Decode' },
  { id: 'hexEncode', name: 'Hex Encode' },
  { id: 'hexDecode', name: 'Hex Decode' },
  { id: 'htmlEncode', name: 'HTML Entities Encode' },
  { id: 'htmlDecode', name: 'HTML Entities Decode' },
  { id: 'unicodeEncode', name: 'Unicode Escape' },
  { id: 'unicodeDecode', name: 'Unicode Unescape' }
];

export default function PayloadEncoderPage() {
  const [input, setInput] = useState("<script>alert('XSS')</script>");
  const [pipeline, setPipeline] = useState<TransformerKey[]>(['urlEncode']);
  
  const output = useMemo(() => {
    let current = input;
    for (const step of pipeline) {
      if (Transformers[step]) {
        current = Transformers[step](current);
      }
    }
    return current;
  }, [input, pipeline]);

  const addStep = (step: TransformerKey) => {
    setPipeline([...pipeline, step]);
  };

  const removeStep = (index: number) => {
    setPipeline(pipeline.filter((_, i) => i !== index));
  };

  const clearPipeline = () => {
    setPipeline([]);
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <ToolLayout
      title="Payload Encoder"
      description="Encode and transform security testing payloads locally using a processing pipeline."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
        
        {/* PIPELINE CONFIG */}
        <div className="lg:col-span-1 space-y-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Pipeline Steps</h2>
            <Button variant="ghost" size="sm" onClick={clearPipeline} className="h-6 text-xs text-zinc-500 hover:text-red-400">
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </Button>
          </div>

          <div className="space-y-2">
            {pipeline.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#111] border border-[#222] rounded p-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 text-xs text-zinc-300">
                  {AVAILABLE_TRANSFORMS.find(t => t.id === step)?.name || step}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeStep(idx)} className="h-6 w-6 text-zinc-500 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            
            {pipeline.length === 0 && (
              <div className="text-xs text-zinc-600 italic py-4 text-center border border-dashed border-[#222] rounded">
                No transformations applied.<br/>Input will pass through unchanged.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#1a1a1a]">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Add Transformation</h3>
            <Select onValueChange={(v) => addStep(v as TransformerKey)}>
              <SelectTrigger className="w-full bg-[#111] border-[#333] text-white">
                <SelectValue placeholder="Select step to add..." />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                {AVAILABLE_TRANSFORMS.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* INPUT / OUTPUT */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
          <div className="flex-1 min-h-[200px] flex flex-col">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Raw Input</h3>
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#111] border-[#333] font-mono text-xs text-zinc-300 resize-none p-4"
              placeholder="Enter your payload here..."
            />
          </div>

          <div className="flex justify-center text-zinc-600">
            <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
          </div>

          <div className="flex-1 min-h-[200px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Transformed Output</h3>
              <Button variant="ghost" size="sm" onClick={copyOutput} className="h-6 text-xs text-[#00ff9c] hover:bg-transparent">
                <Copy className="w-3 h-3 mr-1" /> Copy Output
              </Button>
            </div>
            <Textarea 
              readOnly
              value={output}
              className="flex-1 bg-[#0a0a0a] border-[#333] font-mono text-xs text-[#00ff9c] resize-none p-4 focus-visible:ring-0"
              placeholder="Output will appear here..."
            />
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
