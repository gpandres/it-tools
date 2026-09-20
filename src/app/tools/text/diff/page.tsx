"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolActionPanel, ToolConfirmDialog, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle } from "@/components/tool-design";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo, useRef } from "react";
import * as diff from "diff";

export default function TextDiffChecker() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diffMode, setDiffMode] = useState<"words" | "lines">("lines");
  const originalRef = useRef<HTMLTextAreaElement>(null);
  const modifiedRef = useRef<HTMLTextAreaElement>(null);

  const diffResult = useMemo(() => {
    if (!original && !modified) return [];
    return diffMode === "words"
      ? diff.diffWordsWithSpace(original, modified)
      : diff.diffLines(original, modified);
  }, [original, modified, diffMode]);

  const additions = diffResult.filter(part => part.added).length;
  const deletions = diffResult.filter(part => part.removed).length;
  const editors = [
    { id: "original-input", label: "Original Text", value: original, setValue: setOriginal, ref: originalRef },
    { id: "modified-input", label: "Modified Text", value: modified, setValue: setModified, ref: modifiedRef },
  ];

  return (
    <ToolLayout title="Text Diff Checker" description="Compare two text snippets to see added, removed, or modified content.">
      <div className="space-y-6">
        <ToolActionPanel label="COMPARE">
          {(["lines", "words"] as const).map(mode => (
            <ToolActionButton key={mode} aria-pressed={diffMode === mode} tone={diffMode === mode ? "accent" : "neutral"} onClick={() => setDiffMode(mode)}>
              {mode === "lines" ? "By Line" : "By Word"}
            </ToolActionButton>
          ))}
        </ToolActionPanel>
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
          {editors.map(editor => (
            <ToolPanel key={editor.id}>
              <ToolPanelHeader>
                <ToolPanelTitle marker="IN">{editor.label}</ToolPanelTitle>
                <ToolConfirmDialog
                  trigger={<ToolActionButton tone="danger" disabled={!editor.value} aria-label={`Clear ${editor.label.toLowerCase()}`}>Clear</ToolActionButton>}
                  title={`Clear ${editor.label.toLowerCase()}?`}
                  description="This input will be removed and the comparison will update."
                  confirmLabel="Clear input"
                  onConfirm={() => editor.setValue("")}
                  finalFocus={() => editor.value ? true : editor.ref.current}
                />
              </ToolPanelHeader>
              <ToolPanelBody>
                <ToolField htmlFor={editor.id} label={editor.label} helper="Comparison updates as you type, including whitespace changes.">
                  <Textarea id={editor.id} ref={editor.ref} value={editor.value} onChange={event => editor.setValue(event.target.value)}
                    placeholder={`Paste ${editor.label.toLowerCase()} here...`} spellCheck={false}
                    className="h-64 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                </ToolField>
              </ToolPanelBody>
            </ToolPanel>
          ))}
        </div>
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Diff Result</ToolPanelTitle>
            {diffResult.length > 0 && (
              <p role="status" className="text-xs text-zinc-400">
                {additions || deletions ? `${additions} added blocks / ${deletions} removed blocks` : "Identical text"}
              </p>
            )}
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-3">
            {diffResult.length === 0 ? (
              <ToolEmptyState title="Awaiting text">Enter text in either input to compare. Additions and removals appear here.</ToolEmptyState>
            ) : (
              <>
                <p className="text-xs text-zinc-400">
                  {diffMode === "lines" ? "+ marks added lines; − marks removed lines." : "Underlined text is added; struck-through text is removed."}
                  {" "}Counts represent consecutive changed blocks.
                </p>
                <div role="region" aria-label="Diff result" tabIndex={0}
                  className="max-h-96 overflow-auto whitespace-pre-wrap break-all border border-[#1a1a1a] bg-black p-4 font-mono text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-[#00ff9c]">
                  {diffResult.map((part, index) => {
                    const className = part.added ? "bg-[#00ff9c]/10 text-[#00ff9c]" : part.removed ? "bg-red-400/10 text-red-400" : "text-zinc-300";
                    if (diffMode === "lines") {
                      const lines = part.value.split("\n");
                      if (lines[lines.length - 1] === "") lines.pop();
                      return <div key={index} className={className}>
                        {lines.map((line, lineIndex) => (
                          <div key={lineIndex} className="flex min-h-6">
                            <span className="w-6 shrink-0 select-none" aria-hidden="true">{part.added ? "+" : part.removed ? "−" : " "}</span>
                            {(part.added || part.removed) && <span className="sr-only">{part.added ? "Added: " : "Removed: "}</span>}
                            <span className="min-w-0">{line}</span>
                          </div>
                        ))}
                      </div>;
                    }
                    if (part.added) return <ins key={index} className={className}>{part.value}</ins>;
                    if (part.removed) return <del key={index} className={className}>{part.value}</del>;
                    return <span key={index} className={className}>{part.value}</span>;
                  })}
                </div>
              </>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
