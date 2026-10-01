"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotification } from "@/components/notification-provider";
import { ToolActionButton, ToolEmptyState, ToolField, ToolFileDropzone, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { DESIGNS, validateConfig, plateDimensions, type NfcMount, type QrContent, type StandConfig, type StandDesign, type StandMode, type StandModel } from "@/lib/qr-stand/model";
import { createBranding, readLogo } from "@/lib/qr-stand/branding";
import { createPrintKit } from "@/lib/qr-stand/print-kit";

const StandPreview = dynamic(() => import("./stand-preview"), { ssr: false, loading: () => <ToolStatus>Loading 3D preview…</ToolStatus> });
const control = "rounded-none border-[#1a1a1a] bg-black! text-zinc-300";

function DesignIcon({ design }: { design: StandDesign }) {
  return <svg viewBox="0 0 100 65" className="size-16 w-24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {design === "wedge" ? <><path d="M12 57H87L70 37H30Z" /><path d="m38 40 15-33 27 8-13 28" /></>
      : design === "plinth" ? <><path d="M16 49H85V59H16Z" /><path d="M33 49V7H69V49" /></>
        : <><path d="M12 58H88M22 58 50 10 77 58M30 49H71" /><path d="m35 44 13-37 25 8-10 34Z" /></>}
  </svg>;
}

