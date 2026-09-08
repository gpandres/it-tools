"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, UploadCloud, File as FileIcon, Loader2, ShieldCheck, AlertCircle, XCircle } from "lucide-react";
import { Suspense, useState, useRef, useMemo, useEffect } from "react";
import { useNotification } from "@/components/notification-provider";

type HashResults = {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
};

function FileHashContent() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isHashing, setIsHashing] = useState(false);
  const [results, setResults] = useState<HashResults | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetHash, setTargetHash] = useState("");
  
  const [stats, setStats] = useState({ bytesProcessed: 0, speed: 0, elapsed: 0, eta: 0 });
  const workerRef = useRef<Worker | null>(null);
  const { notify } = useNotification();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const reset = () => {
    if (isHashing) cancelHashing();
    setFile(null);
    setProgress(0);
    setResults(null);
    setStats({ bytesProcessed: 0, speed: 0, elapsed: 0, eta: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelHashing = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsHashing(false);
    setProgress(0);
    setStats({ bytesProcessed: 0, speed: 0, elapsed: 0, eta: 0 });
  };

  const handleFile = (selected: File) => {
    if (isHashing) cancelHashing();
    setFile(selected);
    setResults(null);
    setTargetHash(""); // Reset target hash when new file is selected
    setStats({ bytesProcessed: 0, speed: 0, elapsed: 0, eta: 0 });
    setProgress(0);
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

  const CHUNK_SIZE = 16 * 1024 * 1024; // 16 MiB

  const startHashing = async () => {
    if (!file) return;
    setIsHashing(true);
    setProgress(0);
    setStats({ bytesProcessed: 0, speed: 0, elapsed: 0, eta: 0 });
    setResults(null);
    
    const startTime = performance.now();
    let lastUpdate = startTime;

    workerRef.current = new Worker(new URL('./hash.worker.ts', import.meta.url));

    workerRef.current.onmessage = (e) => {
      const { type } = e.data;
      if (type === "progress") {
        const { bytesProcessed } = e.data;
        const now = performance.now();
        const elapsedMs = now - startTime;
        
        // Update stats roughly every 200ms
        if (now - lastUpdate > 200 || bytesProcessed === file.size) {
           const speed = bytesProcessed / (elapsedMs / 1000); // Bytes per sec
           const remaining = file.size - bytesProcessed;
           const eta = speed > 0 ? remaining / speed : 0;
           
           setStats({
             bytesProcessed,
             speed,
             elapsed: elapsedMs / 1000,
             eta
           });
           
           setProgress(Math.round((bytesProcessed / file.size) * 100));
           lastUpdate = now;
        }
      } else if (type === "complete") {
        setResults(e.data.hashes);
        setIsHashing(false);
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      } else if (type === "error") {
        console.error(e.data.error);
        notify(`Error hashing file: ${e.data.error}`, "error");
        setIsHashing(false);
      }
    };

    workerRef.current.onerror = (err) => {
      console.error("Worker error", err);
      notify("The hashing worker failed. Please try the file again.", "error");
      setIsHashing(false);
    };

    workerRef.current.postMessage({ file, chunkSize: CHUNK_SIZE });
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

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "-";
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
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
      description="Verify file integrity for massive files. Uses WebAssembly and Web Workers for real incremental hashing. 100% offline, zero memory leaks."
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
                  <p className="text-xs font-mono text-zinc-600 mt-1">Unlimited size. Streaming & WASM accelerated.</p>
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
                  <div className="mt-4 w-full max-w-sm space-y-4">
                    <div className="flex items-center justify-between font-mono text-xs text-[#00ff9c]">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Hashing in progress...
                      </span>
                      <span>{progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00ff9c] h-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                      <div>Processed: <span className="text-zinc-200">{formatSize(stats.bytesProcessed)} / {formatSize(file.size)}</span></div>
                      <div>Speed: <span className="text-[#00ff9c]">{formatSize(stats.speed)}/s</span></div>
                      <div>Elapsed: <span className="text-zinc-200">{formatTime(stats.elapsed)}</span></div>
                      <div>ETA: <span className="text-amber-400">{formatTime(stats.eta)}</span></div>
                    </div>

                    <Button 
                      onClick={cancelHashing}
                      variant="ghost"
                      className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 font-mono text-xs border border-red-500/30 h-8"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancel Analysis
                    </Button>
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
              <span>Processed locally in your browser. The file is not uploaded.</span>
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
                          <strong className="block text-sm uppercase tracking-wider mb-1">Hash Verified! (MATCH)</strong>
                          The file matches the provided <span className="uppercase font-bold glow-green">{matchStatus}</span> hash. It is authentic and untampered.
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
