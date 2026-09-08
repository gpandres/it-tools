"use client";

import { useMemo, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { dump } from "js-yaml";
import { v4 as uuidv4 } from "uuid";
import { ToolLayout } from "@/components/tool-layout";
import { validateSigmaRule } from "@/lib/sigma";

export default function SigmaBuilderPage() {
  const [title, setTitle] = useState("Suspicious process execution");
  const [product, setProduct] = useState("windows");
  const [service, setService] = useState("sysmon");
  const [field, setField] = useState("Image");
  const [values, setValues] = useState("powershell.exe\ncmd.exe");
  const [condition, setCondition] = useState("selection");
  const [ruleId, setRuleId] = useState("");
  const [status, setStatus] = useState("experimental");
  const [level, setLevel] = useState("medium");
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => {
    const selectionValues = values.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    const document = {
      title: title.trim() || "Untitled Sigma rule",
      ...(ruleId.trim() ? { id: ruleId.trim() } : {}),
      status,
      description: "Generated locally; review and tune before deployment.",
      logsource: { product: product.trim() || "generic", service: service.trim() || "generic" },
      detection: { selection: { [field.trim() || "CommandLine"]: selectionValues.length ? selectionValues : ["replace-me"] }, condition: condition.trim() || "selection" },
      level,
    };
    return dump(document, { noRefs: true, lineWidth: -1 });
  }, [condition, field, level, product, ruleId, service, status, title, values]);
  const validation = useMemo(() => validateSigmaRule(output), [output]);
  const copy = async () => { try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard may be unavailable in restricted contexts */ } };

  return <ToolLayout title="Sigma Rule Builder" description="Create a portable Sigma detection rule locally and adapt it to your SIEM or EDR pipeline.">
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="border border-[#1a1a1a] bg-[#050505]"><header className="border-b border-[#1a1a1a] px-4 py-3"><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Rule inputs</h2></header><div className="grid gap-4 p-4 sm:grid-cols-2">
        <label className="text-xs text-zinc-400 sm:col-span-2">Title<input value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Product<input value={product} onChange={e => setProduct(e.target.value)} placeholder="windows" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Service<input value={service} onChange={e => setService(e.target.value)} placeholder="sysmon" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Detection field<input value={field} onChange={e => setField(e.target.value)} placeholder="CommandLine" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Rule ID (optional)<div className="mt-2 flex gap-2"><input value={ruleId} onChange={e => setRuleId(e.target.value)} placeholder="UUIDv4" className="min-w-0 flex-1 border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /><button type="button" onClick={() => setRuleId(uuidv4())} className="border border-[#242424] px-3 text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]" title="Generate UUIDv4" aria-label="Generate UUIDv4"><RefreshCw className="h-3.5 w-3.5" /></button></div></label>
        <label className="text-xs text-zinc-400">Condition<input value={condition} onChange={e => setCondition(e.target.value)} placeholder="selection" className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
        <label className="text-xs text-zinc-400">Status<select value={status} onChange={e => setStatus(e.target.value)} className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]"><option>experimental</option><option>test</option><option>stable</option><option>deprecated</option><option>unsupported</option></select></label>
        <label className="text-xs text-zinc-400">Level<select value={level} onChange={e => setLevel(e.target.value)} className="mt-2 w-full border border-[#242424] bg-black p-3 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]"><option>informational</option><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
        <label className="text-xs text-zinc-400 sm:col-span-2">Values, one per line<textarea value={values} onChange={e => setValues(e.target.value)} spellCheck={false} className="mt-2 min-h-40 w-full resize-y border border-[#242424] bg-black p-3 font-mono text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label>
      </div></section>
      <section className="border border-[#1a1a1a] bg-[#050505]"><header className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3"><div><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Sigma YAML</h2><p className="mt-1 text-[11px] text-zinc-500">Generated with YAML serialization; review against your backend and Sigma version.</p></div><button type="button" onClick={copy} className="flex items-center gap-2 border border-[#242424] px-3 py-2 text-xs text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}</button></header><pre className="min-h-[420px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#00ff9c]">{output}</pre><div className="border-t border-[#1a1a1a] p-4"><h3 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Validation</h3>{validation.length === 0 ? <p className="mt-2 text-xs text-[#00ff9c]">No local schema issues detected.</p> : <div className="mt-2 space-y-2">{validation.map((item, index) => <p key={`${item.severity}-${index}`} className={`text-xs ${item.severity === "error" ? "text-red-300" : "text-amber-300"}`}>{item.severity.toUpperCase()} · {item.message}</p>)}</div>}</div></section>
    </div>
  </ToolLayout>;
}
