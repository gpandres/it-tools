"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";

function yamlString(value: string) { return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ").trim(); }

export default function SigmaBuilderPage() {
  const [title, setTitle] = useState("Suspicious process execution");
  const [product, setProduct] = useState("windows");
  const [service, setService] = useState("sysmon");
  const [field, setField] = useState("Image");
  const [values, setValues] = useState("powershell.exe\ncmd.exe");
  const [condition, setCondition] = useState("selection");
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => {
    const entries = values.split(/\r?\n/).map(value => value.trim()).filter(Boolean).map(value => `      - "${yamlString(value)}"`).join("\n");
    return `title: "${yamlString(title)}"\nid: replace-with-uuid\nstatus: experimental\ndescription: "Generated locally; review and tune before deployment."\nauthor: ""\ndate: ${new Date().toISOString().slice(0, 10)}\nlogsource:\n  product: ${yamlString(product) || "generic"}\n  service: ${yamlString(service) || "generic"}\ndetection:\n  selection:\n    ${yamlString(field) || "CommandLine"}:\n${entries || "      - \"replace-me\""}\n  condition: ${yamlString(condition) || "selection"}\nlevel: medium\n`; 
  }, [condition, field, product, service, title, values]);
  const copy = async () => { try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard may be unavailable in restricted contexts */ } };

  return <ToolLayout title="Sigma Rule Builder" description="Create a portable Sigma detection rule locally and adapt it to your SIEM or EDR pipeline.">
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="border border-[#1a1a1a] bg-[#050505]"><header className="border-b border-[#1a1a1a] px-4 py-3"><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Rule inputs</h2></header><div className="grid gap-4 p-4 sm:grid-cols-2">
        <label className="text-xs text-zinc-400 sm:col-span-2">Title<input value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Product<input value={product} onChange={e => setProduct(e.target.value)} placeholder="windows" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Service<input value={service} onChange={e => setService(e.target.value)} placeholder="sysmon" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Detection field<input value={field} onChange={e => setField(e.target.value)} placeholder="CommandLine" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Condition<input value={condition} onChange={e => setCondition(e.target.value)} placeholder="selection" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400 sm:col-span-2">Values, one per line<textarea value={values} onChange={e => setValues(e.target.value)} spellCheck={false} className="mt-2 min-h-40 w-full resize-y border border-[#242424] bg-black p-3 font-mono text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
      </div></section>
      <section className="border border-[#1a1a1a] bg-[#050505]"><header className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3"><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Sigma YAML</h2><button type="button" onClick={copy} className="flex items-center gap-2 border border-[#242424] px-3 py-2 text-xs text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}</button></header><pre className="min-h-[520px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#00ff9c]">{output}</pre></section>
    </div>
  </ToolLayout>;
}