export default function QrStandBuilder() {
  const [design, setDesign] = useState<StandDesign>("wedge");
  const [mode, setMode] = useState<StandMode>("both");
  const [url, setUrl] = useState("https://example.com/review");
  const [contentType, setContentType] = useState<"url" | "wifi">("url");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [hidden, setHidden] = useState(false);
  const [nfcMount, setNfcMount] = useState<NfcMount>("pocket");
  const [nfcStyle, setNfcStyle] = useState<"text" | "logo">("text");
  const [nfcTitle, setNfcTitle] = useState("NFC");
  const [nfcInstruction, setNfcInstruction] = useState("TAP YOUR PHONE");
  const [name, setName] = useState("YOUR BUSINESS");
  const [caption, setCaption] = useState("LEAVE A REVIEW");
  const [cardWidth, setCardWidth] = useState("85.6");
  const [cardHeight, setCardHeight] = useState("54");
  const [cardThickness, setCardThickness] = useState("0.8");
  const [clearance, setClearance] = useState("0.4");
  const [baseColor, setBaseColor] = useState("#177358");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoKey, setLogoKey] = useState(0);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [model, setModel] = useState<StandModel | null>(null);
  const [modelKey, setModelKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const upload = useRef(0);
  const { notify } = useNotification();
  const content: QrContent = contentType === "url" ? { type: "url", url } : { type: "wifi", ssid, password, security, hidden };
  const key = JSON.stringify([design, mode, content, nfcMount, nfcStyle, nfcTitle, nfcInstruction, name, caption, cardWidth, cardHeight, cardThickness, clearance, logo]);
  const stale = modelKey !== key;
  const config: StandConfig = { design, mode, content, nfcMount, cardWidth: Number(cardWidth), cardHeight: Number(cardHeight), cardThickness: Number(cardThickness), clearance: Number(clearance), branding: { width: 1, height: 1, pixels: new Uint8Array([1]) } };
  const validation = validateConfig(config) || (!name.trim() && !logo ? "Add a business name or a logo." : null) || (mode === "nfc" && nfcStyle === "logo" && !logo ? "Upload a logo to replace the NFC heading." : null);
  const dimensions = plateDimensions(config);
  useEffect(() => () => { worker.current?.terminate(); if (timeout.current) clearTimeout(timeout.current); generation.current++; upload.current++; }, []);

  const generate = async () => {
    if (validation || logoLoading) return;
    const version = ++generation.current;
    worker.current?.terminate();
    if (timeout.current) clearTimeout(timeout.current);
    setBusy(true); setError("");
    const finish = () => { worker.current?.terminate(); worker.current = null; if (timeout.current) clearTimeout(timeout.current); setBusy(false); };
    try {
      const branding = await createBranding(name.trim(), caption.trim(), logo, mode, { style: nfcStyle, title: nfcTitle.trim(), instruction: nfcInstruction.trim() });
      if (version !== generation.current) return;
      const instance = new Worker(new URL("../../../../lib/qr-stand/worker.ts", import.meta.url), { type: "module" });
      worker.current = instance;
      instance.onmessage = (event: MessageEvent<{ model?: StandModel; error?: string }>) => {
        if (version !== generation.current) return;
        if (event.data.model) { setModel(event.data.model); setModelKey(key); }
        else setError(event.data.error ?? "Could not generate the model.");
        finish();
      };
      instance.onerror = () => { if (version === generation.current) { setError("The modelling engine could not start. Reload and try again."); finish(); } };
      timeout.current = setTimeout(() => { if (version === generation.current) { setError("Generation took too long. Try a simpler logo or shorter link."); finish(); } }, 30_000);
      instance.postMessage({ ...config, branding });
    } catch (cause) { if (version === generation.current) { setError(cause instanceof Error ? cause.message : "Could not generate the model."); finish(); } }
  };
  const loadLogo = async (files: File[]) => {
    if (!files[0]) return;
    const version = ++upload.current;
    setLogoLoading(true); setLogoError("");
    try { const result = await readLogo(files[0]); if (version === upload.current) setLogo(result); }
    catch (cause) { if (version === upload.current) { setLogo(null); setLogoError(cause instanceof Error ? cause.message : "Could not read the logo."); } }
    finally { if (version === upload.current) setLogoLoading(false); }
  };
  const download = () => {
    if (!model || stale || busy || logoLoading) return;
    try {
      const zipped = createPrintKit(config, model);
      const downloadUrl = URL.createObjectURL(new Blob([new Uint8Array(zipped)], { type: "application/zip" }));
      const anchor = document.createElement("a"); anchor.href = downloadUrl; anchor.download = `qr-nfc-${design}.zip`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      notify("STL print kit downloaded");
    } catch { notify("Could not create the download. Generate the model again.", "error"); }
  };
  const numberField = (id: string, label: string, value: string, set: (value: string) => void, min: number, max: number) => <ToolField htmlFor={id} label={label}><Input id={id} type="number" min={min} max={max} step="0.1" value={value} onChange={event => set(event.target.value)} className={control} /></ToolField>;

  return <ToolLayout title="QR & NFC Stand Builder" description="Create printable stands for reviews, Wi-Fi or NFC, with your own logo and text. Models are generated locally.">
    <div className="space-y-6">
      <ToolPanel><ToolPanelHeader><ToolPanelTitle marker="01">Choose a stand</ToolPanelTitle></ToolPanelHeader><ToolPanelBody>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{(Object.keys(DESIGNS) as StandDesign[]).map(item => <ToolActionButton key={item} aria-pressed={design === item} tone={design === item ? "accent" : "neutral"} onClick={() => setDesign(item)} className="h-auto min-w-0 flex-col items-start gap-2 whitespace-normal p-4 text-left"><DesignIcon design={item} /><span>{DESIGNS[item].name} · {DESIGNS[item].angle}°</span><span className="text-xs font-normal normal-case tracking-normal text-zinc-400">{DESIGNS[item].description}</span></ToolActionButton>)}</div>
      </ToolPanelBody></ToolPanel>
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <ToolPanel><ToolPanelHeader><ToolPanelTitle marker="IN">Content & fit</ToolPanelTitle></ToolPanelHeader><ToolPanelBody className="space-y-5">
          <fieldset><legend className="mb-2 text-xs uppercase tracking-widest text-zinc-400">Stand mode</legend><div className="flex flex-wrap gap-2">{([["both", "QR + NFC"], ["qr", "QR only"], ["nfc", "NFC only"]] as const).map(([value, label]) => <ToolActionButton key={value} aria-pressed={mode === value} tone={mode === value ? "accent" : "neutral"} onClick={() => setMode(value)}>{label}</ToolActionButton>)}</div></fieldset>
          {mode !== "nfc" && <div className="space-y-4">
            <fieldset><legend className="mb-2 text-xs uppercase tracking-widest text-zinc-400">QR content</legend><div className="flex flex-wrap gap-2">{([["url", "Link / reviews"], ["wifi", "Wi-Fi"]] as const).map(([value, label]) => <ToolActionButton key={value} aria-pressed={contentType === value} tone={contentType === value ? "accent" : "neutral"} onClick={() => setContentType(value)}>{label}</ToolActionButton>)}</div></fieldset>
            {contentType === "url" ? <ToolField htmlFor="stand-url" label="Review link / URL" helper="Paste your Google review link or any HTTPS link. The sample is a placeholder."><Input id="stand-url" value={url} onChange={event => setUrl(event.target.value)} className={control} spellCheck={false} autoComplete="off" /></ToolField>
              : <div className="space-y-4">
                <ToolField htmlFor="stand-ssid" label="Network name (SSID)"><Input id="stand-ssid" value={ssid} maxLength={32} onChange={event => setSsid(event.target.value)} className={control} autoComplete="off" spellCheck={false} /></ToolField>
                <ToolField htmlFor="stand-security" label="Wi-Fi security"><Select value={security} onValueChange={value => { if (value === "WPA" || value === "WEP" || value === "nopass") setSecurity(value); }}><SelectTrigger id="stand-security" className={control}><SelectValue>{security === "WPA" ? "WPA / WPA2" : security === "WEP" ? "WEP" : "Open network"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="WPA">WPA / WPA2</SelectItem><SelectItem value="WEP">WEP</SelectItem><SelectItem value="nopass">Open network</SelectItem></SelectContent></Select></ToolField>
                {security !== "nopass" && <ToolField htmlFor="stand-password" label="Wi-Fi password"><Input id="stand-password" type="password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className={control} autoComplete="off" /></ToolField>}
                <label className="flex items-center gap-3 text-xs text-zinc-300"><Checkbox checked={hidden} onCheckedChange={value => setHidden(value === true)} />Hidden network</label>
                <p className="text-xs text-zinc-400">The printed QR includes the network credentials. NFC must be programmed separately; Wi-Fi NFC support depends on the phone.</p>
              </div>}
          </div>}
          {mode === "nfc" && <fieldset className="space-y-4"><legend className="mb-2 text-xs uppercase tracking-widest text-zinc-400">Main NFC artwork</legend>
            <div className="flex flex-wrap gap-2"><ToolActionButton aria-pressed={nfcStyle === "text"} tone={nfcStyle === "text" ? "accent" : "neutral"} onClick={() => setNfcStyle("text")}>Custom text</ToolActionButton><ToolActionButton aria-pressed={nfcStyle === "logo"} tone={nfcStyle === "logo" ? "accent" : "neutral"} onClick={() => setNfcStyle("logo")}>Large logo</ToolActionButton></div>
            {nfcStyle === "text" && <ToolField htmlFor="nfc-title" label="NFC heading"><Input id="nfc-title" value={nfcTitle} maxLength={18} onChange={event => setNfcTitle(event.target.value)} className={control} /></ToolField>}
            <ToolField htmlFor="nfc-instruction" label="Tap instruction" helper="Editable or leave empty to hide it."><Input id="nfc-instruction" value={nfcInstruction} maxLength={28} onChange={event => setNfcInstruction(event.target.value)} className={control} /></ToolField>
          </fieldset>}
          <ToolField htmlFor="stand-name" label="Business name" helper="Up to 24 characters. Artwork is converted to a single-color raised relief."><Input id="stand-name" maxLength={24} value={name} onChange={event => setName(event.target.value)} className={control} /></ToolField>
          <ToolField htmlFor="stand-caption" label="Caption"><Input id="stand-caption" maxLength={28} value={caption} onChange={event => setCaption(event.target.value)} className={control} /></ToolField>
          <ToolFileDropzone key={logoKey} label="Business logo" browseLabel="Choose logo" accept="image/png,image/jpeg,image/svg+xml" acceptedFormats="PNG, JPEG or SVG" maxSizeBytes={2 * 1024 * 1024} onFiles={loadLogo} onReject={setLogoError} />
          <p className="text-xs text-zinc-400">Use a simple dark logo on a transparent or white background. Light pixels disappear; fine detail may be lost. Check the generated relief.</p>
          {logoLoading && <ToolStatus>Preparing logo…</ToolStatus>}
          {logoError && <ToolStatus tone="error">{logoError}</ToolStatus>}
          {logo && <ToolActionButton tone="danger" onClick={() => { upload.current++; setLogo(null); setLogoLoading(false); setLogoError(""); setLogoKey(value => value + 1); }}>Remove logo</ToolActionButton>}
          {mode !== "qr" && <fieldset className="space-y-3"><legend className="mb-2 text-xs uppercase tracking-widest text-zinc-400">NFC insert · mm</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{numberField("card-width", "Width", cardWidth, setCardWidth, 20, 90)}{numberField("card-height", "Height", cardHeight, setCardHeight, 20, 65)}{numberField("card-thickness", "Thickness", cardThickness, setCardThickness, 0.5, 3)}</div>
            <p className="text-xs text-zinc-400">Defaults fit a credit-card sized NFC card. Measure your card. Program it separately with your phone.</p>
            <div className="flex flex-wrap gap-2"><ToolActionButton aria-pressed={nfcMount === "pocket"} tone={nfcMount === "pocket" ? "accent" : "neutral"} onClick={() => setNfcMount("pocket")}>Accessible pocket</ToolActionButton><ToolActionButton aria-pressed={nfcMount === "embedded"} tone={nfcMount === "embedded" ? "accent" : "neutral"} onClick={() => setNfcMount("embedded")}>Embed during print</ToolActionButton></div>
            <p className="text-xs text-zinc-400">{nfcMount === "pocket" ? "A separate pocket attaches to the back. Insert or replace the card after printing." : "An internal cavity seals the card inside the plate. Add a pause in your slicer before the roof closes; no separate pocket or glue."}</p>
            {nfcMount === "embedded" && !validation && <ToolStatus tone="attention" title="Insert at the print pause">Pause after Z={dimensions.pauseHeight?.toFixed(1)} mm, before the first roof layer. Use 0.2 mm layers and verify the pause in your slicer. Disable supports inside the cavity. Use only an insert rated for your printing temperatures; ordinary cards may warp. The card will be sealed permanently.</ToolStatus>}
          </fieldset>}
          {numberField("stand-clearance", "Total fit clearance (mm)", clearance, setClearance, 0.2, 1)}
          <p className="text-xs text-zinc-400">Added to the slot and pocket dimensions, not to each side. The plate is 110 × 145 mm.</p>
          {validation && <ToolStatus tone="error">{validation}</ToolStatus>}
          {error && <ToolStatus tone="error">{error}</ToolStatus>}
          <div className="flex flex-wrap gap-2"><ToolActionButton tone="accent" disabled={!!validation || logoLoading || busy} onClick={generate}>{busy ? "Generating…" : "Generate 3D stand"}</ToolActionButton>{busy && <ToolActionButton onClick={() => { generation.current++; worker.current?.terminate(); if (timeout.current) clearTimeout(timeout.current); setBusy(false); }}>Cancel</ToolActionButton>}</div>
        </ToolPanelBody></ToolPanel>
        <ToolPanel><ToolPanelHeader><ToolPanelTitle marker="OUT">3D preview</ToolPanelTitle><ToolActionButton disabled={!model || stale || busy || logoLoading} onClick={download}><Download aria-hidden="true" />Download STL kit</ToolActionButton></ToolPanelHeader><ToolPanelBody className="space-y-4">
          {busy && <ToolStatus>Building closed solids locally. You can cancel while the model is generated.</ToolStatus>}
          {model && stale && <ToolStatus tone="attention">Settings changed. Generate again to update the preview and enable download.</ToolStatus>}
          {model ? <><StandPreview model={model} baseColor={baseColor} /><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-zinc-400">Base preview color</span>{[["#177358", "Green"], ["#343840", "Graphite"], ["#bd862b", "Amber"]].map(([color, label]) => <ToolActionButton key={color} aria-pressed={baseColor === color} tone={baseColor === color ? "accent" : "neutral"} onClick={() => setBaseColor(color)}>{label}</ToolActionButton>)}</div><p className="text-xs leading-relaxed text-zinc-400">{model.pocket ? "3 printable parts" : "2 printable parts"} · {model.angle}° plate · {(model.volume / 1000).toFixed(1)} cm³ solid volume{model.moduleSize > 0 ? ` · ${model.moduleSize.toFixed(2)} mm QR modules` : ""}</p></> : <ToolEmptyState title="Your stand, in 3D">Choose a design, enter your details and generate the model. Rotate it, inspect the back and download the printable parts.</ToolEmptyState>}
          {model && <ToolStatus tone="attention" title="Two-color printing">For the displayed model: print flat in a light color, then change to dark filament after {model.plateThickness.toFixed(1)} mm for the 0.6 mm relief. STL files contain geometry, not colors or printer pauses.</ToolStatus>}
        </ToolPanelBody></ToolPanel>
      </div>
      <ToolPanel><ToolPanelHeader><ToolPanelTitle marker="03">Print & assemble</ToolPanelTitle></ToolPanelHeader><ToolPanelBody className="space-y-3 text-xs leading-relaxed text-zinc-400">
        <ol className="list-decimal space-y-2 pl-5"><li>Unzip the kit and import each STL in millimetres at 100% scale. Parts are laid flat, ready for the slicer. Use 0.2 mm layers.</li><li>With embedded NFC, program and test the insert first. Add the specified pause before the cavity roof closes, insert the card below the rim and resume. The ZIP includes the exact pause and color-change heights.</li><li>Print the artwork in two contrasting colors. Slide the plate into the base slot. For the accessible pocket, glue only its side and bottom rims to the back of the plate; align its opening with the top edge and insert the card once the glue cures.</li><li>Test QR scanning and NFC reading with your phone before placing the stand on a counter.</li></ol>
        <p>Geometry is checked digitally; physical print tolerances, stability and scan performance still need a real print test. Assembly instructions are included in the ZIP.</p>
      </ToolPanelBody></ToolPanel>
    </div>
  </ToolLayout>;
}

