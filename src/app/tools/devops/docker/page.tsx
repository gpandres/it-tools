"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";

function parseDockerRun(cmd: string): string {
  if (!cmd || !cmd.trim().startsWith("docker run")) return "";

  // Helper to split command line arguments considering quotes
  const argRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const rawArgs: string[] = [];
  let match;
  while ((match = argRegex.exec(cmd)) !== null) {
    rawArgs.push(match[1] ?? match[2] ?? match[0]);
  }

  // Skip "docker run"
  let args = rawArgs.slice(2);
  
  // Remove trailing slashes and backslashes if people pasted multi-line commands
  args = args.filter(a => a !== "\\" && a !== "");

  const compose: any = {
    version: "3.8",
    services: {},
  };

  const service: any = {};
  let containerName = "app";
  let image = "";
  const command: string[] = [];
  const ports: string[] = [];
  const volumes: string[] = [];
  const environment: string[] = [];
  
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "-d" || arg === "--detach" || arg === "-it" || arg === "-i" || arg === "-t" || arg === "--rm") {
      i++;
      continue;
    }

    if (arg === "--name" && i + 1 < args.length) {
      containerName = args[++i];
      service.container_name = containerName;
    } else if ((arg === "-p" || arg === "--publish") && i + 1 < args.length) {
      ports.push(args[++i]);
    } else if ((arg === "-v" || arg === "--volume") && i + 1 < args.length) {
      volumes.push(args[++i]);
    } else if ((arg === "-e" || arg === "--env") && i + 1 < args.length) {
      environment.push(args[++i]);
    } else if (arg === "--network" && i + 1 < args.length) {
      service.network_mode = args[++i];
    } else if (arg === "--restart" && i + 1 < args.length) {
      service.restart = args[++i];
    } else if (arg === "--privileged") {
      service.privileged = true;
    } else if (arg === "--entrypoint" && i + 1 < args.length) {
      service.entrypoint = args[++i];
    } else if (arg.startsWith("-")) {
      // Unhandled flag, skip it and its value if it doesn't contain '=' and next arg isn't a flag
      if (!arg.includes("=") && i + 1 < args.length && !args[i+1].startsWith("-")) {
        i++;
      }
    } else if (!image) {
      // First non-flag argument is the image
      image = arg;
    } else {
      // Arguments after the image are the command
      command.push(arg);
    }
    i++;
  }

  if (!image) {
    return "# Error: Could not detect Docker image in the command.";
  }

  service.image = image;
  if (ports.length > 0) service.ports = ports;
  if (volumes.length > 0) service.volumes = volumes;
  if (environment.length > 0) service.environment = environment;
  if (command.length > 0) service.command = command.join(" ");

  compose.services[containerName] = service;

  // Manual YAML stringification for basic docker-compose (avoids adding 'js-yaml' dep for just this)
  let yaml = `version: "3.8"\nservices:\n  ${containerName}:\n`;
  yaml += `    image: ${service.image}\n`;
  if (service.container_name) yaml += `    container_name: ${service.container_name}\n`;
  if (service.restart) yaml += `    restart: ${service.restart}\n`;
  if (service.privileged) yaml += `    privileged: true\n`;
  if (service.network_mode) yaml += `    network_mode: ${service.network_mode}\n`;
  if (service.entrypoint) yaml += `    entrypoint: ${service.entrypoint}\n`;
  
  if (service.environment && service.environment.length > 0) {
    yaml += `    environment:\n`;
    service.environment.forEach((env: string) => {
      yaml += `      - ${env}\n`;
    });
  }
  
  if (service.ports && service.ports.length > 0) {
    yaml += `    ports:\n`;
    service.ports.forEach((p: string) => {
      yaml += `      - "${p}"\n`;
    });
  }
  
  if (service.volumes && service.volumes.length > 0) {
    yaml += `    volumes:\n`;
    service.volumes.forEach((v: string) => {
      yaml += `      - ${v}\n`;
    });
  }
  
  if (service.command) yaml += `    command: ${service.command}\n`;

  return yaml;
}

function DockerConverterContent() {
  const [state, setState] = useState({ runCmd: "docker run -d --name nginx_server -p 8080:80 -v /my/custom/nginx.conf:/etc/nginx/nginx.conf -e TZ=Europe/Madrid --restart always nginx:latest" });
  const [copied, setCopied] = useState(false);

  const composeYaml = useMemo(() => parseDockerRun(state.runCmd), [state.runCmd]);

  const handleCopy = async () => {
    if (!composeYaml || composeYaml.startsWith("#")) return;
    try {
      await navigator.clipboard.writeText(composeYaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ToolLayout 
      title="Docker Run to Compose" 
      description="Convert a long 'docker run' CLI command into a valid 'docker-compose.yml' file instantly."
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Input */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col min-h-[400px]">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN]</span>
            <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Docker Run Command</span>
          </header>
          <div className="p-0 flex-1">
            <Textarea 
              value={state.runCmd}
              onChange={(e) => setState({ runCmd: e.target.value })}
              className="w-full h-full min-h-[350px] bg-black border-none text-zinc-300 font-mono text-sm p-6 focus-visible:ring-1 focus-visible:ring-[#00ff9c] rounded-none resize-none custom-scrollbar"
              placeholder="docker run -d -p 80:80 nginx"
            />
          </div>
        </article>

        {/* Output */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col min-h-[400px]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#00ff9c] text-sm font-semibold glow uppercase tracking-widest">docker-compose.yml</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy}
              disabled={!composeYaml || composeYaml.startsWith("#")}
              className="h-7 text-xs font-mono text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 rounded-none border border-transparent hover:border-[#00ff9c]/30"
            >
              {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
              Copy YAML
            </Button>
          </header>
          <div className="p-0 flex-1 bg-black relative">
            <Textarea
              readOnly
              value={composeYaml}
              className={`w-full h-full min-h-[350px] bg-transparent border-none font-mono text-sm p-6 focus-visible:ring-0 rounded-none resize-none custom-scrollbar ${composeYaml.startsWith("#") ? "text-red-400" : "text-[#00ff9c]"}`}
            />
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}

export default function DockerConverter() {
  return (
    <DockerConverterContent />
  );
}
