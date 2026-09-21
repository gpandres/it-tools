"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/components/notification-provider";
import { useState } from "react";
import { Copy } from "lucide-react";
// Basic color conversion helpers
function hexToRgb(hex: string) {
  let c = hex.replace(/^#/, '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return null;
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
  const [values, setValues] = useState({ hex: "#00FF9C", rgb: "0, 255, 156", hsl: "157, 100%, 50%" });
  const [error, setError] = useState<{ field: "hex" | "rgb" | "hsl"; message: string } | null>(null);
  const { notify } = useNotification();
  const previewRgb = error ? null : hexToRgb(values.hex.trim());
  const previewHex = previewRgb ? rgbToHex(previewRgb.r, previewRgb.g, previewRgb.b) : "";

  const update = (field: "hex" | "rgb" | "hsl", value: string) => {
    let color: { r: number; g: number; b: number } | null = null;
    let hslValue = "";
    if (field === "hex") color = hexToRgb(value.trim());
    if (field === "rgb") {
      const match = value.trim().match(/^(?:rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)|(\d+)\s*,\s*(\d+)\s*,\s*(\d+))$/i);
      if (match) {
        const channels = (match[1] === undefined ? match.slice(4, 7) : match.slice(1, 4)).map(Number);
        if (channels.every(channel => channel <= 255)) color = { r: channels[0], g: channels[1], b: channels[2] };
      }
    }
    if (field === "hsl") {
      const text = value.trim().replace(/^hsl\((.*)\)$/i, "$1");
      const match = text.match(/^(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?$/);
      if (match) {
        const [h, s, l] = match.slice(1).map(Number);
        if (h <= 360 && s <= 100 && l <= 100) {
          color = hslToRgb(h, s, l);
          hslValue = `${h}, ${s}%, ${l}%`;
        }
      }
    }
    if (!color) {
      setValues({ hex: "", rgb: "", hsl: "", [field]: value });
      setError(value.trim() ? { field, message: field === "hex" ? "Enter 3 or 6 hexadecimal digits, optionally prefixed with #." : field === "rgb" ? "Enter three whole numbers from 0 to 255, separated by commas." : "Enter hue from 0 to 360 and saturation/lightness from 0 to 100, separated by commas." } : null);
      return;
    }
    const hsl = rgbToHsl(color.r, color.g, color.b);
    setValues({ hex: rgbToHex(color.r, color.g, color.b), rgb: `${color.r}, ${color.g}, ${color.b}`, hsl: hslValue || `${hsl.h}, ${hsl.s}%, ${hsl.l}%`, [field]: value });
    setError(null);
  };

  const copy = async (field: "hex" | "rgb" | "hsl") => {
    if (!previewHex) return;
    const color = previewRgb!;
    const hsl = rgbToHsl(color.r, color.g, color.b);
    const text = field === "hex" ? previewHex : field === "rgb" ? `rgb(${color.r}, ${color.g}, ${color.b})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the color value and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="Color Converter" description="Convert colors between HEX, RGB and HSL. Edit any format or choose a color to update the others.">
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN">Color Formats</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            {(["hex", "rgb", "hsl"] as const).map(field => (
              <ToolField key={field} htmlFor={`color-${field}`} label={field.toUpperCase()} helper={field === "hex" ? "Example: #00FF9C or #0F9" : field === "rgb" ? "Example: 0, 255, 156" : "Example: 157, 100%, 50%. Conversions round to whole RGB channels and HSL values."}>
                <div className="flex min-w-0 items-center gap-2">
                  <Input id={`color-${field}`} value={values[field]} onChange={event => update(field, event.target.value)} spellCheck={false}
                    aria-invalid={error?.field === field} aria-describedby={error?.field === field ? "color-error" : undefined}
                    className="min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                  <ToolActionButton aria-label={`Copy ${field.toUpperCase()}`} disabled={!previewHex} onClick={() => copy(field)}><Copy aria-hidden="true" /></ToolActionButton>
                </div>
              </ToolField>
            ))}
            {error && <ToolStatus id="color-error" tone="error" title={`Invalid ${error.field.toUpperCase()}`}>{error.message}</ToolStatus>}
            <ToolField htmlFor="color-picker" label="Choose a color">
              <input id="color-picker" type="color" value={previewHex || "#000000"} onInput={event => update("hex", event.currentTarget.value)}
                className="h-10 w-full cursor-pointer border border-[#1a1a1a] bg-black p-1 focus-visible:outline-2 focus-visible:outline-[#00ff9c]" />
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Preview</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {previewHex ? <>
              <div role="img" aria-label={`Color preview ${previewHex}`} className="h-64 w-full border border-[#2a2a2a]" style={{ backgroundColor: previewHex }} />
              <p className="text-center text-sm text-zinc-300">{previewHex}</p>
            </> : <ToolEmptyState title={error ? "Fix the color to continue" : "Awaiting color"}>Enter a valid color in any format or use the color picker.</ToolEmptyState>}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
