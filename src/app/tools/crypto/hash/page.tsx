"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolActionPanel, ToolBadge, ToolConfirmDialog, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/notification-provider";
import { useState, useMemo, useRef } from "react";
import { Copy } from "lucide-react";
import CryptoJS from "crypto-js";

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [encoding, setEncoding] = useState<"hex" | "base64">("hex");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { notify } = useNotification();

  const result = useMemo(() => {
    if (!input) return { hashes: [], error: "" };
    try {
      const encoder = encoding === "base64" ? CryptoJS.enc.Base64 : CryptoJS.enc.Hex;
      const hashes = [
        { name: "MD5", value: CryptoJS.MD5(input), legacy: true },
        { name: "SHA-1", value: CryptoJS.SHA1(input), legacy: true },
        { name: "SHA-256", value: CryptoJS.SHA256(input), legacy: false },
        { name: "SHA-512", value: CryptoJS.SHA512(input), legacy: false },
        { name: "Keccak-512", value: CryptoJS.SHA3(input, { outputLength: 512 }), legacy: false },
      ].map(hash => ({ ...hash, value: encoder.stringify(hash.value) }));
      return { hashes, error: "" };
    } catch {
      return { hashes: [], error: "The text could not be encoded as UTF-8. Replace incomplete Unicode characters and try again." };
    }
  }, [input, encoding]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the hash and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="Hash Generators" description="Generate MD5, SHA-1, SHA-256, SHA-512 and Keccak-512 hashes from text.">
      <div className="space-y-6">
        <ToolActionPanel label="OUTPUT ENCODING">
          {(["hex", "base64"] as const).map(value => (
            <ToolActionButton key={value} aria-pressed={encoding === value} tone={encoding === value ? "accent" : "neutral"} onClick={() => setEncoding(value)}>{value.toUpperCase()}</ToolActionButton>
          ))}
        </ToolActionPanel>
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="IN">Input Text</ToolPanelTitle>
              <ToolConfirmDialog trigger={<ToolActionButton tone="danger" disabled={!input}>Clear</ToolActionButton>}
                title="Clear hash input?" description="The input and generated hashes will be removed." confirmLabel="Clear input"
                onConfirm={() => setInput("")} finalFocus={() => input ? true : editorRef.current} />
            </ToolPanelHeader>
            <ToolPanelBody className="space-y-4">
              <ToolField htmlFor="hash-input" label="Input text" helper="Hashes update as you type using UTF-8. Spaces and line breaks are included.">
                <Textarea id="hash-input" ref={editorRef} value={input} onChange={event => setInput(event.target.value)} placeholder="Type something..."
                  aria-invalid={!!result.error} aria-describedby={result.error ? "hash-error" : undefined}
                  className="h-80 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" spellCheck={false} />
              </ToolField>
              {result.error && <ToolStatus id="hash-error" tone="error" title="Unable to hash text">{result.error}</ToolStatus>}
              <p className="text-xs leading-relaxed text-zinc-400">Keccak-512 is the algorithm provided by CryptoJS under the SHA3 name. Its output differs from standardized SHA3-512.</p>
            </ToolPanelBody>
          </ToolPanel>
          <div className="min-w-0 space-y-4">
            {result.hashes.length === 0 ? (
              <ToolPanel>
                <ToolPanelHeader><ToolPanelTitle marker="OUT">Hashes</ToolPanelTitle></ToolPanelHeader>
                <ToolPanelBody><ToolEmptyState title={result.error ? "Fix the input to continue" : "Awaiting text"}>Enter text to generate hashes in the selected output encoding.</ToolEmptyState></ToolPanelBody>
              </ToolPanel>
            ) : result.hashes.map(hash => (
              <ToolPanel key={hash.name}>
                <ToolPanelHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <ToolPanelTitle marker="OUT">{hash.name}</ToolPanelTitle>
                    {hash.legacy && <ToolBadge tone="attention">Legacy</ToolBadge>}
                  </div>
                  <ToolActionButton aria-label={`Copy ${hash.name}`} onClick={() => copy(hash.value)}><Copy aria-hidden="true" /> Copy</ToolActionButton>
                </ToolPanelHeader>
                <ToolPanelBody>
                  <ToolField htmlFor={`hash-${hash.name}`} label={`${hash.name} (${encoding.toUpperCase()})`}>
                    <Textarea id={`hash-${hash.name}`} readOnly value={hash.value} spellCheck={false}
                      className="h-24 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                  </ToolField>
                </ToolPanelBody>
              </ToolPanel>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
