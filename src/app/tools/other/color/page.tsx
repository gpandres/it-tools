"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Basic color conversion helpers
function hexToRgb(hex: string) {
  let c = hex.replace(/^#/, '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return null;
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export default function ColorConverter() {
  const [hex, setHex] = useState("#00FF9C");
  const [rgb, setRgb] = useState("0, 255, 156");
  const [hsl, setHsl] = useState("157, 100%, 50%");
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleHex = (val: string) => {
    setHex(val.toUpperCase());
    const rgbObj = hexToRgb(val);
    if (rgbObj) {
      setRgb(`${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`);
      const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
      setHsl(`${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%`);
    }
  };

  const handleRgb = (val: string) => {
    setRgb(val);
    const nums = val.replace(/[^\d,]/g, "").split(",").map(Number);
    if (nums.length === 3 && nums.every(n => n >= 0 && n <= 255)) {
      const hx = rgbToHex(nums[0], nums[1], nums[2]);
      setHex(hx);
      const hslObj = rgbToHsl(nums[0], nums[1], nums[2]);
      setHsl(`${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%`);
    }
  };

  const handleHsl = (val: string) => {
    setHsl(val);
    const nums = val.replace(/[^\d,]/g, "").split(",").map(Number);
    if (nums.length === 3 && nums[0] >= 0 && nums[0] <= 360 && nums[1] >= 0 && nums[1] <= 100 && nums[2] >= 0 && nums[2] <= 100) {
      const rgbObj = hslToRgb(nums[0], nums[1], nums[2]);
      setRgb(`${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`);
      setHex(rgbToHex(rgbObj.r, rgbObj.g, rgbObj.b));
    }
  };

  return (
    <ToolLayout 
      title="Color Converter" 
      description="Synchronized color converter for HEX, RGB, and HSL formats."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        
        {/* Controls */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Formats</span>
          </header>
          <div className="p-6 flex flex-col gap-6">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">HEX</Label>
                <button onClick={() => copy(hex, "hex")} className="text-[#00ff9c] text-[10px] font-mono hover:underline">
                  {copiedKey === "hex" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="relative">
                <input 
                  type="color" 
                  value={hex.length === 7 ? hex : "#000000"} 
                  onChange={(e) => handleHex(e.target.value)}
                  className="absolute left-1 top-1 w-10 h-10 cursor-pointer opacity-0"
                />
                <div 
                  className="absolute left-2 top-2 w-8 h-8 pointer-events-none border border-zinc-800"
                  style={{ backgroundColor: hex.length === 7 ? hex : "transparent" }}
                />
                <Input
                  type="text"
                  value={hex}
                  onChange={(e) => handleHex(e.target.value)}
                  placeholder="#000000"
                  className="w-full font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-12 text-zinc-200 pl-12 uppercase"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">RGB</Label>
                <button onClick={() => copy(`rgb(${rgb})`, "rgb")} className="text-[#00ff9c] text-[10px] font-mono hover:underline">
                  {copiedKey === "rgb" ? "Copied" : "Copy"}
                </button>
              </div>
              <Input
                type="text"
                value={rgb}
                onChange={(e) => handleRgb(e.target.value)}
                placeholder="255, 255, 255"
                className="w-full font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-12 text-zinc-200"
                spellCheck={false}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">HSL</Label>
                <button onClick={() => copy(`hsl(${hsl})`, "hsl")} className="text-[#00ff9c] text-[10px] font-mono hover:underline">
                  {copiedKey === "hsl" ? "Copied" : "Copy"}
                </button>
              </div>
              <Input
                type="text"
                value={hsl}
                onChange={(e) => handleHsl(e.target.value)}
                placeholder="360, 100%, 100%"
                className="w-full font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-12 text-zinc-200"
                spellCheck={false}
              />
            </div>

          </div>
        </article>

        {/* Preview */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col h-[400px] lg:h-auto">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-blue-400 text-xs">[OUT]</span>
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest">Preview</span>
          </header>
          <div className="p-8 flex-1 flex items-center justify-center dotted-bg relative">
            <div 
              className="absolute inset-0 opacity-20"
              style={{ backgroundColor: hex.length === 7 ? hex : "transparent" }}
            />
            <div 
              className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 transition-colors duration-200 ease-in-out"
              style={{ 
                backgroundColor: hex.length === 7 ? hex : "transparent",
                boxShadow: hex.length === 7 ? `0 0 80px ${hex}40` : 'none'
              }}
            />
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}
