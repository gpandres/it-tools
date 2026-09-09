"use client";

import React, { useState } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy, Info, ShieldAlert } from "lucide-react";
import { Transformers } from '@/lib/transformers';
import Link from 'next/link';

type PayloadCategory = 'XSS' | 'SQL Injection' | 'Command Injection' | 'Path Traversal' | 'SSTI' | 'LDAP Injection';

type Payload = {
  id: string;
  category: PayloadCategory;
  name: string;
  original: string;
  explanation: string;
  context: string;
};

const PAYLOADS: Payload[] = [
  // XSS
  {
    id: "xss-1",
    category: "XSS",
    name: "Basic Reflected XSS",
    original: "<script>alert(1)</script>",
    explanation: "The most basic Cross-Site Scripting payload. It attempts to execute JavaScript directly via a script block.",
    context: "Reflected in the HTML body (e.g., between <div> tags) without sanitization or HTML encoding."
  },
  {
    id: "xss-2",
    category: "XSS",
    name: "Image Error Event",
    original: "<img src=x onerror=alert('XSS')>",
    explanation: "Bypasses filters that look specifically for <script> tags by using an invalid image source to trigger an inline event handler.",
    context: "Useful when tags like <img> are allowed, but <script> is blocked or sanitized."
  },
  
  // SQLi
  {
    id: "sqli-1",
    category: "SQL Injection",
    name: "Authentication Bypass (OR 1=1)",
    original: "' OR '1'='1",
    explanation: "A classic SQL injection vector that forces a WHERE clause to evaluate to true.",
    context: "Typically used in login forms: SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '...'"
  },
  {
    id: "sqli-2",
    category: "SQL Injection",
    name: "UNION Based Extraction",
    original: "' UNION SELECT username, password FROM users--",
    explanation: "Uses the UNION operator to combine the results of the original query with the results of an injected query.",
    context: "Used when the application returns the results of a database query directly in the HTTP response."
  },

  // Command Injection
  {
    id: "cmd-1",
    category: "Command Injection",
    name: "Command Chaining (Semicolon)",
    original: "; id",
    explanation: "Uses a semicolon to terminate the legitimate command and start a new one (Linux/Unix).",
    context: "Used when input is passed directly to a system shell (e.g., ping $ip)."
  },
  {
    id: "cmd-2",
    category: "Command Injection",
    name: "Command Chaining (Pipe)",
    original: "| whoami",
    explanation: "Pipes the output of the legitimate command to a new injected command.",
    context: "Common in both Windows (cmd.exe) and Unix shells."
  },

  // Path Traversal
  {
    id: "path-1",
    category: "Path Traversal",
    name: "Standard Unix Traversal",
    original: "../../../../../../../../etc/passwd",
    explanation: "Uses 'dot-dot-slash' to navigate up the directory tree and access sensitive system files.",
    context: "Used in file read/download endpoints (e.g., ?file=report.pdf)."
  },

  // SSTI
  {
    id: "ssti-1",
    category: "SSTI",
    name: "Jinja2 / Twig Evaluation",
    original: "{{7*7}}",
    explanation: "A basic Server-Side Template Injection test to see if the engine evaluates the expression (returning 49).",
    context: "Used when user input is concatenated directly into template files rather than passed as context variables."
  },

  // LDAP
  {
    id: "ldap-1",
    category: "LDAP Injection",
    name: "Auth Bypass (Wildcard)",
    original: "admin)(!(objectClass=*)",
    explanation: "Manipulates LDAP search filters using wildcards and logical operators to bypass authentication.",
    context: "Used in enterprise login forms authenticating against Active Directory or OpenLDAP."
  }
];

