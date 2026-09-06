"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Shield, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalysisResult {
  domain: string;
  headers: Record<string, string>;
  tls: {
    issuer: string;
    validFrom: string;
    validTo: string;
    subject: string;
    fingerprint: string;
  } | null;
  dns: {
    spf: string | null;
    dmarc: string | null;
  };
}

export default function SecurityScorecard() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/analyze-domain?domain=${encodeURIComponent(domain)}`);
      if (!res.ok) {
        throw new Error("Failed to analyze domain. Make sure it is reachable.");
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getHeaderStatus = (headerName: string, expectedVal?: string | RegExp) => {
    if (!result) return false;
    const lowerHeaders = Object.keys(result.headers).reduce((acc, k) => {
      acc[k.toLowerCase()] = result.headers[k];
      return acc;
    }, {} as Record<string, string>);

    const val = lowerHeaders[headerName.toLowerCase()];
    if (!val) return false;
    
    if (expectedVal) {
      if (typeof expectedVal === "string") return val.includes(expectedVal);
      if (expectedVal instanceof RegExp) return expectedVal.test(val);
    }
    return true;
  };

  // Score calculation
  let score = 100;
  let grade = "A";
  
  if (result) {
    if (!getHeaderStatus("Strict-Transport-Security")) score -= 20;
    if (!getHeaderStatus("Content-Security-Policy")) score -= 20;
    if (!getHeaderStatus("X-Frame-Options")) score -= 10;
    if (!getHeaderStatus("X-Content-Type-Options")) score -= 10;
    if (!getHeaderStatus("Referrer-Policy")) score -= 10;
    if (!result.dns.spf) score -= 10;
    if (!result.dns.dmarc) score -= 10;
    if (!result.tls) score -= 10;

    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";
    else grade = "F";
  }

  const exportMarkdown = () => {
    if (!result) return;
    
    const md = `
# Security Scorecard: ${result.domain}
**Grade:** ${grade} (Score: ${score}/100)

## HTTP Security Headers
- Strict-Transport-Security: ${getHeaderStatus("Strict-Transport-Security") ? "PASS" : "FAIL"}
- Content-Security-Policy: ${getHeaderStatus("Content-Security-Policy") ? "PASS" : "FAIL"}
- X-Frame-Options: ${getHeaderStatus("X-Frame-Options") ? "PASS" : "FAIL"}
- X-Content-Type-Options: ${getHeaderStatus("X-Content-Type-Options") ? "PASS" : "FAIL"}
- Referrer-Policy: ${getHeaderStatus("Referrer-Policy") ? "PASS" : "FAIL"}

## TLS / SSL
- Certificate: ${result.tls ? "PRESENT" : "MISSING"}
- Issuer: ${result.tls?.issuer || "N/A"}
- Subject: ${result.tls?.subject || "N/A"}
- Expires: ${result.tls?.validTo ? new Date(result.tls.validTo).toUTCString() : "N/A"}

## DNS Security
- SPF Record: ${result.dns.spf ? "PASS" : "FAIL"}
  - Value: ${result.dns.spf || "None"}
- DMARC Record: ${result.dns.dmarc ? "PASS" : "FAIL"}
  - Value: ${result.dns.dmarc || "None"}
