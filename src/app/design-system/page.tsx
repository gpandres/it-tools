import type { Metadata } from "next";
import { Check, Copy, Download, Inbox, Play, Search, Terminal } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolActionPanel, ToolBadge, ToolDisclosure, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolProgress, ToolStatus } from "@/components/tool-design";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NotificationDemo } from "./components/NotificationDemo";
import { SliderDemo } from "./components/SliderDemo";
import { DiagramDesignDemo } from "./components/DiagramDesignDemo";
import { CliDesignDemo } from "./components/CliDesignDemo";
import { PatternShowcase } from "./components/PatternShowcase";
import { HorizontalTimelineDemo } from "./components/HorizontalTimelineDemo";

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
  ["muted", "#a1a1aa", "helper / metadata"],
  ["phosphor", "#00ff9c", "active / success"],
  ["amber", "#ffb000", "heading / attention"],
  ["error", "#f87171", "failure / destructive"],
] as const;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre role="region" tabIndex={0} aria-label="Code example" className="overflow-x-auto border border-[#1a1a1a] bg-black p-3 text-[10px] leading-relaxed text-zinc-400">
      <code>{children}</code>
    </pre>
  );
}

function Section({ title, children, code }: { title: string; children: React.ReactNode; code?: string }) {
  return (
    <ToolPanel>
      <ToolPanelHeader className="bg-[#050505]"><ToolPanelTitle>{title}</ToolPanelTitle><ToolBadge>canonical</ToolBadge></ToolPanelHeader>
      <ToolPanelBody className="space-y-4">{children}{code && <div className="pt-1"><CodeBlock>{code}</CodeBlock></div>}</ToolPanelBody>
    </ToolPanel>
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
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400">This page is deliberately direct-only and noindexed. It documents and renders the same shell, components and states that production tools must use.</p>
            </div>
            <div className="border border-[#176b52] px-3 py-2 text-[10px] uppercase tracking-widest text-[#9fffd1]">local-first UI</div>
          </div>
        </div>

        <Section title="Design tokens" code={'<div className="border border-[#1a1a1a] bg-[#050505] p-4">...</div>'}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
            {tokens.map(([name, value, use]) => (
              <div key={name} className="border border-[#1a1a1a] bg-[#080808] p-2">
                <div className="mb-2 h-7 border border-[#2a2a2a]" style={{ backgroundColor: value }} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">{name}</p>
                <p className="mt-1 text-[9px] text-zinc-400">{value}</p>
                <p className="mt-1 text-[9px] text-zinc-400">{use}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shared design API" code={'import {\n  ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody,\n  ToolField, ToolStatus, ToolProgress, ToolDialog,\n  ToolConfirmDialog, ToolFileDropzone, ToolCodeField,\n  ToolTerminalOutput, ToolTimeline, ToolHorizontalTimeline,\n  ToolStatGrid, ToolStat, ToolBadge, ToolDisclosure\n} from "@/components/tool-design";'}>
          <p className="text-xs leading-relaxed text-zinc-400">Every rendered pattern below comes from the shared API when a reusable component exists. Tools provide labels, data, callbacks and domain validation; shared components own visual grammar, accessibility and responsive behavior.</p>
          <div className="grid gap-px border border-[#1a1a1a] bg-[#1a1a1a] text-[10px] sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Structure", "ToolPanel, header, body, footer and fields"],
              ["Feedback", "Badges, inline status and empty states"],
              ["Flows", "Dialogs, file dropzones and disclosures"],
              ["Data", "Code fields, terminal output, stats and timelines"],
            ].map(([group, components]) => <div key={group} className="bg-[#050505] p-3"><p className="font-bold uppercase tracking-widest text-[#00ff9c]">{group}</p><p className="mt-2 leading-relaxed text-zinc-400">{components}</p></div>)}
          </div>
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Typography" code={'<h2 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">Section label</h2>'}>
            <div className="space-y-3">
              <h1 className="text-sm font-bold uppercase tracking-widest text-[#ffb000] glow-amber"><span className="text-xs text-[#00ff9c]">/</span> TOOL TITLE</h1>
              <p className="text-xs text-zinc-400">Short description with enough contrast and no decorative filler.</p>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">Section label</h2>
              <p className="text-xs leading-relaxed text-zinc-300">Readable content keeps the terminal character while remaining useful at normal zoom.</p>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">metadata / helper text</span>
            </div>
          </Section>

        <Section title="Status and notifications" code={'const { notify } = useNotification();\nnotify("Copied to clipboard");\nnotify("Review the selected value", "attention");\nnotify("Input validation failed", "error");'}>
          <div className="flex flex-wrap gap-2">
              <ToolBadge tone="success">ready</ToolBadge>
              <ToolBadge tone="attention">attention</ToolBadge>
              <ToolBadge tone="error">error</ToolBadge>
            </div>
            <ToolStatus tone="success">Operation completed locally.</ToolStatus>
            <ToolStatus tone="attention">Explain the problem and the next action.</ToolStatus>
            <ToolProgress label="Local processing" value={68} valueLabel="68 / 100 items" />
            <NotificationDemo />
            <p className="text-[10px] leading-relaxed text-zinc-400">Notifications are transient feedback only. Persistent validation stays next to the affected field. Never call <code className="text-zinc-400">alert()</code>.</p>
          </Section>
        </div>

        <Section title="Actions and toolbar" code={'<ToolActionPanel label="ACTIONS">\n  <ToolActionButton tone="accent">Run</ToolActionButton>\n</ToolActionPanel>'}>
          <ToolActionPanel label="ACTIONS" className="rounded-none">
            <ToolActionButton className="rounded-none" tone="neutral"><Copy />Copy</ToolActionButton>
            <ToolActionButton className="rounded-none" tone="accent"><Play />Run locally</ToolActionButton>
            <ToolActionButton className="rounded-none" tone="danger">Clear</ToolActionButton>
            <ToolActionButton className="rounded-none" tone="neutral"><Download />Export</ToolActionButton>
          </ToolActionPanel>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-none" variant="outline" size="sm"><Terminal />Shared button</Button>
            <Button className="rounded-none" variant="ghost" size="sm">Secondary action</Button>
            <ToolActionButton tone="danger">Destructive</ToolActionButton>
          </div>
        </Section>

        <Section title="Forms and inputs" code={'<Label htmlFor="field">Input label</Label>\n<Input id="field" placeholder="example value" />'}>
          <div className="grid gap-4 md:grid-cols-2">
            <ToolField htmlFor="design-system-input" label="Input label" helper="Helper text stays close to its field.">
              <Input id="design-system-input" className="rounded-none" defaultValue="local-value" />
            </ToolField>
            <ToolField htmlFor="design-system-search" label="Search">
              <div className="relative"><Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" /><Input id="design-system-search" className="rounded-none pl-8" placeholder="Search tools..." /></div>
            </ToolField>
          </div>
          <ToolField htmlFor="design-system-textarea" label="Multiline content">
            <Textarea id="design-system-textarea" defaultValue="Long content wraps inside its intended container instead of changing the page layout." className="min-h-20 rounded-none" />
          </ToolField>
          <label htmlFor="design-system-checkbox" className="flex min-h-10 cursor-pointer items-center gap-3 text-xs text-zinc-300"><Checkbox id="design-system-checkbox" defaultChecked />Keep local processing enabled</label>
        </Section>

        <Section title="Sliders and numeric controls" code={'<input type="range" className="tool-range flex-1" style={{ "--tool-range-progress": "75%" }} />\n<Input className="w-20 rounded-none text-center" />'}>
          <SliderDemo />
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Disclosure and navigation" code={'<details>\n  <summary>Advanced options</summary>\n</details>'}>
            <ToolDisclosure title="Advanced options" defaultOpen>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">Use the same disclosure arrow and spacing across reference pages, tool panels and configuration areas.</p>
            </ToolDisclosure>
            <div className="flex flex-wrap gap-1 border-b border-[#1a1a1a] pb-2">
              <button type="button" className="border-b-2 border-[#00ff9c] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff9c]">Reference</button>
              <button type="button" className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-300">Matrix</button>
            </div>
          </Section>

          <Section title="Data and empty states" code={'<div className="overflow-x-auto">...table...</div>'}>
            <div role="region" aria-label="Example data table" tabIndex={0} className="overflow-x-auto border border-[#1a1a1a]">
              <table className="w-full min-w-[28rem] text-left text-[10px]"><thead className="border-b border-[#1a1a1a] text-zinc-400"><tr><th className="px-3 py-2 uppercase tracking-widest">Name</th><th className="px-3 py-2 uppercase tracking-widest">Status</th><th className="px-3 py-2 uppercase tracking-widest">Scope</th></tr></thead><tbody><tr className="text-zinc-300"><td className="px-3 py-2">Example item</td><td className="px-3 py-2 text-[#00ff9c]">Ready</td><td className="px-3 py-2 text-zinc-400">Local</td></tr></tbody></table>
            </div>
            <ToolEmptyState icon={Inbox} title="No results">Explain why the list is empty and offer the next useful action.</ToolEmptyState>
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

        <Section title="New tool anatomy" code={'<ToolLayout title="TOOL NAME" description="What it does.">\n  <div className="grid gap-6 lg:grid-cols-2">\n    <ToolPanel>...</ToolPanel>\n    <ToolPanel>...</ToolPanel>\n  </div>\n</ToolLayout>'}>
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="IN" className="text-sm text-[#ffb000] glow-amber">Input Config</ToolPanelTitle>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">local processing</span>
            </ToolPanelHeader>
            <ToolPanelBody className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2"><Label htmlFor="new-tool-example" className="text-xs uppercase tracking-wider text-zinc-400">Primary input</Label><Input id="new-tool-example" className="rounded-none" placeholder="192.168.1.0" /><p className="text-[10px] text-zinc-400">Explain format and limits beside the field.</p></div>
              <div className="flex items-end"><Button className="rounded-none bg-[#00ff9c]/10 text-[#00ff9c] hover:bg-[#00ff9c]/20" size="sm"><Play />Run</Button></div>
            </ToolPanelBody>
          </ToolPanel>
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolPanel><ToolPanelHeader><ToolPanelTitle marker="OUT" className="text-sm">Results <span className="cursor-blink">_</span></ToolPanelTitle></ToolPanelHeader><ToolPanelBody className="space-y-3 text-xs"><div className="flex justify-between gap-4"><span className="text-zinc-400">Primary value:</span><code className="text-zinc-200">example-result</code></div><div className="flex justify-between gap-4"><span className="text-zinc-400">Item count:</span><code className="text-zinc-200">254</code></div></ToolPanelBody></ToolPanel>
            <ToolPanel><ToolPanelHeader><ToolPanelTitle>Empty / error state</ToolPanelTitle></ToolPanelHeader><ToolPanelBody><ToolStatus tone="error">Awaiting valid input.</ToolStatus></ToolPanelBody></ToolPanel>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">A new tool should follow this order: `ToolLayout` header → input/config surface → primary action → output/result surface → inline empty/error state → optional export/help below. Start from this composition before adding specialized UI.</p>
        </Section>

        <Section title="Diagram workspace patterns" code={'<div className="grid grid-cols-[12rem_minmax(0,1fr)]">\n  <aside>{/* palette / inspector */}</aside>\n  <main>{/* canvas, groups, cables */}</main>\n</div>'}>
          <DiagramDesignDemo />
          <p className="text-xs leading-relaxed text-zinc-400">The canonical diagram language is demonstrated first. The compact and light variants are export-safe alternatives, not a second default product identity. Keep toolbox, inspector, group containers, connection handles, cable labels, directional controls and context menus discoverable without covering the canvas.</p>
        </Section>

        <Section title="Terminal patterns" code={'<ToolTerminalOutput\n  title="Process output"\n  status="read only"\n  lines={outputLines}\n/>'}>
          <CliDesignDemo />
          <p className="text-xs leading-relaxed text-zinc-400">Use the interactive CLI only when the user enters commands. For generated logs, validation traces and process results, use the prompt-free `ToolTerminalOutput`; it must never imply that the output area accepts commands.</p>
        </Section>

        <Section title="Complete UI patterns" code={'/* Use these patterns before inventing a new one. */'}>
          <PatternShowcase />
        </Section>

        <Section title="Horizontal timeline" code={'<ToolHorizontalTimeline\n  title="Operation timeline"\n  ticks={ticks}\n  segments={windows}\n  events={milestones}\n/>'}>
          <HorizontalTimelineDemo />
        </Section>
      </div>
    </ToolLayout>
  );
}
