"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolStatus } from "@/components/tool-design";
import { useNotification } from "@/components/notification-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function UrlConverter() {
  const [raw, setRaw] = useState("");
  const [encoded, setEncoded] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();
  const [useComponent, setUseComponent] = useState(true);

  const handleRawChange = (value: string, mode: boolean = useComponent) => {
    setRaw(value);
    setError(null);
    try {
      setEncoded(mode ? encodeURIComponent(value) : encodeURI(value));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleEncodedChange = (value: string, mode: boolean = useComponent) => {
    setEncoded(value);
    if (!value) {
      setRaw("");
      setError(null);
      return;
    }
    
    try {
      const decoded = mode ? decodeURIComponent(value) : decodeURI(value);
      setRaw(decoded);
      setError(null);
    } catch (e) {
      setError("Invalid URI sequence");
    }
  };

  const copy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the text and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="URL Encoder/Decoder" description="Safely encode and decode URL parameters or entire URIs.">
      <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelBody>
            <ToolField htmlFor="url-mode" label="Encoding mode" helper="URL component encodes reserved characters. Full URI preserves URL separators. Changing mode converts the current raw text.">
              <Select value={useComponent ? "component" : "uri"} onValueChange={value => {
                if (value === null) return;
                const mode = value === "component";
                setUseComponent(mode);
                handleRawChange(raw, mode);
              }}>
                <SelectTrigger id="url-mode" className="w-full rounded-none border-[#1a1a1a] bg-black! text-zinc-300">
                  <SelectValue>{useComponent ? "URL component" : "Full URI"}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-none border border-[#2a2a2a] bg-[#080808] text-zinc-300">
                  <SelectItem value="component" className="rounded-none">URL component</SelectItem>
                  <SelectItem value="uri" className="rounded-none">Full URI</SelectItem>
                </SelectContent>
              </Select>
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT">Raw text</ToolPanelTitle>
            <ToolActionButton disabled={!raw} onClick={() => copy(raw)}><Copy aria-hidden="true" /> Copy raw text</ToolActionButton>
          </ToolPanelHeader>
          <ToolPanelBody>
            <ToolField htmlFor="raw-text" label="Text to encode" helper="Conversion updates as you type. Copy becomes available when text is present.">
              <Textarea id="raw-text" placeholder="Type or paste raw text here..." value={raw}
                onChange={event => handleRawChange(event.target.value)}
                className="h-48 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT">URL encoded</ToolPanelTitle>
            <ToolActionButton disabled={!encoded} onClick={() => copy(encoded)}><Copy aria-hidden="true" /> Copy encoded</ToolActionButton>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolField htmlFor="encoded-text" label="Text to decode">
              <Textarea id="encoded-text" placeholder="Type or paste URL encoded text here..." value={encoded}
                onChange={event => handleEncodedChange(event.target.value)}
                aria-invalid={!!error} aria-describedby={error ? "url-error" : undefined}
                className="h-48 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
            </ToolField>
            {error && <ToolStatus id="url-error" tone="error">{error}. Review the input; the last valid conversion is retained.</ToolStatus>}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
