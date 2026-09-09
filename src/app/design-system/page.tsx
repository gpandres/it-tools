import type { Metadata } from "next";
import { Check, ChevronRight, Copy, Download, Play, Search, Terminal, TriangleAlert } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolActionPanel } from "@/components/tool-action-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Design System Reference | IT_TOOLS",
  description: "Internal visual reference for the IT_TOOLS interface.",
  robots: { index: false, follow: false },
};

const tokens = [
  ["background", "#000000", "page / canvas"],
  ["shell", "#050505", "header / toolbar"],
  ["panel", "#080808", "grouped surface"],
  ["control", "#111111", "input / selected"],
  ["border", "#1a1a1a", "structure"],
  ["phosphor", "#00ff9c", "active / success"],
  ["amber", "#ffb000", "heading / attention"],
  ["error", "#f87171", "failure / destructive"],
] as const;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto border border-[#1a1a1a] bg-black p-3 text-[10px] leading-relaxed text-zinc-400">
      <code>{children}</code>
    </pre>
  );
}

function Section({ title, children, code }: { title: string; children: React.ReactNode; code?: string }) {
  return (
    <section className="border border-[#1a1a1a] bg-[#050505] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">{title}</h2>
        <span className="text-[10px] uppercase tracking-widest text-zinc-700">canonical</span>
      </div>
      <div className="space-y-4">{children}</div>
      {code && <div className="mt-5"><CodeBlock>{code}</CodeBlock></div>}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <ToolLayout title="DESIGN SYSTEM REFERENCE" description="Internal visual reference for the IT_TOOLS interface. Not listed in the toolbox." fullWidth>
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <div className="border border-[#2a2a2a] bg-[#080808] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#ffb000]">Internal reference / v0.1.2</p>
              <h2 className="text-lg font-bold text-zinc-100">One visual language for every tool.</h2>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-500">This page is deliberately direct-only and noindexed. It documents and renders the same shell, components and states that production tools must use.</p>
            </div>
            <div className="border border-[#176b52] px-3 py-2 text-[10px] uppercase tracking-widest text-[#9fffd1]">local-first UI</div>
          </div>
        </div>

        <Section title="Design tokens" code={'<div className="border border-[#1a1a1a] bg-[#050505] p-4">...</div>'}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {tokens.map(([name, value, use]) => (
              <div key={name} className="border border-[#1a1a1a] bg-[#080808] p-2">
                <div className="mb-2 h-7 border border-[#2a2a2a]" style={{ backgroundColor: value }} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">{name}</p>
                <p className="mt-1 text-[9px] text-zinc-600">{value}</p>
                <p className="mt-1 text-[9px] text-zinc-700">{use}</p>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Typography" code={'<h2 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">Section label</h2>'}>
            <div className="space-y-3">
              <h1 className="text-sm font-bold uppercase tracking-widest text-[#ffb000] glow-amber"><span className="text-xs text-[#00ff9c]">/</span> TOOL TITLE</h1>
              <p className="text-xs text-zinc-500">Short description with enough contrast and no decorative filler.</p>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">Section label</h2>
              <p className="text-xs leading-relaxed text-zinc-300">Readable content keeps the terminal character while remaining useful at normal zoom.</p>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">metadata / helper text</span>
            </div>
          </Section>

          <Section title="Status and feedback" code={'const { notify } = useNotification();\nnotify("Copied to clipboard");'}>
            <div className="flex flex-wrap gap-2">
              <span className="border border-[#176b52] px-2 py-1 text-[10px] uppercase tracking-wider text-[#9fffd1]">ready</span>
              <span className="border border-[#795c19] px-2 py-1 text-[10px] uppercase tracking-wider text-[#fbbf24]">attention</span>
              <span className="border border-[#8f2435] px-2 py-1 text-[10px] uppercase tracking-wider text-[#ff9aa9]">error</span>
            </div>
            <div role="status" className="flex items-start gap-2 border border-[#176b52] bg-[#080808] px-3 py-2 text-xs text-[#9fffd1]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />Operation completed locally.</div>
            <div role="alert" className="flex items-start gap-2 border border-[#795c19] bg-[#080808] px-3 py-2 text-xs text-[#fbbf24]"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />Explain the problem and the next action.</div>
          </Section>
        </div>

        <Section title="Actions and toolbar" code={'<ToolActionPanel label="ACTIONS">\n  <ToolActionButton tone="accent">Run</ToolActionButton>\n</ToolActionPanel>'}>
          <ToolActionPanel label="ACTIONS">
            <ToolActionButton tone="neutral"><Copy />Copy</ToolActionButton>
            <ToolActionButton tone="accent"><Play />Run locally</ToolActionButton>
            <ToolActionButton tone="danger">Clear</ToolActionButton>
            <ToolActionButton tone="neutral"><Download />Export</ToolActionButton>
          </ToolActionPanel>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm"><Terminal />Shared button</Button>
            <Button variant="ghost" size="sm">Secondary action</Button>
            <Button variant="destructive" size="sm">Destructive</Button>
          </div>
        </Section>

        <Section title="Forms and inputs" code={'<Label htmlFor="field">Input label</Label>\n<Input id="field" placeholder="example value" />'}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="design-system-input" className="text-xs font-bold text-zinc-200">Input label</Label>
              <Input id="design-system-input" defaultValue="local-value" />
              <p className="text-[10px] text-zinc-600">Helper text stays close to its field.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="design-system-search" className="text-xs font-bold text-zinc-200">Search</Label>
              <div className="relative"><Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" /><Input id="design-system-search" className="pl-8" placeholder="Search tools..." /></div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="design-system-textarea" className="text-xs font-bold text-zinc-200">Multiline content</Label>
            <Textarea id="design-system-textarea" defaultValue="Long content wraps inside its intended container instead of changing the page layout." className="min-h-20" />
          </div>
          <label htmlFor="design-system-checkbox" className="flex min-h-10 cursor-pointer items-center gap-3 text-xs text-zinc-300"><Checkbox id="design-system-checkbox" defaultChecked />Keep local processing enabled</label>
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Disclosure and navigation" code={'<details>\n  <summary>Advanced options</summary>\n</details>'}>
            <details className="border-b border-[#1a1a1a] py-3" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100"><ChevronRight className="h-3 w-3 transition-transform" />Advanced options</summary>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">Use the same disclosure arrow and spacing across reference pages, tool panels and configuration areas.</p>
            </details>
            <div className="flex flex-wrap gap-1 border-b border-[#1a1a1a] pb-2">
              <button type="button" className="border-b-2 border-[#00ff9c] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff9c]">Reference</button>
              <button type="button" className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-300">Matrix</button>
            </div>
          </Section>

          <Section title="Data and empty states" code={'<div className="overflow-x-auto">...table...</div>'}>
            <div className="overflow-x-auto border border-[#1a1a1a]">
              <table className="w-full min-w-[28rem] text-left text-[10px]"><thead className="border-b border-[#1a1a1a] text-zinc-500"><tr><th className="px-3 py-2 uppercase tracking-widest">Name</th><th className="px-3 py-2 uppercase tracking-widest">Status</th><th className="px-3 py-2 uppercase tracking-widest">Scope</th></tr></thead><tbody><tr className="border-b border-[#111] text-zinc-300"><td className="px-3 py-2">Example item</td><td className="px-3 py-2 text-[#00ff9c]">Ready</td><td className="px-3 py-2 text-zinc-500">Local</td></tr><tr className="text-zinc-700"><td className="px-3 py-2" colSpan={3}>No more results</td></tr></tbody></table>
            </div>
          </Section>
        </div>

        <section className="border border-[#2a2a2a] bg-[#080808] p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Implementation contract</h2>
          <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
            {[
              "Use ToolLayout for registered tools.",
              "Reuse shared controls before creating a local variant.",
              "Keep one primary action and group secondary actions.",
              "Use notifications, never alert().",
              "Handle loading, empty, error and long-content states.",
              "Check keyboard focus, mobile layout and reduced motion.",
            ].map(item => <div key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00ff9c]" />{item}</div>)}
          </div>
        </section>
      </div>
    </ToolLayout>
  );
}
