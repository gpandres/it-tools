"use client";

import { useState, type CSSProperties } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function rangeProgress(value: number, min: number, max: number) {
  return `${((value - min) / (max - min)) * 100}%`;
}

export function SliderDemo() {
  const [prefix, setPrefix] = useState(24);
  const [overhead, setOverhead] = useState(15);
  const prefixStyle = { "--tool-range-progress": rangeProgress(prefix, 0, 32) } as CSSProperties;
  const overheadStyle = { "--tool-range-progress": rangeProgress(overhead, 0, 50) } as CSSProperties;

  return (
    <div className="space-y-5">
      <div className="max-w-2xl space-y-3">
        <div className="flex items-end justify-between gap-4">
          <Label htmlFor="design-system-slider" className="text-xs uppercase tracking-wider text-zinc-400">CIDR Prefix</Label>
          <span className="font-mono text-sm font-bold text-[#00ff9c]">[/{prefix}]</span>
        </div>
        <div className="flex items-center gap-4">
          <input id="design-system-slider" type="range" min="0" max="32" value={prefix} onChange={event => setPrefix(Number(event.target.value))} style={prefixStyle} className="tool-range flex-1" />
          <Input aria-label="CIDR value" className="w-20 rounded-none text-center" value={prefix} onChange={event => setPrefix(Math.max(0, Math.min(32, Number(event.target.value) || 0)))} inputMode="numeric" />
        </div>
      </div>
      <div className="max-w-2xl space-y-3 border-t border-[#1a1a1a] pt-4">
        <div className="flex items-end justify-between gap-4"><Label htmlFor="design-system-warning-slider" className="text-xs uppercase tracking-wider text-zinc-400">Storage overhead</Label><span className="font-mono text-sm font-bold text-[#ffb000]">[{overhead}%]</span></div>
        <input id="design-system-warning-slider" type="range" min="0" max="50" step="5" value={overhead} onChange={event => setOverhead(Number(event.target.value))} style={overheadStyle} data-tone="amber" className="tool-range w-full" />
        <p className="text-[10px] text-zinc-400">The selected range is filled; the thumb remains square and visible against the track.</p>
      </div>
    </div>
  );
}
