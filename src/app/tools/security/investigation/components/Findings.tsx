import { Textarea } from "@/components/ui/textarea";

interface FindingsProps {
  findings: string;
  onChange: (f: string) => void;
}

export default function Findings({ findings, onChange }: FindingsProps) {
  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="border-b border-[#1a1a1a] pb-2">
        <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-[#ffb000] glow-amber">Executive Summary & Findings</h3>
        <p className="text-xs font-mono text-zinc-500">
          Document your analysis, root cause, and conclusions here. This area supports Markdown.
        </p>
      </div>
      <Textarea 
        className="flex-1 resize-none rounded-none border border-[#1a1a1a] bg-[#050505] p-4 font-mono text-sm text-zinc-300 focus-visible:ring-1 focus-visible:ring-[#00ff9c]"
        placeholder="# Executive Summary&#10;&#10;During the investigation, it was determined that...&#10;&#10;## Root Cause&#10;- Indicator X was found on Host Y...&#10;"
        value={findings}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