export default function WebPayloadLabPage() {
  const [selectedCategory, setSelectedCategory] = useState<PayloadCategory>('XSS');
  const [selectedPayloadId, setSelectedPayloadId] = useState<string>(PAYLOADS[0].id);
  const [encoding, setEncoding] = useState<'None' | 'URL' | 'HTML' | 'Base64'>('URL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredPayloads = PAYLOADS.filter(p => p.category === selectedCategory);
  const activePayload = PAYLOADS.find(p => p.id === selectedPayloadId) || filteredPayloads[0];

  const handleCategoryChange = (cat: PayloadCategory) => {
    setSelectedCategory(cat);
    const newPayloads = PAYLOADS.filter(p => p.category === cat);
    if (newPayloads.length > 0) {
      setSelectedPayloadId(newPayloads[0].id);
    }
  };

  const encodedPayload = React.useMemo(() => {
    if (!activePayload) return "";
    switch (encoding) {
      case 'URL': return Transformers.urlEncode(activePayload.original);
      case 'HTML': return Transformers.htmlEncode(activePayload.original);
      case 'Base64': return Transformers.base64Encode(activePayload.original);
      default: return activePayload.original;
    }
  }, [activePayload, encoding]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <ToolLayout
      title="Web Payload Lab"
      description="Explore and transform common web security payloads in a local educational sandbox."
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        
        {/* DISCLAIMER */}
        <div className="bg-amber-950/30 border border-amber-900/50 rounded-none p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-200">
            <strong>Educational Purpose Only:</strong> These payloads are provided for authorized security testing (CTFs, local labs, and penetration tests) to help defenders understand and mitigate vulnerabilities. Do not use them against systems you do not have permission to test.
          </div>
        </div>

        {/* SELECTORS */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Vulnerability Category</label>
            <Select value={selectedCategory} onValueChange={(v) => handleCategoryChange(v as PayloadCategory)}>
              <SelectTrigger className="w-full bg-[#111] border-[#333] text-white rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                {Array.from(new Set(PAYLOADS.map(p => p.category))).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Payload Example</label>
            <Select value={selectedPayloadId} onValueChange={(val) => setSelectedPayloadId(val || "")}>
              <SelectTrigger className="w-full bg-[#111] border-[#333] text-white rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                {filteredPayloads.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* PAYLOAD DETAILS */}
        {activePayload && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: Data */}
            <div className="space-y-6">
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Original Payload</h3>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(activePayload.original, 'original')} className="h-6 text-xs text-[#00ff9c] hover:bg-transparent rounded-none">
                    {copiedCode === 'original' ? 'Copied!' : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                  </Button>
                </div>
                <div className="bg-[#0a0a0a] border border-[#333] rounded-none p-4 font-mono text-sm text-white break-all">
                  {activePayload.original}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Encoded Payload</h3>
                  <div className="flex items-center gap-2">
                    <Select value={encoding} onValueChange={(v) => setEncoding(v as any)}>
                      <SelectTrigger className="w-[120px] h-6 text-xs bg-[#111] border-[#333] text-white rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-[#333] text-white rounded-none">
                        <SelectItem value="None">No Encoding</SelectItem>
                        <SelectItem value="URL">URL Encode</SelectItem>
                        <SelectItem value="HTML">HTML Entities</SelectItem>
                        <SelectItem value="Base64">Base64</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(encodedPayload, 'encoded')} className="h-6 text-xs text-[#00ff9c] hover:bg-transparent rounded-none">
                      {copiedCode === 'encoded' ? 'Copied!' : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                    </Button>
                  </div>
                </div>
                <div className="bg-[#111] border border-[#333] rounded-none p-4 font-mono text-sm text-zinc-400 break-all min-h-[60px]">
                  {encodedPayload}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Explanation */}
            <div className="space-y-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-none p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-[#00ff9c]" />
                <h2 className="text-sm font-bold text-white">Understanding the Payload</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Mechanism</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">{activePayload.explanation}</p>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Expected Context</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed italic border-l-2 border-[#333] pl-3">{activePayload.context}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#1a1a1a]">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Related Blue Team Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/tools/security/scorecard">
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white rounded-none">
                        Headers & TLS Scorecard
                      </Button>
                    </Link>
                    <Link href="/tools/security/log-parser">
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white rounded-none">
                        Local Log Parser
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </ToolLayout>
  );
}
