"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolConfirmDialog, ToolStatGrid, ToolStat } from "@/components/tool-design";

export default function WordCounter() {
  const [text, setText] = useState("");
  const textInput = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const charNoSpacesCount = text.replace(/\s+/g, '').length;
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lineCount = text === "" ? 0 : text.split(/\r\n|\r|\n/).length;
  const paragraphCount = text === "" ? 0 : text.split(/\n\s*\n/).filter(p => p.trim() !== "").length;
  const sentenceCount = text === "" ? 0 : (text.match(/[^.!?]+[.!?]+/g) || []).length;
  
  // Avg reading speed is ~200 words per minute
  const readingTimeMinutes = wordCount / 200;
  const readingTime = readingTimeMinutes < 1 
    ? "< 1 min" 
    : `~${Math.ceil(readingTimeMinutes)} min`;

  return (
    <ToolLayout 
      title="Word & Character Counter" 
      description="Calculate word count, character count, and reading time metrics."
    >
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <ToolPanel className="lg:col-span-2">
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN">Text input</ToolPanelTitle>
            <ToolConfirmDialog
              trigger={<ToolActionButton tone="danger" disabled={!text}>Clear</ToolActionButton>}
              title="Clear text?"
              description="This removes the current text and resets its statistics."
              confirmLabel="Clear text"
              onConfirm={() => setText("")}
              finalFocus={() => text ? true : textInput.current}
            />
          </ToolPanelHeader>
          <ToolPanelBody>
            <ToolField htmlFor="text-input" label="Text to count" helper="Counts update as you type. Clear is available when text is present.">
            <Textarea
              id="text-input"
              ref={textInput}
              placeholder="Start typing or paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-64 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300 lg:h-96"
              spellCheck={false}
            />
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Statistics</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolStatGrid className="border-0 sm:grid-cols-2">
            <ToolStat label="Words" value={wordCount.toLocaleString()} tone="success" />
            <ToolStat label="Characters" value={charCount.toLocaleString()} tone="success" />
            <ToolStat label="Chars (no space)" value={charNoSpacesCount.toLocaleString()} />
            <ToolStat label="Sentences" value={sentenceCount.toLocaleString()} />
            <ToolStat label="Paragraphs" value={paragraphCount.toLocaleString()} />
            <ToolStat label="Lines" value={lineCount.toLocaleString()} />
            <ToolStat className="col-span-2" label="Est. reading time" value={readingTime} context="At 200 words per minute" />
          </ToolStatGrid>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
