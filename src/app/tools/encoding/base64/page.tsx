"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolStatus } from "@/components/tool-design";
import { useNotification } from "@/components/notification-provider";
import { Copy } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

// Helpers for Unicode-safe Base64
function utf8ToBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
  } catch (e) {
    return "";
  }
}

function base64ToUtf8(str: string): string {
  try {
    return decodeURIComponent(atob(str).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    throw new Error("Invalid Base64 sequence");
  }
}

export default function Base64Converter() {
  const [raw, setRaw] = useState("");
  const [base64, setBase64] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();

  const handleRawChange = (value: string) => {
    setRaw(value);
    setError(null);
    setBase64(utf8ToBase64(value));
  };

  const handleBase64Change = (value: string) => {
    setBase64(value);
    if (!value) {
      setRaw("");
      setError(null);
      return;
    }
    
    try {
      const decoded = base64ToUtf8(value);
      setRaw(decoded);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
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
    <ToolLayout 
      title="Base64 Encoder/Decoder" 
      description="Convert text or data to and from Base64 encoding. Supports UTF-8 characters."
    >
      <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT">Raw text</ToolPanelTitle>
            <ToolActionButton disabled={!raw} onClick={() => copy(raw)}>
              <Copy aria-hidden="true" /> Copy raw text
            </ToolActionButton>
          </ToolPanelHeader>
          <ToolPanelBody>
            <ToolField htmlFor="raw-text" label="Text to encode" helper="UTF-8 text is converted as you type. Copy becomes available when text is present.">
            <Textarea
              id="raw-text"
              placeholder="Type or paste raw text here..."
              value={raw}
              onChange={(e) => handleRawChange(e.target.value)}
              className="h-48 field-sizing-fixed rounded-none border-[#1a1a1a] bg-black! text-zinc-300 resize-y"
            />
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel>
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN/OUT">Base64 encoded</ToolPanelTitle>
            <ToolActionButton disabled={!base64} onClick={() => copy(base64)}>
              <Copy aria-hidden="true" /> Copy Base64
            </ToolActionButton>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolField htmlFor="b64-text" label="Text to decode">
            <Textarea
              id="b64-text"
              placeholder="Type or paste Base64 here..."
              value={base64}
              onChange={(e) => handleBase64Change(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "base64-error" : undefined}
              className="h-48 field-sizing-fixed rounded-none border-[#1a1a1a] bg-black! text-zinc-300 resize-y"
            />
            </ToolField>
            {error && <ToolStatus id="base64-error" tone="error">{error}. Enter valid Base64; the last valid raw text is retained.</ToolStatus>}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
