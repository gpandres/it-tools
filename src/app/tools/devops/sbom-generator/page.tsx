"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";

type Dependency = { name: string; version: string; ecosystem: string };
function parseDependencies(input: string): Dependency[] { return input.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => { const match = line.match(/^([@\w./-]+)\s*(?:==|@|:|=|\s)\s*v?([\w.+-]+)/); return match ? { name: match[1], version: match[2], ecosystem: line.includes("==") ? "pypi" : line.includes(":") ? "golang" : "npm" } : null; }).filter((item): item is Dependency => Boolean(item)); }

export default function SbomGeneratorPage() {
  const [input, setInput] = useState("react@19.2.8\nnext@16.3.4\nexpress@4.21.0"); const [copied, setCopied] = useState(false); const deps = useMemo(() => parseDependencies(input), [input]);
  const output = useMemo(() => JSON.stringify({ bomFormat: "CycloneDX", specVersion: "1.5", serialNumber: "urn:uuid:replace-with-uuid", version: 1, components: deps.map(dep => ({ type: "library", name: dep.name, version: dep.version, purl: `${dep.ecosystem === "npm" ? "pkg:npm" : `pkg:${dep.ecosystem}`}/${dep.name}@${dep.version}` })) }, null, 2), [deps]);
  const copy = async () => { try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ } };
  return <ToolLayout title="SBOM Generator" description="Generate a local CycloneDX SBOM from simple dependency lists before supply-chain review."><div className="grid gap-6 xl:grid-cols-2"><section className="border border-[#1a1a1a] bg-[#050505]"><header className="border-b border-[#1a1a1a] px-4 py-3"><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Dependencies</h2><p className="mt-1 text-[11px] text-zinc-500">One package per line: package@version, package==version or module:version.</p></header><textarea value={input} onChange={e => setInput(e.target.value)} spellCheck={false} className="min-h-[520px] w-full resize-y bg-black p-4 font-mono text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></section><section className="border border-[#1a1a1a] bg-[#050505]"><header className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3"><div><h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">CycloneDX JSON</h2><p className="mt-1 text-[11px] text-zinc-500">{deps.length} dependencies parsed locally</p></div><button type="button" onClick={copy} className="flex items-center gap-2 border border-[#242424] px-3 py-2 text-xs text-zinc-400 hover:border-[#00ff9c] hover:text-[#00ff9c]">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}</button></header><pre className="min-h-[520px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#00ff9c]">{output}</pre></section></div></ToolLayout>;
}