`;
    
    const blob = new Blob([md.trim()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorecard-${result.domain}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout 
      title="Security Headers & TLS Scorecard" 
      description="Analyze a domain's HTTP security headers, TLS certificates, and DNS security posture."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Privacy Notice */}
        <div className="bg-[#00ff9c]/10 border border-[#00ff9c]/30 p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#00ff9c] shrink-0 mt-0.5" />
          <div className="text-sm text-[#00ff9c]/90">
            <strong>Privacy Notice:</strong> Everything is processed in your browser. The only server-side action is a single API call from your local server to fetch the raw headers, TLS certificate, and DNS records from the target domain. No data is stored, tracked, or sent to any third party.
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full pl-10 font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-12 text-zinc-200"
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
            />
          </div>
          <Button 
            onClick={analyze} 
            disabled={loading || !domain}
            className="h-12 px-8 rounded-none font-bold tracking-widest uppercase border border-[#00ff9c] text-black bg-[#00ff9c] hover:bg-[#00ff9c]/80 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 p-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="text-red-400 font-mono text-sm">{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Score Overview */}
            <article className="lg:col-span-1 border border-[#1a1a1a] bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff9c] to-transparent opacity-50"></div>
              
              <div className="text-center space-y-4">
                <h3 className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Overall Grade</h3>
                <div className={`text-9xl font-bold font-mono leading-none ${
                  grade === 'A' ? 'text-[#00ff9c] drop-shadow-[0_0_25px_rgba(0,255,156,0.3)]' :
                  grade === 'B' ? 'text-blue-400 drop-shadow-[0_0_25px_rgba(96,165,250,0.3)]' :
                  grade === 'C' ? 'text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.3)]' :
                  grade === 'D' ? 'text-orange-400 drop-shadow-[0_0_25px_rgba(251,146,60,0.3)]' :
                  'text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                }`}>
                  {grade}
                </div>
                <div className="text-zinc-400 font-mono text-sm">Score: {score}/100</div>
              </div>

              <Button 
                variant="outline" 
                onClick={exportMarkdown}
                className="mt-8 rounded-none border-[#1a1a1a] text-zinc-400 hover:text-[#ffb000] hover:border-[#ffb000]/50"
              >
                <Download className="w-4 h-4 mr-2" /> Export Report
              </Button>
            </article>

            {/* Detailed Checks */}
            <div className="lg:col-span-2 space-y-6">
              
              <article className="border border-[#1a1a1a] bg-[#050505]">
                <header className="px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                  <span className="text-[#00ff9c] text-sm font-semibold uppercase tracking-widest">HTTP Security Headers</span>
                </header>
                <div className="p-0">
                  <CheckItem 
                    name="Strict-Transport-Security (HSTS)" 
                    passed={getHeaderStatus("Strict-Transport-Security")} 
                    desc="Forces browsers to use HTTPS, preventing downgrade attacks." 
                  />
                  <CheckItem 
                    name="Content-Security-Policy (CSP)" 
                    passed={getHeaderStatus("Content-Security-Policy")} 
                    desc="Prevents XSS by controlling which resources can be loaded." 
                  />
                  <CheckItem 
                    name="X-Frame-Options" 
                    passed={getHeaderStatus("X-Frame-Options")} 
                    desc="Prevents clickjacking by restricting how the page can be framed." 
                  />
                  <CheckItem 
                    name="X-Content-Type-Options" 
                    passed={getHeaderStatus("X-Content-Type-Options")} 
                    desc="Prevents MIME-sniffing, forcing browsers to respect the declared content type." 
                  />
                  <CheckItem 
                    name="Referrer-Policy" 
                    passed={getHeaderStatus("Referrer-Policy")} 
                    desc="Controls how much referrer information is included with requests." 
                  />
                </div>
              </article>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <article className="border border-[#1a1a1a] bg-[#050505]">
                  <header className="px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                    <span className="text-[#ffb000] text-sm font-semibold uppercase tracking-widest">TLS / SSL</span>
                  </header>
                  <div className="p-4 space-y-4">
                    {result.tls ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#00ff9c]" />
                          <span className="text-zinc-300 font-mono text-sm truncate">Cert Present</span>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase tracking-widest">Issuer</Label>
                          <div className="text-xs font-mono text-zinc-300 truncate">{result.tls.issuer}</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase tracking-widest">Expires</Label>
                          <div className="text-xs font-mono text-zinc-300">{new Date(result.tls.validTo).toLocaleDateString()}</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 font-mono text-sm">No valid TLS cert found</span>
                      </div>
                    )}
                  </div>
                </article>

                <article className="border border-[#1a1a1a] bg-[#050505]">
                  <header className="px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                    <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest">DNS Security</span>
                  </header>
                  <div className="p-0">
                    <CheckItem 
                      name="SPF Record" 
                      passed={!!result.dns.spf} 
                      desc={result.dns.spf || "Prevents email spoofing by authorizing IPs."} 
                    />
                    <CheckItem 
                      name="DMARC Policy" 
                      passed={!!result.dns.dmarc} 
                      desc={result.dns.dmarc || "Tells receivers how to handle emails failing SPF/DKIM."} 
                    />
                  </div>
                </article>
              </div>

            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

function CheckItem({ name, passed, desc }: { name: string, passed: boolean, desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-[#1a1a1a] last:border-0">
      <div className="mt-0.5 shrink-0">
        {passed ? (
          <CheckCircle className="w-4 h-4 text-[#00ff9c]" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-mono truncate ${passed ? 'text-zinc-200' : 'text-red-400'}`}>
          {name}
        </div>
        <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
          {desc}
        </div>
      </div>
    </div>
  );
}
