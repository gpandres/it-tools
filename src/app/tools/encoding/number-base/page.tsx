"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolStatus } from "@/components/tool-design";
import { useNotification } from "@/components/notification-provider";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy } from "lucide-react";

export default function NumberBaseConverter() {
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");
  const [binary, setBinary] = useState("");
  const [octal, setOctal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();

  const copy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the number and copy it manually.", "error");
    }
  };

  const updateAll = (value: string, base: number) => {
    setError(null);
    
    const cleanVal = value.replace(/\s+/g, "").toLowerCase();
    
    // Strict input filtering to prevent typing invalid characters entirely
    if (base === 10 && !/^-?\d*$/.test(cleanVal)) return;
    if (base === 16 && !/^-?[0-9a-f]*$/.test(cleanVal)) return;
    if (base === 2 && !/^-?[01]*$/.test(cleanVal)) return;
    if (base === 8 && !/^-?[0-7]*$/.test(cleanVal)) return;
    
    if (cleanVal === "" || cleanVal === "-") {
      setDecimal(value);
      setHex(value === "-" ? "-" : "");
      setBinary(value === "-" ? "-" : "");
      setOctal(value === "-" ? "-" : "");
      return;
    }

    try {

      // Use BigInt to support arbitrarily large numbers
      let isNegative = false;
      let parseVal = cleanVal;
      if (parseVal.startsWith("-")) {
        isNegative = true;
        parseVal = parseVal.substring(1);
      }

      // Parse to BigInt
      let bigNum: bigint;
      if (base === 10) {
        bigNum = BigInt(parseVal);
      } else if (base === 16) {
        bigNum = BigInt("0x" + parseVal);
      } else if (base === 2) {
        bigNum = BigInt("0b" + parseVal);
      } else if (base === 8) {
        bigNum = BigInt("0o" + parseVal);
      } else {
        throw new Error("Unknown base");
      }

      if (isNegative) {
        bigNum = -bigNum;
      }

      if (base !== 10) setDecimal(bigNum.toString(10));
      else setDecimal(value);

      if (base !== 16) setHex((isNegative ? "-" : "") + (bigNum < BigInt(0) ? -bigNum : bigNum).toString(16).toUpperCase());
      else setHex(value.toUpperCase());

      if (base !== 2) setBinary((isNegative ? "-" : "") + (bigNum < BigInt(0) ? -bigNum : bigNum).toString(2));
      else setBinary(value);

      if (base !== 8) setOctal((isNegative ? "-" : "") + (bigNum < BigInt(0) ? -bigNum : bigNum).toString(8));
      else setOctal(value);

    } catch (e) {
      setError((e as Error).message);
      // We still update the specific input so the user can fix their typo
      if (base === 10) setDecimal(value);
      if (base === 16) setHex(value.toUpperCase());
      if (base === 2) setBinary(value);
      if (base === 8) setOctal(value);
    }
  };

  return (
    <ToolLayout 
      title="Number Base Converter" 
      description="Convert numbers between Decimal, Hexadecimal, Binary, and Octal formats instantly. Supports arbitrarily large numbers."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <BaseInputBox 
          title="Decimal (Base 10)" 
          value={decimal}
          onChange={(val) => updateAll(val, 10)}
          onCopy={() => copy(decimal)}
          error={error}
          prefix=""
        />
        <BaseInputBox 
          title="Hexadecimal (Base 16)" 
          value={hex}
          onChange={(val) => updateAll(val, 16)}
          onCopy={() => copy(hex)}
          error={error}
          prefix="0x"
        />
        <BaseInputBox 
          title="Binary (Base 2)" 
          value={binary}
          onChange={(val) => updateAll(val, 2)}
          onCopy={() => copy(binary)}
          error={error}
          prefix="0b"
        />
        <BaseInputBox 
          title="Octal (Base 8)" 
          value={octal}
          onChange={(val) => updateAll(val, 8)}
          onCopy={() => copy(octal)}
          error={error}
          prefix="0o"
        />
      </div>
      
      {error && (
        <ToolStatus id="number-base-error" tone="error" className="mx-auto mt-6 max-w-5xl">{error}</ToolStatus>
      )}
    </ToolLayout>
  );
}

function BaseInputBox({ 
  title, 
  value, 
  onChange, 
  onCopy, 
  error,
  prefix
}: { 
  title: string, 
  value: string, 
  onChange: (val: string) => void,
  onCopy: () => void,
  error: string | null,
  prefix: string
}) {
  const name = title.split(" ")[0];
  const id = `number-${name.toLowerCase()}`;
  return (
    <ToolPanel>
      <ToolPanelHeader>
        <ToolPanelTitle marker="IN/OUT">{title}</ToolPanelTitle>
        <ToolActionButton aria-label={`Copy ${name.toLowerCase()}`} disabled={!value || value.trim() === "-"} onClick={onCopy}>
          <Copy aria-hidden="true" /> Copy
        </ToolActionButton>
      </ToolPanelHeader>
      <ToolPanelBody>
        <ToolField htmlFor={id} label={`${name} value`} helper="Whole numbers only. Spaces are ignored; a leading minus sign is allowed.">
        <div className="relative">
          {prefix && value && (
            <div aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none select-none">
              {prefix}
            </div>
          )}
          <Input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${title.split(' ')[0].toLowerCase()}...`}
            aria-invalid={!!error && !!value}
            aria-describedby={error ? "number-base-error" : undefined}
            className={`w-full min-w-0 text-base bg-black! border-[#1a1a1a] rounded-none h-12 text-zinc-300 ${prefix && value ? 'pl-9' : ''}`}
            spellCheck={false}
          />
        </div>
        </ToolField>
      </ToolPanelBody>
    </ToolPanel>
  );
}
