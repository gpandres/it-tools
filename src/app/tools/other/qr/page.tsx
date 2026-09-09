"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { Download, Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";

export default function QrGenerator() {
  const [format, setFormat] = useState<"text" | "wifi" | "email" | "sms">("text");
  
  // Format specific states
  const [textValue, setTextValue] = useState("https://andresgp.dev");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMsg, setSmsMsg] = useState("");

  const [fgColor, setFgColor] = useState("#00ff9c");
  const [bgColor, setBgColor] = useState("#000000");
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [size, setSize] = useState(300);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(60);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadPNG = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    
    // Create a temporary link to trigger download
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getQrValue = () => {
    switch (format) {
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "sms":
        return `SMSTO:${smsPhone}:${smsMsg}`;
      case "text":
      default:
        return textValue;
    }
  };

  const currentQrValue = getQrValue();

  return (
    <ToolLayout 
      title="QR Code Generator (Pro)" 
      description="Generate high-quality QR codes with custom colors, embedded logos, and specific formats (WiFi, vCard, etc)."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Controls */}
        <article className="xl:col-span-1 border border-[#1a1a1a] bg-[#050505] flex flex-col h-fit sticky top-24 rounded-none">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN]</span>
            <span className="text-[#00ff9c] text-sm font-semibold uppercase tracking-widest">Configuration</span>
          </header>
          <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar max-h-[calc(100vh-250px)]">
            
            {/* Format Selector */}
            <div className="space-y-3">
              <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Format</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["text", "wifi", "email", "sms"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`text-center px-2 py-1.5 font-mono text-xs border transition-colors rounded-none ${format === f ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Inputs based on format */}
            {format === "text" && (
              <div className="space-y-3">
                <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Content (URL or Text)</Label>
                <Textarea
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Enter URL or text..."
                  className="font-mono text-sm bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200 min-h-[100px] resize-none"
                />
              </div>
            )}

            {format === "wifi" && (
              <div className="space-y-4 bg-black p-4 border border-[#1a1a1a] rounded-none">
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">SSID (Network Name)</Label>
                  <Input value={wifiSsid} onChange={e => setWifiSsid(e.target.value)} className="font-mono text-sm bg-[#050505] border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200" placeholder="MyWiFiNetwork" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Password</Label>
                  <Input type="password" value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} className="font-mono text-sm bg-[#050505] border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Encryption</Label>
                    <select 
                      value={wifiEncryption} 
                      onChange={e => setWifiEncryption(e.target.value as any)}
                      className="w-full font-mono text-sm bg-[#050505] border border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200 h-10 px-3 outline-none"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox" 
                      id="hidden-wifi"
                      checked={wifiHidden} 
                      onChange={e => setWifiHidden(e.target.checked)}
                      className="w-4 h-4 bg-[#050505] border-[#1a1a1a] rounded-none accent-[#00ff9c]"
                    />
                    <Label htmlFor="hidden-wifi" className="text-xs font-mono text-zinc-400 cursor-pointer">Hidden Network</Label>
                  </div>
                </div>
              </div>
            )}

            {format === "email" && (
              <div className="space-y-4 bg-black p-4 border border-[#1a1a1a] rounded-none">
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">To (Email Address)</Label>
                  <Input value={emailTo} onChange={e => setEmailTo(e.target.value)} className="font-mono text-sm bg-[#050505] border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200" placeholder="hello@example.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Subject</Label>
                  <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="font-mono text-sm bg-[#050505] border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200" placeholder="Important message" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Body</Label>
                  <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} className="font-mono text-sm bg-[#050505] border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200 min-h-[80px]" placeholder="Hi there..." />
                </div>
              </div>
            )}

            {format === "sms" && (
              <div className="space-y-4 bg-black p-4 border border-[#1a1a1a] rounded-none">
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Phone Number</Label>
                  <Input value={smsPhone} onChange={e => setSmsPhone(e.target.value)} className="font-mono text-sm bg-[#050505] border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200" placeholder="+1234567890" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Message</Label>
                  <Textarea value={smsMsg} onChange={e => setSmsMsg(e.target.value)} className="font-mono text-sm bg-[#050505] border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] text-zinc-200 min-h-[80px]" placeholder="Text message content..." />
                </div>
              </div>
            )}

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Foreground</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={fgColor} 
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-none border border-[#1a1a1a] bg-black cursor-pointer p-0"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="font-mono text-xs bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-8 px-2 uppercase"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Background</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-none border border-[#1a1a1a] bg-black cursor-pointer p-0"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="font-mono text-xs bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-8 px-2 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Error Correction */}
            <div className="space-y-3">
              <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Error Correction</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["L", "M", "Q", "H"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`text-center px-2 py-1.5 font-mono text-xs border transition-colors rounded-none ${level === l ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                    title={l === "L" ? "Low (~7%)" : l === "M" ? "Medium (~15%)" : l === "Q" ? "Quartile (~25%)" : "High (~30%) - Recommended for logos"}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Embedded Logo</Label>
                {logoUrl && (
                  <button onClick={removeLogo} className="text-red-400 text-[10px] font-mono hover:underline flex items-center">
                    <X className="w-3 h-3 mr-1" /> Remove
                  </button>
                )}
              </div>
              
              <div 
                className={`border-2 border-dashed ${logoUrl ? 'border-[#00ff9c]/50 bg-[#00ff9c]/5' : 'border-[#1a1a1a] bg-black'} p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#00ff9c]/30 transition-colors rounded-none`}
                onClick={() => fileInputRef.current?.click()}
              >
                {logoUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Logo preview" className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-mono text-[#00ff9c]">Click to change image</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-zinc-600" />
                    <span className="text-[10px] font-mono text-zinc-500 text-center">Upload PNG, JPG, or SVG<br/>Max 1MB recommended</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                accept="image/png, image/jpeg, image/svg+xml" 
                className="hidden" 
              />

              {logoUrl && (
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono text-zinc-600">Logo Size</Label>
                    <span className="text-[10px] font-mono text-zinc-400">{logoSize}px</span>
                  </div>
                  <input
                    type="range" 
                    min={20} 
                    max={120} 
                    value={logoSize} 
                    onChange={(e) => setLogoSize(parseInt(e.target.value))}
                    className="w-full accent-[#00ff9c] cursor-pointer"
                  />
                  {level !== "H" && logoSize > 60 && (
                    <span className="text-[10px] font-mono text-[#ffb000]">Warning: Large logos may make the QR unreadable. Set Error Correction to 'H'.</span>
                  )}
                </div>
              )}
            </div>

          </div>
        </article>

        {/* Output */}
        <article className="xl:col-span-2 border border-[#1a1a1a] bg-[#050505] flex flex-col min-h-[500px] rounded-none">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Rendered QR</span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs font-mono rounded-none text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors border border-[#00ff9c]/30 hover:border-[#00ff9c]"
              onClick={downloadPNG}
            >
              <Download className="w-3 h-3 mr-2" /> Download PNG
            </Button>
          </header>
          <div className="p-8 flex-1 flex flex-col items-center justify-center bg-zinc-950 dotted-bg">
            <div className="relative group p-4 bg-white/5 border border-white/10 shadow-2xl flex items-center justify-center min-w-[320px] min-h-[320px]">
              {currentQrValue ? (
                <QRCodeCanvas
                  id="qr-code-canvas"
                  value={currentQrValue}
                  size={size}
                  level={level}
                  bgColor={bgColor}
                  fgColor={fgColor}
                  includeMargin={false}
                  imageSettings={logoUrl ? {
                    src: logoUrl,
                    x: undefined,
                    y: undefined,
                    height: logoSize,
                    width: logoSize,
                    excavate: true,
                  } : undefined}
                />
              ) : (
                <div className="text-zinc-600 font-mono text-sm flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 opacity-20" />
                  <span>Awaiting valid input...</span>
                </div>
              )}
            </div>
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}
