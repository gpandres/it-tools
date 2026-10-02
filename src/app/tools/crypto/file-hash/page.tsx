"use client";

import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolFileDropzone, ToolActionButton, ToolStatus, ToolEmptyState, ToolProgress } from "@/components/tool-design";
import { useNotification } from "@/components/notification-provider";

type HashResults = { md5: string; sha1: string; sha256: string; sha512: string };
const labels = { md5: "MD5", sha1: "SHA-1", sha256: "SHA-256", sha512: "SHA-512" };
const size = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(Math.max(1, bytes)) / Math.log(1024)));
  return (bytes / 1024 ** index).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + units[index];
};

export default function FileHashAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<HashResults | null>(null);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ bytes: 0, elapsed: 0, speed: 0, eta: 0 });
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const { notify } = useNotification();
  useEffect(() => () => { workerRef.current?.terminate(); workerRef.current = null; }, []);
  const stop = () => { workerRef.current?.terminate(); workerRef.current = null; setBusy(false); };
  const selectFile = (selected: File | null) => {
    stop();
    setFile(selected);
    setResults(null);
    setTarget("");
    setError("");
    setCancelled(false);
    setProgress(0);
    setStats({ bytes: 0, elapsed: 0, speed: 0, eta: 0 });
  };
  const start = () => {
    if (!file || workerRef.current) return;
    setError("");
    setResults(null);
    setCancelled(false);
    setBusy(true);
    setProgress(0);
    setStats({ bytes: 0, elapsed: 0, speed: 0, eta: 0 });
    const started = performance.now();
    let lastUpdate = started;
    try {
      const worker = new Worker(new URL("./hash.worker.ts", import.meta.url));
      workerRef.current = worker;
      const fail = (message: string) => {
        if (workerRef.current !== worker) return;
        stop();
        setError(message);
      };
      worker.onmessage = event => {
        if (workerRef.current !== worker) return;
        const data = event.data;
        const elapsed = Math.max(.001, (performance.now() - started) / 1000);
        if (data.type === "progress" && (performance.now() - lastUpdate >= 200 || data.bytesProcessed === file.size)) {
          const bytes = Math.min(file.size, data.bytesProcessed);
          const speed = bytes / elapsed;
          setStats({ bytes, elapsed, speed, eta: speed > 0 ? (file.size - bytes) / speed : 0 });
          setProgress(file.size ? bytes / file.size * 100 : 100);
          lastUpdate = performance.now();
        } else if (data.type === "complete") {
          setResults(data.hashes);
          setProgress(100);
          setStats({ bytes: file.size, elapsed, speed: file.size / elapsed, eta: 0 });
          stop();
        } else if (data.type === "error") fail(data.error || "Unable to read or hash this file.");
      };
      worker.onerror = event => { event.preventDefault(); fail("The hashing worker failed. Try the file again."); };
      worker.postMessage({ file, chunkSize: 16 * 1024 * 1024 });
    } catch {
      stop();
      setError("Unable to start file analysis in this browser. Please try again.");
    }
  };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); notify("Hash copied to clipboard"); }
    catch { notify("Could not copy. Select the hash and copy it manually.", "error"); }
  };
  const expected = target.trim().toLowerCase();
  const expectedError = expected && (!/^[a-f0-9]+$/.test(expected) || ![32, 40, 64, 128].includes(expected.length)) ? "Enter a hexadecimal MD5, SHA-1, SHA-256 or SHA-512 digest." : "";
  const match = results && expected && !expectedError ? (Object.keys(labels) as (keyof HashResults)[]).find(key => results[key] === expected) : undefined;

  return <ToolLayout title="File Hash Analyzer & Comparator" description="Calculate MD5, SHA-1, SHA-256 and SHA-512 locally, reading the file in chunks. Your file is not uploaded.">
    <div className="mx-auto grid w-full max-w-6xl min-w-0 items-start gap-6 lg:grid-cols-2">
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="IN">Select & compare</ToolPanelTitle>{file && <ToolActionButton onClick={() => { selectFile(null); setPickerKey(key => key + 1); }}>Clear file</ToolActionButton>}</ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          <ToolFileDropzone key={pickerKey} label="File to hash" acceptedFormats="Any file type · 16 MiB processing chunks" browseLabel={file ? "Choose another file" : "Choose file"} onFiles={files => { if (files[0]) selectFile(files[0]); }} />
          {file && <div className="space-y-4">
            <p className="break-all text-xs text-zinc-300">{file.name} · {size(file.size)}</p>
            {busy ? <><ToolProgress label="Hashing file" value={progress} valueLabel={Math.round(progress) + "%"} /><p className="text-xs leading-relaxed text-zinc-400">{size(stats.bytes)} processed · {size(stats.speed)}/s · {stats.elapsed.toFixed(1)} s elapsed · {stats.eta.toFixed(1)} s remaining</p><ToolActionButton onClick={() => { stop(); setCancelled(true); }}>Cancel analysis</ToolActionButton></> : <ToolActionButton tone="accent" onClick={start}>{results ? "Analyze again" : "Analyze file hashes"}</ToolActionButton>}
          </div>}
          {error && <ToolStatus tone="error">{error}</ToolStatus>}
          {cancelled && <ToolStatus tone="neutral">Analysis cancelled. You can start again or choose another file.</ToolStatus>}
          <ToolField htmlFor="expected-hash" label="Expected hash (optional)">
            <Input id="expected-hash" value={target} onChange={event => setTarget(event.target.value)} placeholder="Paste a hexadecimal digest" spellCheck={false} className="w-full rounded-none border-[#1a1a1a] bg-black! text-zinc-300" aria-invalid={!!expectedError} aria-describedby={expectedError ? "expected-error" : undefined} />
            {expectedError && <p id="expected-error" className="text-xs text-red-400">{expectedError}</p>}
          </ToolField>
          <p className="text-xs leading-relaxed text-zinc-400">Large files take longer. You can cancel or replace the selected file while it is processing.</p>
        </ToolPanelBody>
      </ToolPanel>
      <ToolPanel>
        <ToolPanelHeader><ToolPanelTitle marker="OUT">Calculated hashes</ToolPanelTitle></ToolPanelHeader>
        <ToolPanelBody className="space-y-5">
          {!results ? <ToolEmptyState title={busy ? "Analysis in progress" : "No hashes yet"}>{busy ? "Results appear when all four digests are complete." : "Choose a file and start the analysis."}</ToolEmptyState> : <>
            {expected && !expectedError && <ToolStatus tone={match ? "success" : "error"} title={match ? labels[match] + " matches" : "Hash mismatch"}>{match ? "The calculated digest matches the supplied value. Trust depends on the source of that expected value." : "None of the calculated digests matches the expected value. Check the file, algorithm and reference digest."}</ToolStatus>}
            {(Object.keys(labels) as (keyof HashResults)[]).map(key => <div key={key} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-zinc-300">{labels[key]}{match === key ? " · MATCH" : ""}</h3><ToolActionButton aria-label={"Copy " + labels[key]} onClick={() => copy(results[key])}><Copy aria-hidden="true" /> Copy</ToolActionButton></div>
              <p className="break-all border border-[#1a1a1a] bg-black p-3 font-mono text-xs leading-relaxed text-zinc-300">{results[key]}</p>
            </div>)}
            <ToolStatus tone="neutral">A matching digest does not establish who published a file. MD5 and SHA-1 are legacy checksums; use SHA-256 or SHA-512 with a trusted reference for integrity checks.</ToolStatus>
          </>}
        </ToolPanelBody>
      </ToolPanel>
    </div>
  </ToolLayout>;
}
