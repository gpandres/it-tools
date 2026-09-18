"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolStatus, ToolConfirmDialog } from "@/components/tool-design";
import { useNotification } from "@/components/notification-provider";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import * as yaml from "js-yaml";
import { yamlToJson } from "@/lib/yaml-to-json";

export default function JsonYamlConverter() {
  const [jsonText, setJsonText] = useState("");
  const [yamlText, setYamlText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [yamlError, setYamlError] = useState<string | null>(null);
  
  const { notify } = useNotification();
  const jsonRef = useRef<HTMLTextAreaElement>(null);
  const yamlRef = useRef<HTMLTextAreaElement>(null);

  const copy = async (text: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the text and copy it manually.", "error");
    }
  };
  const handleJsonChange = (val: string) => {
    setJsonText(val);
    setJsonError(null);
    
    if (!val.trim()) {
      setYamlText("");
      setYamlError(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
      const converted = yaml.dump(parsed, { indent: 2 });
      setYamlText(converted);
      setYamlError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleYamlChange = (val: string) => {
    setYamlText(val);
    setYamlError(null);
    
    if (!val.trim()) {
      setJsonText("");
      setJsonError(null);
      return;
    }

    try {
      setJsonText(yamlToJson(val));
      setJsonError(null);
    } catch (e) {
      setYamlError((e as Error).message);
    }
  };

  const fields = [
    { name: "JSON", id: "json-input", text: jsonText, error: jsonError, onChange: handleJsonChange, ref: jsonRef },
    { name: "YAML", id: "yaml-input", text: yamlText, error: yamlError, onChange: handleYamlChange, ref: yamlRef },
  ];

  return (
    <ToolLayout title="JSON ⇄ YAML Converter" description="Bidirectional converter between JSON and YAML. Type in either box to convert instantly.">
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        {fields.map(field => (
          <ToolPanel key={field.id}>
            <ToolPanelHeader>
              <ToolPanelTitle marker="IN/OUT">{field.name}</ToolPanelTitle>
              <div className="flex flex-wrap gap-2">
                <ToolActionButton aria-label={`Copy ${field.name}`} disabled={!field.text.trim()} onClick={() => copy(field.text)}>
                  <Copy aria-hidden="true" /> Copy
                </ToolActionButton>
                <ToolConfirmDialog
                  trigger={<ToolActionButton tone="danger" aria-label={`Clear from ${field.name}`} disabled={!jsonText && !yamlText}>Clear</ToolActionButton>}
                  title="Clear both editors?"
                  description="Both JSON and YAML text will be removed."
                  confirmLabel="Clear both"
                  onConfirm={() => field.onChange("")}
                  finalFocus={() => jsonText || yamlText ? true : field.ref.current}
                />
              </div>
            </ToolPanelHeader>
            <ToolPanelBody className="space-y-4">
              <ToolField htmlFor={field.id} label={`${field.name} Input`} helper="Conversion updates as you type. Invalid input leaves the other editor unchanged.">
                <Textarea
                  ref={field.ref}
                  id={field.id}
                  value={field.text}
                  onChange={event => field.onChange(event.target.value)}
                  placeholder={`Paste ${field.name} here...`}
                  aria-invalid={!!field.error}
                  aria-describedby={field.error ? `${field.id}-error` : undefined}
                  className="h-64 min-w-0 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300 xl:h-96"
                  spellCheck={false}
                />
              </ToolField>
              {field.error && <ToolStatus id={`${field.id}-error`} tone="error" className="break-all">{field.error}</ToolStatus>}
            </ToolPanelBody>
          </ToolPanel>
        ))}
      </div>
    </ToolLayout>
  );
}
