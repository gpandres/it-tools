"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { dump } from "js-yaml";
import { v4 as uuidv4 } from "uuid";
import { ToolLayout } from "@/components/tool-layout";
import { validateSigmaRule } from "@/lib/sigma";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolCodeField, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SigmaBuilderPage() {
  const [title, setTitle] = useState("Suspicious process execution");
  const [product, setProduct] = useState("windows");
  const [service, setService] = useState("sysmon");
  const [field, setField] = useState("Image");
  const [values, setValues] = useState("powershell.exe\ncmd.exe");
  const [condition, setCondition] = useState("selection");
  const [ruleId, setRuleId] = useState("");
  const [status, setStatus] = useState("experimental");
  const [level, setLevel] = useState("medium");
  
  const output = useMemo(() => {
    const selectionValues = values.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    const document = {
      title: title.trim() || "Untitled Sigma rule",
      ...(ruleId.trim() ? { id: ruleId.trim() } : {}),
      status,
      description: "Generated locally; review and tune before deployment.",
      logsource: { product: product.trim() || "generic", service: service.trim() || "generic" },
      detection: { selection: { [field.trim() || "CommandLine"]: selectionValues.length ? selectionValues : ["replace-me"] }, condition: condition.trim() || "selection" },
      level,
    };
    return dump(document, { noRefs: true, lineWidth: -1 });
  }, [condition, field, level, product, ruleId, service, status, title, values]);
  
  const validation = useMemo(() => validateSigmaRule(output), [output]);

  return (
    <ToolLayout title="SIGMA RULE BUILDER" description="Create a portable Sigma detection rule locally and adapt it to your SIEM or EDR pipeline.">
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="IN" className="text-sm text-[#ffb000] glow-amber">Rule inputs</ToolPanelTitle>
            </ToolPanelHeader>
            <ToolPanelBody className="grid gap-4 sm:grid-cols-2">
              <ToolField htmlFor="sigma-title" label="TITLE" className="sm:col-span-2">
                <Input 
                  id="sigma-title"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                />
              </ToolField>
              <ToolField htmlFor="sigma-product" label="PRODUCT">
                <Input 
                  id="sigma-product"
                  value={product} 
                  onChange={e => setProduct(e.target.value)} 
                  placeholder="windows" 
                  className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                />
              </ToolField>
              <ToolField htmlFor="sigma-service" label="SERVICE">
                <Input 
                  id="sigma-service"
                  value={service} 
                  onChange={e => setService(e.target.value)} 
                  placeholder="sysmon" 
                  className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                />
              </ToolField>
              <ToolField htmlFor="sigma-field" label="DETECTION FIELD">
                <Input 
                  id="sigma-field"
                  value={field} 
                  onChange={e => setField(e.target.value)} 
                  placeholder="CommandLine" 
                  className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                />
              </ToolField>
              <ToolField htmlFor="sigma-ruleid" label="RULE ID" helper="Optional UUIDv4">
                <div className="flex gap-2">
                  <Input 
                    id="sigma-ruleid"
                    value={ruleId} 
                    onChange={e => setRuleId(e.target.value)} 
                    placeholder="UUIDv4" 
                    className="min-w-0 flex-1 rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                  />
                  <ToolActionButton onClick={() => setRuleId(uuidv4())} title="Generate UUIDv4" aria-label="Generate UUIDv4" tone="neutral">
                    <RefreshCw className="h-4 w-4" />
                  </ToolActionButton>
                </div>
              </ToolField>
              <ToolField htmlFor="sigma-condition" label="CONDITION">
                <Input 
                  id="sigma-condition"
                  value={condition} 
                  onChange={e => setCondition(e.target.value)} 
                  placeholder="selection" 
                  className="rounded-none border-[#1a1a1a] bg-black font-mono text-zinc-300 focus-visible:ring-[#00ff9c]" 
                />
              </ToolField>
              <ToolField htmlFor="sigma-status" label="STATUS">
                <Select value={status} onValueChange={value => { if (value !== null) setStatus(value); }}>
                  <SelectTrigger id="sigma-status" className="rounded-none border-[#1a1a1a] bg-black font-mono focus:ring-[#00ff9c]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#1a1a1a] bg-black">
                    <SelectItem value="experimental" className="font-mono text-sm focus:bg-[#1a1a1a]">experimental</SelectItem>
                    <SelectItem value="test" className="font-mono text-sm focus:bg-[#1a1a1a]">test</SelectItem>
                    <SelectItem value="stable" className="font-mono text-sm focus:bg-[#1a1a1a]">stable</SelectItem>
                    <SelectItem value="deprecated" className="font-mono text-sm focus:bg-[#1a1a1a]">deprecated</SelectItem>
                    <SelectItem value="unsupported" className="font-mono text-sm focus:bg-[#1a1a1a]">unsupported</SelectItem>
                  </SelectContent>
                </Select>
              </ToolField>
              <ToolField htmlFor="sigma-level" label="LEVEL">
                <Select value={level} onValueChange={value => { if (value !== null) setLevel(value); }}>
                  <SelectTrigger id="sigma-level" className="rounded-none border-[#1a1a1a] bg-black font-mono focus:ring-[#00ff9c]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#1a1a1a] bg-black">
                    <SelectItem value="informational" className="font-mono text-sm focus:bg-[#1a1a1a]">informational</SelectItem>
                    <SelectItem value="low" className="font-mono text-sm focus:bg-[#1a1a1a]">low</SelectItem>
                    <SelectItem value="medium" className="font-mono text-sm focus:bg-[#1a1a1a]">medium</SelectItem>
                    <SelectItem value="high" className="font-mono text-sm focus:bg-[#1a1a1a]">high</SelectItem>
                    <SelectItem value="critical" className="font-mono text-sm focus:bg-[#1a1a1a]">critical</SelectItem>
                  </SelectContent>
                </Select>
              </ToolField>
              <ToolField htmlFor="sigma-values" label="VALUES" helper="One per line" className="sm:col-span-2">
                <Textarea 
                  id="sigma-values"
                  value={values} 
                  onChange={e => setValues(e.target.value)} 
                  spellCheck={false} 
                  className="min-h-40 w-full resize-y rounded-none border-[#1a1a1a] bg-black p-3 font-mono text-sm text-zinc-300 focus-visible:ring-1 focus-visible:ring-[#00ff9c]" 
                />
              </ToolField>
            </ToolPanelBody>
          </ToolPanel>

          <ToolPanel className="flex flex-col">
            <ToolPanelHeader>
              <ToolPanelTitle marker="OUT" className="text-sm">Sigma YAML <span className="cursor-blink">_</span></ToolPanelTitle>
            </ToolPanelHeader>
            <div className="flex-1 min-h-[400px]">
              <ToolCodeField
                language="YAML"
                code={output}
                filename="rule.yml"
                mimeType="application/x-yaml"
              />
            </div>
            <ToolPanelBody className="border-t border-[#1a1a1a]">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#ffb000]">Validation</h3>
              {validation.length === 0 ? (
                <ToolStatus tone="success" title="Valid">No local schema issues detected.</ToolStatus>
              ) : (
                <div className="space-y-2">
                  {validation.map((item, index) => (
                    <ToolStatus 
                      key={`${item.severity}-${index}`} 
                      tone={item.severity === "error" ? "error" : "attention"} 
                      title={item.severity.toUpperCase()}
                    >
                      {item.message}
                    </ToolStatus>
                  ))}
                </div>
              )}
            </ToolPanelBody>
          </ToolPanel>

        </div>
      </div>
    </ToolLayout>
  );
}
