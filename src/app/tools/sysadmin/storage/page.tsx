"use client";

import { Suspense, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { HardDrive, Scale, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

function StorageCalculatorContent() {
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState("TB");

  // Base 10 vs Base 2 Multipliers (relative to Bytes)
  const multipliers: Record<string, number> = {
    "B": 1,
    "KB": 1e3,
    "MB": 1e6,
    "GB": 1e9,
    "TB": 1e12,
    "PB": 1e15,
    "KiB": Math.pow(1024, 1),
    "MiB": Math.pow(1024, 2),
    "GiB": Math.pow(1024, 3),
    "TiB": Math.pow(1024, 4),
    "PiB": Math.pow(1024, 5),
  };

  const parsedValue = parseFloat(value);
  const inputValue = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
  
  // Convert input to raw bytes
  const calculatedBytes = inputValue * (multipliers[unit] || 1);
  const bytes = Number.isFinite(calculatedBytes) ? calculatedBytes : 0;

  const calculate = (targetUnit: string) => {
    return bytes / multipliers[targetUnit];
  };

  const formatResult = (num: number) => {
    if (!isFinite(num)) return "0";
    if (num === 0) return "0";
    
    // Formatting logic: if it's very large or small, toFixed(4), otherwise standard
    const str = num.toFixed(4);
    return parseFloat(str).toString(); // remove trailing zeros
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">
      
      {/* Input */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border border-[#1a1a1a] bg-[#050505] p-6">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 flex items-center gap-2 mb-6">
            <Scale className="w-4 h-4" /> Capacity Input
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400">Value to convert</label>
              <div className="flex gap-2">
                <input 
                  type="number" min="0" step="any"
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  className="flex-1 min-w-0 bg-black border border-[#1a1a1a] p-3 text-[#00ff9c] font-mono text-xl focus:border-[#00ff9c] focus:outline-none transition-colors"
                />
                <select 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)} 
                  className="w-28 shrink-0 bg-black border border-[#1a1a1a] p-3 text-zinc-300 font-mono focus:border-[#00ff9c] focus:outline-none"
                >
                  <optgroup label="Decimal (Base 10)">
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                    <option value="PB">PB</option>
                  </optgroup>
                  <optgroup label="Binary (Base 2)">
                    <option value="KiB">KiB</option>
                    <option value="MiB">MiB</option>
                    <option value="GiB">GiB</option>
                    <option value="TiB">TiB</option>
                    <option value="PiB">PiB</option>
                  </optgroup>
                  <option value="B">Bytes</option>
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { setValue("1"); setUnit("TB") }} variant="ghost" className="h-6 text-[10px] font-mono bg-[#1a1a1a] hover:bg-[#00ff9c]/20 hover:text-[#00ff9c]">1 TB</Button>
              <Button onClick={() => { setValue("500"); setUnit("GB") }} variant="ghost" className="h-6 text-[10px] font-mono bg-[#1a1a1a] hover:bg-[#00ff9c]/20 hover:text-[#00ff9c]">500 GB</Button>
              <Button onClick={() => { setValue("1"); setUnit("TiB") }} variant="ghost" className="h-6 text-[10px] font-mono bg-[#1a1a1a] hover:bg-[#00ff9c]/20 hover:text-[#00ff9c]">1 TiB</Button>
            </div>
          </div>
        </div>

        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex gap-3 text-zinc-400">
          <Info className="w-5 h-5 shrink-0 text-zinc-500" />
          <p className="text-sm font-mono leading-relaxed">
            <strong>Why is my 1TB drive only showing 931GB?</strong>
            <br/><br/>
            Hard drive manufacturers use <strong>Base 10 (Decimal)</strong> where 1 TB = 1,000,000,000,000 bytes.
            <br/><br/>
            Operating Systems (like Windows) use <strong>Base 2 (Binary)</strong> where 1 TiB = 1,099,511,627,776 bytes, but historically label it as &quot;TB&quot;. 
            <br/><br/>
            1 TB (Manufacturer) = 0.909 TiB (OS).
          </p>
        </div>
      </div>

      {/* Output Grid */}
      <div className="lg:col-span-7">
        <div className="border border-[#1a1a1a] bg-[#050505] p-6 h-full">
          <h3 className="text-sm font-bold text-[#00ff9c] glow uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-6">
            Conversions
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Decimal Side */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Decimal (SI)</h4>
              
              <OutputRow label="Kilobytes (KB)" value={formatResult(calculate("KB"))} />
              <OutputRow label="Megabytes (MB)" value={formatResult(calculate("MB"))} />
              <OutputRow label="Gigabytes (GB)" value={formatResult(calculate("GB"))} />
              <OutputRow label="Terabytes (TB)" value={formatResult(calculate("TB"))} />
              <OutputRow label="Petabytes (PB)" value={formatResult(calculate("PB"))} />
            </div>

            {/* Binary Side */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Binary (IEC)</h4>
              
              <OutputRow label="Kibibytes (KiB)" value={formatResult(calculate("KiB"))} highlight={unit === 'TB'} />
              <OutputRow label="Mebibytes (MiB)" value={formatResult(calculate("MiB"))} highlight={unit === 'TB'} />
              <OutputRow label="Gibibytes (GiB)" value={formatResult(calculate("GiB"))} highlight={unit === 'TB'} />
              <OutputRow label="Tebibytes (TiB)" value={formatResult(calculate("TiB"))} highlight={unit === 'TB'} />
              <OutputRow label="Pebibytes (PiB)" value={formatResult(calculate("PiB"))} />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
            <OutputRow label="Raw Bytes" value={bytes.toLocaleString('en-US', { maximumFractionDigits: 0 })} />
          </div>
        </div>
      </div>

    </div>
  );
}

function OutputRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-mono text-zinc-500">{label}</span>
      <span className={`font-mono text-sm break-all ${highlight ? 'text-amber-400 font-bold' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  );
}

export default function StorageCalculatorTool() {
  return (
    <ToolLayout
      title="Storage Capacity Calculator"
      description="Convert between Decimal (GB, TB) and Binary (GiB, TiB) storage units to understand true disk capacity."
    >
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Loading...</div>}>
        <StorageCalculatorContent />
      </Suspense>
    </ToolLayout>
  );
}
