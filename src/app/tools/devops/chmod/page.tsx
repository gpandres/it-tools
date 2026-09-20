"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/components/notification-provider";
import { Copy } from "lucide-react";
import { useState } from "react";

const entities = ["Owner", "Group", "Public"] as const;
const permissions = [{ name: "Read", bit: 4 }, { name: "Write", bit: 2 }, { name: "Execute", bit: 1 }] as const;
const symbols = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];

export default function ChmodCalculator() {
  const [input, setInput] = useState("755");
  const { notify } = useNotification();
  const valid = /^[0-7]{1,3}$/.test(input);
  const invalid = !!input && !valid;
  const octal = valid ? input.padStart(3, "0") : "000";
  const digits = [...octal].map(Number);
  const symbolic = `-${digits.map(digit => symbols[digit]).join("")}`;
  const command = `chmod ${octal} file.txt`;

  const togglePermission = (entity: number, bit: number) => {
    const next = [...digits];
    next[entity] ^= bit;
    setInput(next.join(""));
  };

  const copy = async (value: string) => {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the result and copy it manually.", "error");
    }
  };

  return (
    <ToolLayout title="Chmod Calculator" description="Calculate file permissions using an interactive grid. Convert octal permissions to symbolic notation and a command example.">
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN">Permissions</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            <ToolField htmlFor="chmod-input" label="Octal permissions" helper="Enter one to three digits from 0 to 7. Short values are padded with zeros. Special bits (setuid, setgid, sticky) are not supported.">
              <Input id="chmod-input" value={input} onChange={event => setInput(event.target.value)} inputMode="numeric" spellCheck={false}
                aria-invalid={invalid} aria-describedby={invalid ? "chmod-error" : undefined}
                className="rounded-none border-[#1a1a1a] bg-black! text-center text-xl tracking-widest text-zinc-300" />
            </ToolField>
            {invalid && <ToolStatus id="chmod-error" tone="error" title="Invalid octal permissions">Use one to three digits between 0 and 7, for example 755.</ToolStatus>}
            <div className="space-y-3">
              {entities.map((entity, index) => (
                <fieldset key={entity} disabled={invalid} className="min-w-0 border border-[#1a1a1a] bg-black p-3 disabled:opacity-50">
                  <legend className="px-1 text-xs font-bold text-zinc-300">{entity}</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {permissions.map(permission => (
                      <label key={permission.bit} className="flex min-h-10 cursor-pointer flex-col items-center justify-center gap-2 text-xs text-zinc-300 sm:flex-row sm:flex-wrap">
                        <input type="checkbox" aria-label={`${entity} ${permission.name.toLowerCase()}`} checked={!!(digits[index] & permission.bit)}
                          onChange={() => togglePermission(index, permission.bit)}
                          className="h-4 w-4 accent-[#00ff9c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00ff9c]" />
                        <span>{permission.name} ({permission.bit})</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Calculated Results</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-5">
            {valid ? (
              <>
                {[{ id: "chmod-symbolic", label: "Symbolic format", value: symbolic }, { id: "chmod-command", label: "Command example", value: command }].map(result => (
                  <ToolField key={result.id} htmlFor={result.id} label={result.label}>
                    <div className="flex min-w-0 items-center gap-2">
                      <Input id={result.id} readOnly value={result.value} className="min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black! text-zinc-300" />
                      <ToolActionButton aria-label={`Copy ${result.label.toLowerCase()}`} onClick={() => copy(result.value)}><Copy aria-hidden="true" /></ToolActionButton>
                    </div>
                  </ToolField>
                ))}
                <p className="text-xs leading-relaxed text-zinc-400">The leading dash represents a regular file. Replace file.txt with your target path before using the command.</p>
              </>
            ) : <ToolEmptyState title={invalid ? "Fix the permissions to continue" : "Awaiting permissions"}>Enter an octal value or select permissions in the grid.</ToolEmptyState>}
            <div className="space-y-3 border-t border-[#1a1a1a] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">Quick Reference</h3>
              <dl className="space-y-2 text-xs text-zinc-400">
                {[{ oct: "777", description: "Read, write and execute for everyone" }, { oct: "755", description: "Owner writes; everyone reads and executes" }, { oct: "644", description: "Owner writes; everyone reads" }, { oct: "600", description: "Owner reads and writes only" }].map(example => (
                  <div key={example.oct} className="flex items-start gap-4"><dt className="font-bold text-zinc-300">{example.oct}</dt><dd>{example.description}</dd></div>
                ))}
              </dl>
            </div>
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
