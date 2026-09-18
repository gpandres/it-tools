"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionPanel, ToolActionButton, ToolStatus, ToolEmptyState, ToolConfirmDialog } from "@/components/tool-design";
import { useNotification } from "@/components/notification-provider";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import { Copy, Minimize2 } from "lucide-react";

const formats = [
  { value: 2, label: "2 Spaces" },
  { value: 4, label: "4 Spaces" },
  { value: "tab", label: "Tabs" },
  { value: 0, label: "Minify" },
] as const;

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<number | string>(2);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { notify } = useNotification();
  let output = "";
  let error = "";

  if (input.trim()) {
    try {
      output = JSON.stringify(JSON.parse(input), null, indent === "tab" ? "\t" : Number(indent));
    } catch (exception) {
      error = (exception as Error).message;
    }
  }

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the formatted text and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="JSON Formatter" description="Format, validate, and minify JSON data.">
      <div className="space-y-6">
        <ToolActionPanel label="FORMAT">
          {formats.map(format => (
            <ToolActionButton key={format.value} aria-pressed={indent === format.value} tone={indent === format.value ? "accent" : "neutral"} onClick={() => setIndent(format.value)}>
              {format.value === 0 && <Minimize2 aria-hidden="true" />}{format.label}
            </ToolActionButton>
          ))}
        </ToolActionPanel>
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="IN">Raw JSON</ToolPanelTitle>
              <ToolConfirmDialog
                trigger={<ToolActionButton tone="danger" disabled={!input}>Clear</ToolActionButton>}
                title="Clear JSON input?"
                description="The input and formatted result will be removed."
                confirmLabel="Clear input"
                onConfirm={() => setInput("")}
                finalFocus={() => input ? true : editorRef.current}
              />
            </ToolPanelHeader>
            <ToolPanelBody className="space-y-4">
              <ToolField htmlFor="json-input" label="Raw JSON" helper="Formatting updates as you type. Choose spaces, tabs or minify above.">
                <Textarea id="json-input" ref={editorRef} placeholder="Paste your unformatted JSON here..." value={input}
                  onChange={event => setInput(event.target.value)} aria-invalid={!!error} aria-describedby={error ? "json-error" : undefined}
                  className="h-64 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300 lg:h-96" spellCheck={false} />
              </ToolField>
              {error && <ToolStatus id="json-error" tone="error" title="Invalid JSON" className="break-all">{error}</ToolStatus>}
            </ToolPanelBody>
          </ToolPanel>
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="OUT">Formatted JSON</ToolPanelTitle>
              <ToolActionButton disabled={!output} onClick={copy} aria-label="Copy formatted JSON"><Copy aria-hidden="true" /> Copy</ToolActionButton>
            </ToolPanelHeader>
            <ToolPanelBody>
              {output ? (
                <ToolField htmlFor="json-output" label="Formatted JSON" helper="Read-only result. Copy keeps the selected indentation.">
                  <Textarea id="json-output" readOnly value={output} wrap="off"
                    className="h-64 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300 lg:h-96" spellCheck={false} />
                </ToolField>
              ) : (
                <ToolEmptyState title={error ? "Fix the input to continue" : "Awaiting JSON input"}>
                  {error ? "The validation message beside the input explains the problem." : "Enter a JSON object, array or value to see the formatted result."}
                </ToolEmptyState>
              )}
            </ToolPanelBody>
          </ToolPanel>
        </div>
      </div>
    </ToolLayout>
  );
}
