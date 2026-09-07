import { Textarea } from "@/components/ui/textarea";

interface FindingsProps {
  findings: string;
  onChange: (f: string) => void;
}

export default function Findings({ findings, onChange }: FindingsProps) {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 mb-2">
        <h3 className="text-[#00ff9c] font-bold text-sm mb-1">Executive Summary & Findings</h3>
        <p className="text-xs text-zinc-400">
          Document your analysis, root cause, and conclusions here. This area supports Markdown.
        </p>
      </div>
      <Textarea 
        className="flex-1 bg-black border-[#1a1a1a] text-sm text-zinc-300 font-mono resize-none focus-visible:ring-1 focus-visible:ring-[#333] p-4"
        placeholder="# Executive Summary&#10;&#10;During the investigation, it was determined that...&#10;&#10;## Root Cause&#10;- Indicator X was found on Host Y...&#10;"
        value={findings}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
