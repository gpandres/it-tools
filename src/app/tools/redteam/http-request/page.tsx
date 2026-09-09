"use client";

import React, { useState, useMemo } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Plus, Trash2, Code2, Globe } from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type BodyType = "None" | "Raw" | "JSON" | "Form URL Encoded";
type Header = { key: string; value: string };

export default function HttpRequestBuilderPage() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://api.example.com/v1/users");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json" },
    { key: "User-Agent", value: "Mozilla/5.0" }
  ]);
  const [bodyType, setBodyType] = useState<BodyType>("None");
  const [bodyContent, setBodyContent] = useState('{\n  "username": "admin",\n  "password": "password123"\n}');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleAddHeader = () => setHeaders([...headers, { key: "", value: "" }]);
  
  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };
  
  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const snippets = useMemo(() => {
    const cleanHeaders = headers.filter(h => h.key.trim() !== "");
    const headerStringCurl = cleanHeaders.map(h => `-H "${h.key}: ${h.value}"`).join(" \\\n  ");
    
    // cURL
    let curl = `curl -X ${method} "${url}"`;
    if (headerStringCurl) curl += ` \\\n  ${headerStringCurl}`;
    if (bodyType !== "None" && bodyContent) {
      // Escape single quotes for bash
      const safeBody = bodyContent.replace(/'/g, "'\\''");
      curl += ` \\\n  -d '${safeBody}'`;
    }

    // Python requests
    const headerDict = cleanHeaders.length > 0 
      ? `{\n${cleanHeaders.map(h => `    "${h.key}": "${h.value}"`).join(",\n")}\n}` 
      : `{}`;
    let python = `import requests\n\nurl = "${url}"\nheaders = ${headerDict}\n`;
    if (bodyType === "JSON") {
      python += `\npayload = ${bodyContent}\nresponse = requests.request("${method}", url, headers=headers, json=payload)`;
    } else if (bodyType !== "None") {
      python += `\npayload = """${bodyContent}"""\nresponse = requests.request("${method}", url, headers=headers, data=payload)`;
    } else {
      python += `\nresponse = requests.request("${method}", url, headers=headers)`;
    }

    // JavaScript fetch
    const fetchHeaders = cleanHeaders.length > 0 
      ? `{\n${cleanHeaders.map(h => `    "${h.key}": "${h.value}"`).join(",\n")}  \n}` 
      : `{}`;
    let js = `fetch("${url}", {\n  method: "${method}",\n  headers: ${fetchHeaders}`;
    if (bodyType !== "None") {
      if (bodyType === "JSON") {
        js += `,\n  body: JSON.stringify(${bodyContent})`;
      } else {
        js += `,\n  body: \`${bodyContent.replace(/`/g, "\\`")}\``;
      }
    }
    js += `\n})\n.then(response => response.text())\n.then(result => console.log(result))\n.catch(error => console.log('error', error));`;

    // Raw HTTP
    const hostMatch = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
    const host = hostMatch ? hostMatch[1] : "example.com";
    const path = url.replace(/^https?:\/\/[^/?#]+/, "") || "/";
    let raw = `${method} ${path} HTTP/1.1\nHost: ${host}`;
    cleanHeaders.forEach(h => {
      if (h.key.toLowerCase() !== 'host') raw += `\n${h.key}: ${h.value}`;
    });
    if (bodyType !== "None" && bodyContent) {
      raw += `\nContent-Length: ${bodyContent.length}\n\n${bodyContent}`;
    } else {
      raw += `\n`;
    }

    return { curl, python, js, raw };
  }, [method, url, headers, bodyType, bodyContent]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <ToolLayout
      title="HTTP Request Builder"
      description="Build, inspect, modify and export HTTP requests locally without sending them."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl mx-auto">
        
        {/* BUILDER SIDE */}
        <div className="space-y-6">
          
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-none overflow-hidden">
            <div className="bg-[#111] border-b border-[#1a1a1a] p-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00ff9c]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Request Configuration</h2>
            </div>
            <div className="p-4 space-y-4">
              
              <div className="flex gap-2">
                <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
                  <SelectTrigger className="w-[120px] bg-[#111] border-[#333] text-white rounded-none">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                    {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/v1/..."
                  className="flex-1 bg-[#111] border-[#333] font-mono text-sm rounded-none focus-visible:ring-[#00ff9c]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Headers</h3>
                  <Button variant="ghost" size="sm" onClick={handleAddHeader} className="h-6 text-xs text-[#00ff9c] hover:text-[#00cc7d] hover:bg-transparent px-2 rounded-none">
                    <Plus className="w-3 h-3 mr-1" /> Add Header
                  </Button>
                </div>
                <div className="space-y-2">
                  {headers.map((header, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input 
                        value={header.key}
                        onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                        placeholder="Name"
                        className="w-1/3 bg-[#111] border-[#333] font-mono text-xs h-8 rounded-none focus-visible:ring-[#00ff9c]"
                      />
                      <Input 
                        value={header.value}
                        onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 bg-[#111] border-[#333] font-mono text-xs h-8 rounded-none focus-visible:ring-[#00ff9c]"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveHeader(idx)} className="h-8 w-8 text-zinc-500 hover:text-red-400 rounded-none">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {headers.length === 0 && (
                    <div className="text-xs text-zinc-600 italic">No headers added.</div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 mt-6">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Body</h3>
                  <Select value={bodyType} onValueChange={(v) => setBodyType(v as BodyType)}>
                    <SelectTrigger className="w-[160px] h-6 text-xs bg-[#111] border-[#333] text-white rounded-none">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Raw">Raw</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="Form URL Encoded">Form URL Encoded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {bodyType !== "None" && (
                  <Textarea 
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    className="min-h-[150px] bg-[#111] border-[#333] font-mono text-xs rounded-none focus-visible:ring-[#00ff9c]"
                    placeholder={`Enter ${bodyType} body content here...`}
                  />
                )}
              </div>

            </div>
          </div>
        </div>

        {/* OUTPUT SIDE */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-none overflow-hidden flex flex-col h-full">
            <div className="bg-[#111] border-b border-[#1a1a1a] p-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#00ff9c]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Export Snippets</h2>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              
              <SnippetBlock title="Raw HTTP" code={snippets.raw} copiedId={copiedCode} onCopy={copyToClipboard} />
              <SnippetBlock title="cURL" code={snippets.curl} copiedId={copiedCode} onCopy={copyToClipboard} />
              <SnippetBlock title="Python requests" code={snippets.python} copiedId={copiedCode} onCopy={copyToClipboard} />
              <SnippetBlock title="JavaScript fetch" code={snippets.js} copiedId={copiedCode} onCopy={copyToClipboard} />

            </div>
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}

function SnippetBlock({ title, code, copiedId, onCopy }: { title: string, code: string, copiedId: string | null, onCopy: (text: string, id: string) => void }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{title}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onCopy(code, title)}
          className="h-5 px-2 text-xs text-zinc-400 hover:text-white rounded-none"
        >
          {copiedId === title ? <span className="text-[#00ff9c]">Copied!</span> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
        </Button>
      </div>
      <pre className="bg-[#111] border border-[#333] rounded-none p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}
