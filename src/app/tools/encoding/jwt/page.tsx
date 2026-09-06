"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function base64UrlEncode(str: string) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/, '/');
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) throw new Error("Invalid Base64Url string");
      base64 += new Array(5 - pad).join('=');
    }
    
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return null;
  }
}

export default function JwtDecoder() {
  const [token, setToken] = useState("");
  const [headerInput, setHeaderInput] = useState("");
  const [payloadInput, setPayloadInput] = useState("");
  const [secret, setSecret] = useState("");
  const [sigMode, setSigMode] = useState<"verify" | "sign">("verify");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const originalSignatureRef = useRef<string>("");

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  let headerRaw = "";
  let payloadRaw = "";
  let signatureRaw = "";
  let isValidFormat = false;

  const parts = token.trim().split(".");
  if (parts.length === 3) {
    isValidFormat = true;
    headerRaw = parts[0];
    payloadRaw = parts[1];
    signatureRaw = parts[2];
  }

  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    setSecret(""); 
    setIsVerified(null);
    
    const newParts = newToken.trim().split(".");
    
    if (newParts.length === 3) {
      originalSignatureRef.current = newParts[2];
      const decodedHeader = base64UrlDecode(newParts[0]);
      const decodedPayload = base64UrlDecode(newParts[1]);

      try {
        setHeaderInput(decodedHeader ? JSON.stringify(JSON.parse(decodedHeader), null, 2) : "");
      } catch {
        setHeaderInput(decodedHeader || "");
      }

      try {
        setPayloadInput(decodedPayload ? JSON.stringify(JSON.parse(decodedPayload), null, 2) : "");
      } catch {
        setPayloadInput(decodedPayload || "");
      }
    } else {
      setHeaderInput("");
      setPayloadInput("");
      originalSignatureRef.current = "";
    }
  };

  const rebuildToken = async (hInput: string, pInput: string, sec: string, mode: "verify" | "sign") => {
    let newHeader = "";
    let newPayload = "";

    try {
      newHeader = base64UrlEncode(JSON.stringify(JSON.parse(hInput)));
    } catch {
      newHeader = base64UrlEncode(hInput);
    }

    try {
      newPayload = base64UrlEncode(JSON.stringify(JSON.parse(pInput)));
    } catch {
      newPayload = base64UrlEncode(pInput);
    }

    const dataToSign = `${newHeader || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"}.${newPayload || "e30"}`;
    let computedSig = "";

    if (sec) {
      try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(sec);
        const cryptoKey = await crypto.subtle.importKey(
          "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToSign));
        const signatureBytes = new Uint8Array(signatureBuffer);
        
        let binary = '';
        for (let i = 0; i < signatureBytes.byteLength; i++) {
            binary += String.fromCharCode(signatureBytes[i]);
        }
        computedSig = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      } catch (e) {
        console.error("Signing failed", e);
      }
    }

    if (mode === "sign") {
      setToken(`${dataToSign}.${computedSig || originalSignatureRef.current}`);
      setIsVerified(null);
    } else {
      setToken(`${dataToSign}.${originalSignatureRef.current}`);
      if (sec) {
        setIsVerified(computedSig === originalSignatureRef.current);
      } else {
        setIsVerified(null);
      }
    }
  };

  const handlePartChange = (type: "header" | "payload" | "secret", value: string) => {
    let nextH = headerInput;
    let nextP = payloadInput;
    let nextS = secret;

    if (type === "header") {
      setHeaderInput(value);
      nextH = value;
    }
    if (type === "payload") {
      setPayloadInput(value);
      nextP = value;
    }
    if (type === "secret") {
      setSecret(value);
      nextS = value;
    }

    rebuildToken(nextH, nextP, nextS, sigMode);
  };

  const toggleMode = (newMode: "verify" | "sign") => {
    setSigMode(newMode);
    rebuildToken(headerInput, payloadInput, secret, newMode);
  };

  return (
    <ToolLayout 
      title="JWT Decoder / Encoder" 
      description="Decode and edit JSON Web Tokens locally. Verify signatures or sign your own payload."
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col xl:h-[calc(100vh-200px)]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN/OUT]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Encoded JWT</span>
            </div>
            <div className="flex items-center gap-2">
              {token && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors border border-transparent hover:border-[#00ff9c]/30"
                  onClick={() => copy(token, "token")}
                >
                  {copiedKey === "token" ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                </Button>
              )}
              {token && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  onClick={() => handleTokenChange("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </header>
          <div className="p-4 flex-1 flex flex-col">
            <Label htmlFor="jwt-input" className="sr-only">JWT String</Label>
            <Textarea
              id="jwt-input"
              placeholder="Paste a JWT here (ey...)"
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              className={`w-full flex-1 min-h-[200px] font-mono text-sm bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] resize-none break-all ${
                token && !isValidFormat ? "text-red-400 border-red-500 focus-visible:ring-red-500" : "text-zinc-300"
              }`}
              spellCheck={false}
            />
            {token && !isValidFormat && (
              <div className="mt-2 text-red-500 font-mono text-xs">
                [ERR] Invalid JWT format. Expected 3 base64url encoded parts separated by dots.
              </div>
            )}
          </div>
        </article>

        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col xl:h-[calc(100vh-200px)]">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[IN/OUT]</span>
            <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center gap-2 uppercase tracking-widest">
              Decoded / Editable Data <span className="cursor-blink">_</span>
            </span>
          </header>
          <div className="p-0 overflow-y-auto flex-1 custom-scrollbar flex flex-col">
            {!token || !isValidFormat ? (
              <div className="p-6 text-zinc-600 font-mono text-sm">
                [WAITING] Awaiting valid token...
              </div>
            ) : (
              <div className="flex-1 flex flex-col divide-y divide-[#1a1a1a]">
                {/* Header */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a]">
                    <span className="font-mono text-xs text-red-400 uppercase tracking-widest">Header</span>
                  </div>
                  <Textarea 
                    value={headerInput}
                    onChange={(e) => handlePartChange("header", e.target.value)}
                    className="p-4 text-xs font-mono text-red-300 bg-black min-h-[120px] rounded-none border-none focus-visible:ring-1 focus-visible:ring-red-500/50 resize-y"
                    spellCheck={false}
                  />
                </div>

                {/* Payload */}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a]">
                    <span className="font-mono text-xs text-purple-400 uppercase tracking-widest">Payload</span>
                  </div>
                  <Textarea 
                    value={payloadInput}
                    onChange={(e) => handlePartChange("payload", e.target.value)}
                    className="p-4 text-xs font-mono text-purple-300 bg-black min-h-[200px] flex-1 rounded-none border-none focus-visible:ring-1 focus-visible:ring-purple-500/50 resize-none"
                    spellCheck={false}
                  />
                  {(() => {
                    let obj = null;
                    try { obj = JSON.parse(payloadInput); } catch {}
                    if (!obj) return null;

                    const claims = [];
                    if (typeof obj.iat === "number") claims.push({ key: "iat", label: "Issued At", val: obj.iat });
                    if (typeof obj.exp === "number") claims.push({ key: "exp", label: "Expires", val: obj.exp });
                    if (typeof obj.nbf === "number") claims.push({ key: "nbf", label: "Not Before", val: obj.nbf });

                    if (claims.length === 0) return null;

                    return (
                      <div className="flex flex-wrap items-center gap-6 px-4 py-2 bg-[#050505] border-t border-[#1a1a1a] text-[10px] font-mono text-zinc-500">
                        {claims.map(c => {
                          const d = new Date(c.val * 1000);
                          const isExpired = c.key === "exp" && d.getTime() < Date.now();
                          return (
                            <div key={c.key} className="flex items-center gap-2">
                              <span className="text-purple-500/70">{c.key}:</span>
                              <span className="text-zinc-400">{d.toLocaleString()}</span>
                              {isExpired && <span className="text-red-500 font-bold ml-1">(Expired)</span>}
                              {c.key === "exp" && !isExpired && <span className="text-[#00ff9c] font-bold ml-1">(Valid)</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Signature */}
                <div className="flex flex-col border-t border-[#1a1a1a]">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a]">
                    <span className="font-mono text-xs text-blue-400 uppercase tracking-widest">Signature</span>
                    <div className="flex items-center gap-4">
                      {sigMode === "verify" && secret && isVerified !== null && (
                        isVerified ? (
                          <span className="text-[#00ff9c] font-mono text-[10px] uppercase tracking-widest flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-red-500 font-mono text-[10px] uppercase tracking-widest flex items-center">
                            <X className="w-3 h-3 mr-1" /> Invalid
                          </span>
                        )
                      )}
                      {sigMode === "sign" && secret && (
                        <span className="text-[#00ff9c] font-mono text-[10px] uppercase tracking-widest flex items-center">
                          <Check className="w-3 h-3 mr-1" /> Re-signed
                        </span>
                      )}
                      
                      <div className="flex items-center bg-black border border-[#1a1a1a]">
                        <button 
                          onClick={() => toggleMode("verify")}
                          className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${sigMode === "verify" ? "text-blue-400 bg-blue-400/10" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                          Verify
                        </button>
                        <div className="w-px h-full bg-[#1a1a1a]" />
                        <button 
                          onClick={() => toggleMode("sign")}
                          className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${sigMode === "sign" ? "text-blue-400 bg-blue-400/10" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                          Sign
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-black flex flex-col justify-center min-h-[100px]">
                    <div className="space-y-2">
                      <Label className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Secret Key</Label>
                      <Input 
                        type="text"
                        placeholder="your-256-bit-secret"
                        value={secret}
                        onChange={(e) => handlePartChange("secret", e.target.value)}
                        className="font-mono text-sm bg-[#050505] border-[#1a1a1a] text-blue-300 rounded-none focus-visible:ring-blue-500/50 placeholder:text-blue-900/50 h-10"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}
