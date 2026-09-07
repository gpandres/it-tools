"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { FileBadge, ShieldAlert, Key, Calendar, Server, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import forge from "node-forge";

export default function X509Analyzer() {
  const [pemInput, setPemInput] = useState("");
  const [parsedCert, setParsedCert] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCertificate = (pem: string) => {
    if (!pem.trim()) {
      setParsedCert(null);
      setError(null);
      return;
    }

    try {
      // Basic cleanup in case there are invisible characters
      const cleanPem = pem.trim();
      const cert = forge.pki.certificateFromPem(cleanPem);
      
      const formatAttributes = (attributes: any[]) => {
        return attributes.reduce((acc, attr) => {
          acc[attr.shortName || attr.name || attr.type] = attr.value;
          return acc;
        }, {} as Record<string, string>);
      };

      const subject = formatAttributes(cert.subject.attributes);
      const issuer = formatAttributes(cert.issuer.attributes);
      
      let sans: string[] = [];
      const extAltName = cert.getExtension('subjectAltName') as any;
      if (extAltName) {
        // node-forge altNames
        if (extAltName.altNames) {
           sans = extAltName.altNames.map((n: any) => n.value);
        }
      }

      const notBefore = cert.validity.notBefore;
      const notAfter = cert.validity.notAfter;
      const now = new Date();
      const isExpired = now > notAfter;
      const isNotYetValid = now < notBefore;
      
      // Calculate days remaining
      const msRemaining = notAfter.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

      // Public key info
      const pubKey = cert.publicKey as any;
      let pubKeyInfo = "Unknown";
      if (pubKey.n && pubKey.e) {
        pubKeyInfo = `RSA (${pubKey.n.bitLength()} bits)`;
      } else if (pubKey.curve) {
        pubKeyInfo = `ECC (${pubKey.curve.name})`;
      }

      setParsedCert({
        subject,
        issuer,
        serialNumber: cert.serialNumber,
        notBefore,
        notAfter,
        isExpired,
        isNotYetValid,
        daysRemaining,
        sans,
        pubKeyInfo,
        signatureAlgorithm: cert.siginfo?.algorithmOid || "Unknown"
      });
      setError(null);
    } catch (e: any) {
      setParsedCert(null);
      setError("Failed to parse certificate. Ensure it is a valid PEM formatted X.509 certificate.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPemInput(e.target.value);
    parseCertificate(e.target.value);
  };

  const clear = () => {
    setPemInput("");
    setParsedCert(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="X.509 Certificate Analyzer"
      description="Parse and decode PEM certificates locally to view Subject, Issuer, Subject Alternative Names (SANs), and Validity periods."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
        
        {/* Input Column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="border border-[#1a1a1a] bg-[#050505] p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-4 flex items-center gap-2">
              <FileBadge className="w-4 h-4" /> PEM Certificate
            </h3>
            <textarea
              className="w-full flex-1 min-h-[300px] bg-black border border-[#1a1a1a] p-4 text-zinc-300 font-mono text-xs focus:border-[#00ff9c] focus:outline-none transition-colors resize-none custom-scrollbar"
              placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDdTCCAl2gAwIBAgILBAAAAAABRE7wQjANBgkqhkiG9w0BAQsFADBL&#10;...&#10;-----END CERTIFICATE-----"
              value={pemInput}
              onChange={handleInputChange}
            ></textarea>
            
            <div className="flex justify-end mt-4">
               <Button onClick={clear} variant="outline" className="border-[#1a1a1a] hover:bg-[#1a1a1a] text-zinc-400">
                 Clear
               </Button>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          <div className="border border-[#1a1a1a] bg-[#050505] p-6 min-h-full">
            {error && (
              <div className="p-4 border bg-red-500/10 border-red-500/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-500 font-medium text-sm">Parsing Error</p>
                  <p className="text-red-400/70 text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {!parsedCert && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-zinc-500">
                <FileBadge className="w-12 h-12 mb-4 opacity-20" />
                <p>Paste a PEM certificate on the left to analyze it.</p>
              </div>
            )}

            {parsedCert && (
              <div className="space-y-6">
                
                {/* Validity Status Alert */}
                <div className={`p-4 border flex items-center gap-3 ${parsedCert.isExpired ? 'bg-red-500/10 border-red-500/30 text-red-500' : (parsedCert.isNotYetValid ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-[#00ff9c]/10 border-[#00ff9c]/30 text-[#00ff9c]')}`}>
                  {parsedCert.isExpired ? (
                     <ShieldAlert className="w-6 h-6 shrink-0" />
                  ) : (
                     <ShieldCheck className="w-6 h-6 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">
                      {parsedCert.isExpired ? 'Certificate Expired' : (parsedCert.isNotYetValid ? 'Certificate Not Yet Valid' : 'Certificate is Valid')}
                    </p>
                    {!parsedCert.isExpired && !parsedCert.isNotYetValid && (
                      <p className="text-sm opacity-80">Expires in {parsedCert.daysRemaining} days</p>
                    )}
                  </div>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Subject */}
                  <div className="border border-[#1a1a1a] bg-black p-4 space-y-3">
                    <div className="flex items-center gap-2 text-zinc-500 pb-2 border-b border-[#1a1a1a]">
                      <Server className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest font-bold">Subject (Issued To)</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(parsedCert.subject).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                           <span className="text-[10px] text-zinc-500">{k}</span>
                           <span className="text-sm font-mono text-[#00ff9c] break-all">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issuer */}
                  <div className="border border-[#1a1a1a] bg-black p-4 space-y-3">
                    <div className="flex items-center gap-2 text-zinc-500 pb-2 border-b border-[#1a1a1a]">
                      <FileBadge className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest font-bold">Issuer (Issued By)</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(parsedCert.issuer).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                           <span className="text-[10px] text-zinc-500">{k}</span>
                           <span className="text-sm font-mono text-zinc-300 break-all">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="border border-[#1a1a1a] bg-black p-4 space-y-3 md:col-span-2">
                    <div className="flex items-center gap-2 text-zinc-500 pb-2 border-b border-[#1a1a1a]">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest font-bold">Validity Period</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <span className="text-[10px] text-zinc-500 block mb-1">Not Before (Issue Date)</span>
                         <span className="text-sm font-mono text-zinc-300">{parsedCert.notBefore.toUTCString()}</span>
                       </div>
                       <div>
                         <span className="text-[10px] text-zinc-500 block mb-1">Not After (Expiry Date)</span>
                         <span className={`text-sm font-mono ${parsedCert.isExpired ? 'text-red-500' : 'text-[#00ff9c]'}`}>{parsedCert.notAfter.toUTCString()}</span>
                       </div>
                    </div>
                  </div>

                  {/* Key & Security */}
                  <div className="border border-[#1a1a1a] bg-black p-4 space-y-3 md:col-span-2">
                    <div className="flex items-center gap-2 text-zinc-500 pb-2 border-b border-[#1a1a1a]">
                      <Key className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest font-bold">Public Key & Signature</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                         <span className="text-[10px] text-zinc-500 block mb-1">Public Key</span>
                         <span className="text-sm font-mono text-zinc-300">{parsedCert.pubKeyInfo}</span>
                       </div>
                       <div>
                         <span className="text-[10px] text-zinc-500 block mb-1">Signature Algorithm</span>
                         <span className="text-sm font-mono text-zinc-300">{parsedCert.signatureAlgorithm}</span>
                       </div>
                       <div>
                         <span className="text-[10px] text-zinc-500 block mb-1">Serial Number</span>
                         <span className="text-sm font-mono text-zinc-400 break-all">{parsedCert.serialNumber}</span>
                       </div>
                    </div>
                  </div>

                  {/* SANs */}
                  {parsedCert.sans && parsedCert.sans.length > 0 && (
                    <div className="border border-[#1a1a1a] bg-black p-4 space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 text-zinc-500 pb-2 border-b border-[#1a1a1a]">
                        <Info className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest font-bold">Subject Alternative Names (SANs)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsedCert.sans.map((san: string, idx: number) => (
                          <span key={idx} className="bg-[#1a1a1a] text-zinc-300 px-2 py-1 text-xs font-mono rounded">
                            {san}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
