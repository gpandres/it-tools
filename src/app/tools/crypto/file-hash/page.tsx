"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, UploadCloud, File as FileIcon, Loader2, ShieldCheck } from "lucide-react";
import { Suspense, useState, useRef } from "react";
import CryptoJS from "crypto-js";

type HashResults = {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
};

const CHUNK_SIZE = 1024 * 1024 * 10; // 10MB chunks for progressive hashing

function FileHashContent() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isHashing, setIsHashing] = useState(false);
  const [results, setResults] = useState<HashResults | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResults(null);
    setProgress(0);
  };

  const startHashing = async () => {
    if (!file) return;
    setIsHashing(true);
    setProgress(0);
    
    // Create incremental hashers
    const md5 = CryptoJS.algo.MD5.create();
    const sha1 = CryptoJS.algo.SHA1.create();
    const sha256 = CryptoJS.algo.SHA256.create();
    const sha512 = CryptoJS.algo.SHA512.create();

    let offset = 0;

    const readChunk = (start: number): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        const slice = file.slice(start, start + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
      });
    };

    try {
      while (offset < file.size) {
        const chunk = await readChunk(offset);
        
        // Convert ArrayBuffer to CryptoJS WordArray
        // We use typed array for performance
        const ui8a = new Uint8Array(chunk);
        const words = [];
        for (let i = 0; i < ui8a.length; i += 4) {
          words.push((ui8a[i] << 24) | (ui8a[i + 1] << 16) | (ui8a[i + 2] << 8) | (ui8a[i + 3]));
        }
        const wordArr = CryptoJS.lib.WordArray.create(words, ui8a.length);
        
        md5.update(wordArr);
        sha1.update(wordArr);
        sha256.update(wordArr);
        sha512.update(wordArr);
        
        offset += chunk.byteLength;
        setProgress(Math.round((offset / file.size) * 100));
        
        // Yield to main thread so UI updates
        await new Promise(r => setTimeout(r, 0));
      }

      setResults({
        md5: md5.finalize().toString(CryptoJS.enc.Hex),
        sha1: sha1.finalize().toString(CryptoJS.enc.Hex),
        sha256: sha256.finalize().toString(CryptoJS.enc.Hex),
        sha512: sha512.finalize().toString(CryptoJS.enc.Hex),
      });
    } catch (err) {
      console.error("Hashing failed", err);
      alert("Error processing file.");
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

  return (
    <ToolLayout 
      title="File Hash Analyzer" 
      description="Verify file integrity with MD5, SHA-1, SHA-256, and SHA-512. Processed incrementally in your browser without uploading."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload Section */}
        <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[IN]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Select File</span>
            </div>
            {file && (
              <Button variant="ghost" size="sm" onClick={reset} className="h-6 text-xs text-zinc-500 hover:text-red-400">
                Clear
              </Button>
            )}
          </header>
          <div className="p-6 flex-1 flex flex-col justify-center">
            
            {!file ? (
              <div 
                className="border-2 border-dashed border-[#1a1a1a] bg-black p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#00ff9c]/50 hover:bg-[#00ff9c]/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-12 h-12 text-zinc-600" />
                <div className="text-center">
                  <p className="text-sm font-mono text-zinc-300">Click to browse or drag a file here</p>
                  <p className="text-xs font-mono text-zinc-600 mt-1">Supports progressive hashing for large files</p>
                </div>
              </div>
            ) : (
              <div className="border border-[#1a1a1a] bg-black p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                {isHashing && (
                  <div className="absolute top-0 left-0 h-1 bg-[#00ff9c] transition-all duration-300 ease-linear shadow-[0_0_10px_#00ff9c]" style={{ width: `${progress}%` }} />
                )}
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
                    <span>Processing... {progress}%</span>
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

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-zinc-500">
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
                <HashRow label="MD5" value={results.md5} copied={copiedKey === 'md5'} onCopy={() => copyToClipboard(results.md5, 'md5')} />
                <HashRow label="SHA-1" value={results.sha1} copied={copiedKey === 'sha1'} onCopy={() => copyToClipboard(results.sha1, 'sha1')} />
                <HashRow label="SHA-256" value={results.sha256} copied={copiedKey === 'sha256'} onCopy={() => copyToClipboard(results.sha256, 'sha256')} />
                <HashRow label="SHA-512" value={results.sha512} copied={copiedKey === 'sha512'} onCopy={() => copyToClipboard(results.sha512, 'sha512')} />
              </div>
            )}
          </div>
        </article>
      </div>
    </ToolLayout>
  );
}

function HashRow({ label, value, copied, onCopy }: { label: string, value: string, copied: boolean, onCopy: () => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</label>
      </div>
      <div className="flex bg-black border border-[#1a1a1a] p-1 items-center group relative overflow-hidden">
        <Input 
          readOnly 
          value={value}
          className="font-mono text-xs bg-transparent border-none text-zinc-300 pr-10"
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
