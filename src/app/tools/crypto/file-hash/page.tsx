"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, UploadCloud, File as FileIcon, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Suspense, useState, useRef, useMemo } from "react";
import CryptoJS from "crypto-js";

type HashResults = {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
};

function FileHashContent() {
  const [file, setFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [results, setResults] = useState<HashResults | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetHash, setTargetHash] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (selected: File) => {
    setFile(selected);
    setResults(null);
    setTargetHash(""); // Reset target hash when new file is selected
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const bufferToHex = (buffer: ArrayBuffer) => {
    const view = new Uint8Array(buffer);
    let hex = "";
    for (let i = 0; i < view.length; i++) {
      hex += view[i].toString(16).padStart(2, "0");
    }
    return hex;
  };

  const startHashing = async () => {
    if (!file) return;
    setIsHashing(true);
    
    try {
      // Use native Web Crypto API for SHA hashes (blazing fast)
      // Note: for very large files (>2GB), loading the entire ArrayBuffer might crash the tab,
      // but modern browsers easily handle 1GB+ ArrayBuffers instantly.
      const buffer = await file.arrayBuffer();
      
      const [sha1Buf, sha256Buf, sha512Buf] = await Promise.all([
        crypto.subtle.digest("SHA-1", buffer),
        crypto.subtle.digest("SHA-256", buffer),
        crypto.subtle.digest("SHA-512", buffer)
      ]);

      // WebCrypto does not support MD5 natively. We use CryptoJS for MD5.
      // We convert the ArrayBuffer to CryptoJS WordArray directly.
      const md5Hex = (() => {
        // Very fast ArrayBuffer to WordArray conversion
        const ui8a = new Uint8Array(buffer);
        const words = [];
        for (let i = 0; i < ui8a.length; i += 4) {
          words.push((ui8a[i] << 24) | (ui8a[i + 1] << 16) | (ui8a[i + 2] << 8) | (ui8a[i + 3]));
        }
        const wordArr = CryptoJS.lib.WordArray.create(words, ui8a.length);
        return CryptoJS.MD5(wordArr).toString(CryptoJS.enc.Hex);
      })();

      setResults({
        md5: md5Hex,
        sha1: bufferToHex(sha1Buf),
        sha256: bufferToHex(sha256Buf),
        sha512: bufferToHex(sha512Buf),
      });
    } catch (err) {
      console.error("Hashing failed", err);
      alert("Error processing file. File might be too large for browser RAM (usually >1GB limits).");
    } finally {
      setIsHashing(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const matchStatus = useMemo(() => {
    if (!targetHash || !results) return null;
    const th = targetHash.trim().toLowerCase();
    if (th === results.md5) return "md5";
    if (th === results.sha1) return "sha1";
    if (th === results.sha256) return "sha256";
    if (th === results.sha512) return "sha512";
    return "none";
  }, [targetHash, results]);

  return (
    <ToolLayout 
      title="File Hash Analyzer & Comparator" 
      description="Verify file integrity instantly using native Web Crypto API. Compare ISOs or executables against a known hash. 100% offline."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload & Compare Section */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col space-y-4">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Select & Compare</span>
            </div>
            {file && (
              <Button variant="ghost" size="sm" onClick={reset} className="h-6 text-xs text-zinc-500 hover:text-red-400">
                Clear
              </Button>
            )}
          </header>
          
          <div className="px-6 flex-1 flex flex-col justify-start">
            {!file ? (
              <div 
                className={`border-2 border-dashed ${isDragging ? 'border-[#00ff9c] bg-[#00ff9c]/10' : 'border-[#1a1a1a] bg-black'} p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#00ff9c]/50 hover:bg-[#00ff9c]/5 transition-all mt-4`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <UploadCloud className={`w-12 h-12 ${isDragging ? 'text-[#00ff9c]' : 'text-zinc-600'}`} />
                <div className="text-center pointer-events-none">
                  <p className="text-sm font-mono text-zinc-300">Click to browse or drag a file here</p>
                  <p className="text-xs font-mono text-zinc-600 mt-1">Accelerated via Native Web Crypto</p>
                </div>
              </div>
            ) : (
              <div className="border border-[#1a1a1a] bg-black p-6 flex flex-col items-center justify-center gap-4 relative mt-4">
                <FileIcon className={`w-12 h-12 ${isHashing ? 'text-[#00ff9c] animate-pulse' : 'text-[#ffb000]'}`} />
                <div className="text-center">
                  <p className="text-sm font-mono text-zinc-200 break-all">{file.name}</p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">{formatSize(file.size)}</p>
                </div>
                
                {!results && !isHashing && (
                  <Button 
                    onClick={startHashing}
                    className="mt-4 bg-black border border-[#00ff9c] text-[#00ff9c] hover:bg-[#00ff9c] hover:text-black font-mono transition-colors"
                  >
                    Analyze File Hashes
                  </Button>
                )}
                
                {isHashing && (
                  <div className="mt-4 flex items-center gap-2 text-[#00ff9c] font-mono text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Computing Native Hashes...</span>
                  </div>
                )}
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />

            <div className="mt-8 space-y-2">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Compare with Known Hash (Optional)</label>
              <Input
                placeholder="Paste expected MD5, SHA-1, SHA-256..."
                value={targetHash}
                onChange={(e) => setTargetHash(e.target.value)}
                className="font-mono text-xs bg-black border-[#1a1a1a] focus-visible:ring-[#00ff9c] text-zinc-300 rounded-none h-10"
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-zinc-500 mb-6">
              <ShieldCheck className="w-4 h-4 text-[#00ff9c]/70" />
              <span>100% Offline. Your files never leave your device.</span>
            </div>
          </div>
        </article>

        {/* Results Section */}
        <article className="border border-[#1a1a1a] bg-[#050505]">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-[#00ff9c] text-xs">[OUT]</span>
            <span className="text-[#00ff9c] text-sm font-semibold glow uppercase tracking-widest">Calculated Hashes</span>
          </header>
          <div className="p-6">
            {!results ? (
              <div className="h-full min-h-[250px] flex items-center justify-center border border-dashed border-[#1a1a1a] bg-black">
                <span className="text-zinc-600 font-mono text-sm">Awaiting file analysis...</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {targetHash && (
                  <div className={`p-4 border font-mono text-xs flex items-start gap-3 ${matchStatus !== 'none' ? 'bg-[#00ff9c]/10 border-[#00ff9c]/30 text-[#00ff9c]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {matchStatus !== 'none' ? (
                      <>
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-sm uppercase tracking-wider mb-1">Hash Verified!</strong>
                          The file matches the provided <span className="uppercase">{matchStatus}</span> hash. It is authentic and untampered.
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-sm uppercase tracking-wider mb-1">Hash Mismatch!</strong>
                          The calculated hashes DO NOT match your expected hash. The file may be corrupted, modified, or malicious.
                        </div>
                      </>
                    )}
                  </div>
                )}

                <HashRow label="MD5" value={results.md5} copied={copiedKey === 'md5'} onCopy={() => copyToClipboard(results.md5, 'md5')} matched={matchStatus === 'md5'} />
                <HashRow label="SHA-1" value={results.sha1} copied={copiedKey === 'sha1'} onCopy={() => copyToClipboard(results.sha1, 'sha1')} matched={matchStatus === 'sha1'} />
                <HashRow label="SHA-256" value={results.sha256} copied={copiedKey === 'sha256'} onCopy={() => copyToClipboard(results.sha256, 'sha256')} matched={matchStatus === 'sha256'} />
                <HashRow label="SHA-512" value={results.sha512} copied={copiedKey === 'sha512'} onCopy={() => copyToClipboard(results.sha512, 'sha512')} matched={matchStatus === 'sha512'} />
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}

function HashRow({ label, value, copied, onCopy, matched }: { label: string, value: string, copied: boolean, onCopy: () => void, matched?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className={`text-[10px] font-mono uppercase tracking-widest ${matched ? 'text-[#00ff9c] font-bold' : 'text-zinc-500'}`}>
          {label} {matched && "(MATCH)"}
        </label>
      </div>
      <div className={`flex bg-black border p-1 items-center group relative overflow-hidden transition-colors ${matched ? 'border-[#00ff9c]' : 'border-[#1a1a1a]'}`}>
        <Input 
          readOnly 
          value={value}
          className={`font-mono text-xs bg-transparent border-none pr-10 ${matched ? 'text-[#00ff9c]' : 'text-zinc-300'}`}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCopy} 
          className="absolute right-1 top-1 h-7 w-7 text-zinc-500 hover:text-zinc-200 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="w-4 h-4 text-[#00ff9c]" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function FileHashAnalyzer() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono glow-amber">Initializing...</div>}>
      <FileHashContent />
    </Suspense>
  );
}
