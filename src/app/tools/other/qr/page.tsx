"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotification } from "@/components/notification-provider";
import { ToolActionButton, ToolActionPanel, ToolEmptyState, ToolField, ToolFileDropzone, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";

const control = "rounded-none border-[#1a1a1a] bg-black! text-zinc-300";
const formats = ["text", "wifi", "email", "sms"] as const;
const levels = ["L", "M", "Q", "H"] as const;
const escapeWifi = (value: string) => value.replace(/[\\;,:\"]/g, "\\$&");

export default function QrGenerator() {
  const [format, setFormat] = useState<typeof formats[number]>("text");
  const [values, setValues] = useState({ text: "https://andresgp.dev", ssid: "", password: "", to: "", subject: "", body: "", phone: "", message: "" });
  const setValue = (key: keyof typeof values, value: string) => setValues(previous => ({ ...previous, [key]: value }));
  const [encryption, setEncryption] = useState("WPA");
  const [hidden, setHidden] = useState(false);
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [level, setLevel] = useState<typeof levels[number]>("H");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(60);
  const [logoError, setLogoError] = useState("");
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoInputKey, setLogoInputKey] = useState(0);
  const uploadVersion = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { notify } = useNotification();
  const payload = format === "wifi" ? (values.ssid ? `WIFI:T:${encryption};S:${escapeWifi(values.ssid)};${encryption !== "nopass" ? `P:${escapeWifi(values.password)};` : ""}H:${hidden};;` : "")
    : format === "email" ? (values.to ? `mailto:${values.to}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(values.body)}` : "")
    : format === "sms" ? (values.phone ? `SMSTO:${values.phone}:${values.message}` : "") : values.text;
  const validColors = /^#[0-9a-f]{6}$/i.test(foreground) && /^#[0-9a-f]{6}$/i.test(background);
  const tooLong = new TextEncoder().encode(payload).length > 1200;
  const ready = !!payload && validColors && !tooLong;

  const uploadLogo = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const version = ++uploadVersion.current;
    setLogo(null); setLogoError(""); setLogoLoading(false);
    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) { setLogoError("Choose a PNG, JPEG or SVG image."); return; }
    setLogoLoading(true);
    const reader = new FileReader();
    const fail = () => { if (version === uploadVersion.current) { setLogoError("The image could not be loaded."); setLogoLoading(false); } };
    reader.onerror = fail;
    reader.onload = () => {
      if (typeof reader.result !== "string") { fail(); return; }
      const url = reader.result;
      const image = new Image();
      image.onerror = fail;
      image.onload = () => { if (version === uploadVersion.current) { setLogo(url); setLogoLoading(false); } };
      image.src = url;
    };
    reader.readAsDataURL(file);
  };
  const download = () => {
    if (!ready || logoLoading || !canvasRef.current) return;
    try {
      const link = document.createElement("a");
      link.href = canvasRef.current.toDataURL("image/png"); link.download = "qrcode.png"; link.click();
      notify("PNG download started");
    } catch { notify("Could not export the QR image. Try removing the logo.", "error"); }
  };
  const field = (key: keyof typeof values, label: string, multiline = false, type = "text") => <ToolField htmlFor={`qr-${key}`} label={label}>
    {multiline ? <Textarea id={`qr-${key}`} value={values[key]} onChange={event => setValue(key, event.target.value)} className={`${control} min-h-24 resize-y`} spellCheck={false} />
      : <Input id={`qr-${key}`} type={type} value={values[key]} onChange={event => setValue(key, event.target.value)} className={control} autoComplete="off" spellCheck={false} />}
  </ToolField>;

  return <ToolLayout title="QR Code Generator" description="Create QR codes for text, Wi-Fi, email and SMS. Customize colors, add a local logo and export PNG.">
    <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-2">
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="IN">Content & appearance</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          <ToolActionPanel label="Format">{formats.map(item => <ToolActionButton key={item} aria-pressed={format === item} tone={format === item ? "accent" : "neutral"} onClick={() => setFormat(item)}>{item.toUpperCase()}</ToolActionButton>)}</ToolActionPanel>
          {format === "text" && field("text", "URL or text", true)}
          {format === "wifi" && <div className="space-y-4">{field("ssid", "Network name (SSID)")}
            <ToolField htmlFor="qr-encryption" label="Wi-Fi security"><Select value={encryption} onValueChange={value => { if (value) setEncryption(value); }}><SelectTrigger id="qr-encryption" className={control}><SelectValue>{encryption === "WPA" ? "WPA / WPA2" : encryption === "WEP" ? "WEP" : "None"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="WPA">WPA / WPA2</SelectItem><SelectItem value="WEP">WEP</SelectItem><SelectItem value="nopass">None</SelectItem></SelectContent></Select></ToolField>
            {encryption !== "nopass" && field("password", "Wi-Fi password", false, "password")}
            <label className="flex items-center gap-3 text-xs text-zinc-300"><Checkbox checked={hidden} onCheckedChange={checked => setHidden(checked === true)} />Hidden network</label>
          </div>}
          {format === "email" && <div className="space-y-4">{field("to", "Recipient email")}{field("subject", "Subject")}{field("body", "Email body", true)}</div>}
          {format === "sms" && <div className="space-y-4">{field("phone", "Phone number")}{field("message", "SMS message", true)}</div>}
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{[{ label: "Foreground", value: foreground, set: setForeground }, { label: "Background", value: background, set: setBackground }].map(color => <ToolField key={color.label} htmlFor={`qr-${color.label}`} label={color.label}>
            <div className="flex min-w-0 gap-2"><input type="color" aria-label={`${color.label} color picker`} value={/^#[0-9a-f]{6}$/i.test(color.value) ? color.value : "#000000"} onInput={event => color.set(event.currentTarget.value)} className="h-8 w-8 shrink-0 cursor-pointer border border-[#1a1a1a] bg-black p-0 focus-visible:outline-2 focus-visible:outline-[#00ff9c]" />
              <Input id={`qr-${color.label}`} value={color.value} onChange={event => color.set(event.target.value)} className={`${control} min-w-0 flex-1`} aria-invalid={!/^#[0-9a-f]{6}$/i.test(color.value)} aria-describedby={!validColors ? "qr-color-error" : undefined} /></div>
          </ToolField>)}</div>
          {!validColors && <ToolStatus id="qr-color-error" tone="error">Use six-digit hex colors, for example #000000.</ToolStatus>}
          <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Error correction</legend><div className="flex flex-wrap gap-2">{levels.map(item => <ToolActionButton key={item} aria-pressed={item === level} tone={item === level ? "accent" : "neutral"} onClick={() => setLevel(item)}>{item}</ToolActionButton>)}</div><p className="mt-2 text-xs text-zinc-400">L: low · M: medium · Q: quartile · H: high. Higher levels leave less room for content.</p></fieldset>
          <ToolFileDropzone key={logoInputKey} label="Optional logo" browseLabel="Choose logo" accept="image/png,image/jpeg,image/svg+xml" acceptedFormats="PNG, JPEG or SVG" maxSizeBytes={1024 * 1024} onFiles={uploadLogo} />
          {logoLoading && <ToolStatus>Loading logo…</ToolStatus>}
          {logoError && <ToolStatus tone="error">{logoError}</ToolStatus>}
          {logo && <div className="space-y-3"><ToolField htmlFor="qr-logo-size" label={`Logo size (${logoSize}px)`}><input id="qr-logo-size" type="range" min={20} max={120} value={logoSize} onChange={event => setLogoSize(Number(event.target.value))} className="tool-range w-full" style={{ "--tool-range-progress": `${logoSize - 20}%` } as CSSProperties} /></ToolField><ToolActionButton tone="danger" onClick={() => { ++uploadVersion.current; setLogo(null); setLogoInputKey(value => value + 1); }}>Remove logo</ToolActionButton></div>}
        </ToolPanelBody>
      </ToolPanel>
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="OUT">QR preview</ToolPanelTitle><ToolActionButton onClick={download} disabled={!ready || logoLoading}><Download aria-hidden="true" />Download PNG</ToolActionButton></ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          {tooLong ? <ToolStatus tone="error" title="Content too long">This tool accepts up to 1,200 UTF-8 bytes, including format prefixes, to fit all correction levels. Shorten the content to generate a QR code.</ToolStatus>
            : ready ? <div className="flex min-w-0 justify-center border border-[#1a1a1a] bg-black p-3"><QRCodeCanvas ref={canvasRef} value={payload} size={300} level={level} bgColor={background} fgColor={foreground} marginSize={4} style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label={`${format.toUpperCase()} QR code`} imageSettings={logo ? { src: logo, height: logoSize, width: logoSize, excavate: true } : undefined} /></div>
            : <ToolEmptyState title="Awaiting QR content">{!validColors ? "Correct the colors to continue." : "Enter text or the required address, network name or phone number."}</ToolEmptyState>}
          <p className="text-xs leading-relaxed text-zinc-400">Use dark foreground modules on a light background. A quiet margin is included. Colors and logos can affect readability; scan the exported image before sharing it.</p>
          {logo && <ToolStatus tone="attention">A logo covers part of the code. Keep it small and use high (H) error correction.</ToolStatus>}
        </ToolPanelBody>
      </ToolPanel>
    </div>
  </ToolLayout>;
}
