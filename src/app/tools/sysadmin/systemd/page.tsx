"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolCodeField, ToolStatus, ToolEmptyState } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const control = "w-full min-w-0 rounded-none border-[#1a1a1a] bg-black! text-zinc-300";
const policies = { no: "Never", "on-failure": "On failure", always: "Always", "on-abnormal": "On abnormal termination" };
const restrictions = { noNewPrivileges: "NoNewPrivileges", privateTmp: "PrivateTmp", protectHome: "ProtectHome" } as const;
const singleLine = (value: string) => !/[\r\n\0]/.test(value);
const quoteLiteral = (value: string) => '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\t/g, "\\t").replace(/%/g, "%%") + '"';

export default function SystemdGeneratorTool() {
  const [values, setValues] = useState({ name: "my-app", description: "My Custom Node.js App", command: "/usr/bin/node /opt/myapp/server.js", directory: "/opt/myapp", user: "nobody", delay: "5" });
  const [restart, setRestart] = useState<keyof typeof policies>("on-failure");
  const [hardening, setHardening] = useState({ noNewPrivileges: true, privateTmp: true, protectHome: true });
  const [envVars, setEnvVars] = useState<{ id: string; key: string; val: string }[]>([]);
  const name = values.name.trim().replace(/\.service$/, "");
  const errors = {
    name: !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name) || name.length > 247 ? "Use 1–247 letters, digits, dots, hyphens or underscores; start with a letter or digit." : "",
    description: !singleLine(values.description) || /\\$/.test(values.description.trim()) ? "Use a single line without a trailing backslash." : "",
    command: !values.command.trim() || !singleLine(values.command) || /\\$/.test(values.command.trim()) ? "Enter a single-line command without a trailing backslash." : "",
    directory: values.directory && (!singleLine(values.directory) || !values.directory.startsWith("/") || /[\\\s]$/.test(values.directory)) ? "Use an absolute directory path without trailing whitespace or a backslash, or leave empty." : "",
    user: values.user && !/^(?:[a-zA-Z_][a-zA-Z0-9_-]*\$?|[0-9]+)$/.test(values.user) ? "Enter a user name or numeric UID, or leave empty for root." : "",
    delay: restart !== "no" && (!values.delay.trim() || !Number.isFinite(Number(values.delay)) || Number(values.delay) < 0) ? "Enter a finite, non-negative delay in seconds." : "",
  };
  const envErrors = envVars.map(env => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(env.key) ? "Enter a valid variable name." : envVars.filter(other => other.key === env.key).length > 1 ? "Variable names must be unique." : !singleLine(env.val) ? "Use a single-line value." : "");
  const invalid = Object.values(errors).some(Boolean) || envErrors.some(Boolean);
  const code = [
    "[Unit]", "Description=" + (values.description.trim() || name).replace(/%/g, "%%"), "After=network-online.target", "Wants=network-online.target", "",
    "[Service]", "Type=simple",
    ...(values.user ? ["User=" + values.user] : []),
    ...(values.directory ? ["WorkingDirectory=" + values.directory.replace(/%/g, "%%")] : []),
    "ExecStart=" + values.command.trim(), "Restart=" + restart,
    ...(restart !== "no" ? ["RestartSec=" + Number(values.delay)] : []),
    ...envVars.map(env => "Environment=" + quoteLiteral(env.key + "=" + env.val)),
    ...(Object.keys(restrictions) as (keyof typeof restrictions)[]).filter(key => hardening[key]).map(key => restrictions[key] + "=true"),
    "", "[Install]", "WantedBy=multi-user.target", "",
  ].join("\n");
  const fields = [
    { key: "name", label: "Service name", helper: "A .service suffix is added once. Template units are not supported." },
    { key: "description", label: "Description", helper: "A short description of the service." },
    { key: "command", label: "ExecStart command", helper: "Use an absolute executable path. This is systemd command syntax, not a shell: pipes and redirects need an explicit shell. Use %% for a literal percent and $$ for a literal dollar." },
    { key: "user", label: "Run as user", helper: "The account must exist on the target machine. Empty means root." },
    { key: "directory", label: "Working directory", helper: "Optional absolute path. Spaces are preserved; percent signs are escaped automatically." },
  ] as const;

  return <ToolLayout title="Systemd Service Generator" description="Build and download a systemd service unit locally, with environment variables and optional hardening.">
    <div className="mx-auto grid w-full max-w-6xl min-w-0 items-start gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="IN">Unit & service</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {fields.map(field => <ToolField key={field.key} htmlFor={"service-" + field.key} label={field.label}>
              <Input id={"service-" + field.key} value={values[field.key]} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))} className={control} aria-invalid={!!errors[field.key]} aria-describedby={"service-" + field.key + "-help"} />
              <p id={"service-" + field.key + "-help"} className={"text-xs leading-relaxed " + (errors[field.key] ? "text-red-400" : "text-zinc-400")}>{errors[field.key] || field.helper}</p>
            </ToolField>)}
            <ToolField htmlFor="service-restart" label="Restart policy">
              <Select value={restart} onValueChange={value => { if (value && value in policies) setRestart(value as keyof typeof policies); }}>
                <SelectTrigger id="service-restart" className={control}><SelectValue>{policies[restart]}</SelectValue></SelectTrigger>
                <SelectContent>{(Object.keys(policies) as (keyof typeof policies)[]).map(policy => <SelectItem key={policy} value={policy}>{policies[policy]}</SelectItem>)}</SelectContent>
              </Select>
            </ToolField>
            {restart !== "no" && <ToolField htmlFor="service-delay" label="Restart delay (seconds)">
              <Input id="service-delay" type="number" min="0" step="any" value={values.delay} onChange={event => setValues(previous => ({ ...previous, delay: event.target.value }))} className={control} aria-invalid={!!errors.delay} aria-describedby={errors.delay ? "service-delay-error" : undefined} />
              {errors.delay && <p id="service-delay-error" className="text-xs text-red-400">{errors.delay}</p>}
            </ToolField>}
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="ENV">Environment</ToolPanelTitle><ToolActionButton onClick={() => setEnvVars(previous => [...previous, { id: crypto.randomUUID(), key: "", val: "" }])}><Plus aria-hidden="true" /> Add variable</ToolActionButton></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {!envVars.length && <ToolEmptyState title="No environment variables">Add a variable when the service needs it.</ToolEmptyState>}
            {envVars.map((env, index) => <div key={env.id} className="space-y-3 border border-[#1a1a1a] p-3">
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <ToolField htmlFor={"env-key-" + env.id} label={"Variable " + (index + 1) + " name"}><Input id={"env-key-" + env.id} value={env.key} onChange={event => setEnvVars(previous => previous.map(item => item.id === env.id ? { ...item, key: event.target.value } : item))} className={control} aria-invalid={!!envErrors[index]} aria-describedby={envErrors[index] ? "env-error-" + env.id : undefined} /></ToolField>
                <ToolField htmlFor={"env-value-" + env.id} label={"Variable " + (index + 1) + " value"}><Input id={"env-value-" + env.id} value={env.val} onChange={event => setEnvVars(previous => previous.map(item => item.id === env.id ? { ...item, val: event.target.value } : item))} className={control} /></ToolField>
              </div>
              {envErrors[index] && <p id={"env-error-" + env.id} className="text-xs text-red-400">{envErrors[index]}</p>}
              <ToolActionButton aria-label={"Remove variable " + (index + 1)} onClick={() => setEnvVars(previous => previous.filter(item => item.id !== env.id))}><Trash2 aria-hidden="true" /> Remove</ToolActionButton>
            </div>)}
            <p className="text-xs text-zinc-400">Values are literal: spaces, quotes, backslashes and percent signs are preserved. Avoid storing secrets in unit files.</p>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="SEC">Service hardening</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {(Object.keys(restrictions) as (keyof typeof restrictions)[]).map(key => <div key={key} className="flex items-center gap-3 text-xs text-zinc-300"><Checkbox id={"hardening-" + key} checked={hardening[key]} onCheckedChange={checked => setHardening(previous => ({ ...previous, [key]: checked === true }))} /><label htmlFor={"hardening-" + key}>{restrictions[key]}</label></div>)}
            <p className="text-xs leading-relaxed text-zinc-400">ProtectHome restricts access to home directories. Check that these settings allow the files and devices your service needs.</p>
          </ToolPanelBody>
        </ToolPanel>
      </div>
      <div className="min-w-0 space-y-6">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Service unit</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            {invalid ? <ToolStatus tone="error">Correct the highlighted fields before copying or downloading the service.</ToolStatus> : <><p className="break-all text-xs text-zinc-400">/etc/systemd/system/{name}.service</p><ToolCodeField language="systemd" code={code} filename={name + ".service"} /></>}
          </ToolPanelBody>
        </ToolPanel>
        {!invalid && <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="RUN">Install on target</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <p className="text-xs leading-relaxed text-zinc-400">Save the unit at the path above. Verify it on the target Linux host before enabling the service.</p>
            <ToolCodeField language="shell" downloadable={false} code={["sudo systemd-analyze verify /etc/systemd/system/" + name + ".service", "sudo systemctl daemon-reload", "sudo systemctl enable --now " + name + ".service"].join("\n")} />
          </ToolPanelBody>
        </ToolPanel>}
        {(!values.user || values.user === "root") && <ToolStatus tone="attention">This service runs as root. Use a dedicated account when elevated privileges are not required.</ToolStatus>}
      </div>
    </div>
  </ToolLayout>;
}
