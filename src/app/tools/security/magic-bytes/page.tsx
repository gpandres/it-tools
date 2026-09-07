"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { FileSearch, Upload, ShieldAlert, CheckCircle2, FileWarning, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// A small subset of common magic numbers
// Magic bytes are usually represented as an array of hex strings
const MAGIC_NUMBERS = [
  { bytes: ["FF", "D8", "FF"], type: "JPEG Image", ext: "jpg, jpeg", mime: "image/jpeg" },
  { bytes: ["89", "50", "4E", "47", "0D", "0A", "1A", "0A"], type: "PNG Image", ext: "png", mime: "image/png" },
  { bytes: ["47", "49", "46", "38", "37", "61"], type: "GIF Image (87a)", ext: "gif", mime: "image/gif" },
  { bytes: ["47", "49", "46", "38", "39", "61"], type: "GIF Image (89a)", ext: "gif", mime: "image/gif" },
  { bytes: ["25", "50", "44", "46"], type: "PDF Document", ext: "pdf", mime: "application/pdf" },
  { bytes: ["50", "4B", "03", "04"], type: "ZIP Archive / DOCX / XLSX", ext: "zip, docx, xlsx, pptx", mime: "application/zip" },
  { bytes: ["52", "61", "72", "21", "1A", "07"], type: "RAR Archive", ext: "rar", mime: "application/x-rar-compressed" },
  { bytes: ["37", "7A", "BC", "AF", "27", "1C"], type: "7-Zip Archive", ext: "7z", mime: "application/x-7z-compressed" },
  { bytes: ["4D", "5A"], type: "Windows Executable (EXE/DLL)", ext: "exe, dll", mime: "application/x-msdownload" },
  { bytes: ["7F", "45", "4C", "46"], type: "Linux Executable (ELF)", ext: "elf, bin", mime: "application/x-executable" },
  { bytes: ["1F", "8B", "08"], type: "GZIP Archive", ext: "gz, tar.gz", mime: "application/gzip" },
  { bytes: ["4F", "67", "67", "53"], type: "Ogg Media", ext: "ogg, ogv, oga", mime: "audio/ogg" },
  { bytes: ["52", "49", "46", "46"], type: "RIFF Audio/Video (AVI/WAV/WebP)", ext: "avi, wav, webp", mime: "audio/wav" },
  { bytes: ["49", "44", "33"], type: "MP3 Audio (with ID3)", ext: "mp3", mime: "audio/mpeg" },
  { bytes: ["FF", "FB"], type: "MP3 Audio (without ID3)", ext: "mp3", mime: "audio/mpeg" },
  { bytes: ["FF", "F3"], type: "MP3 Audio (without ID3)", ext: "mp3", mime: "audio/mpeg" },
  { bytes: ["FF", "F2"], type: "MP3 Audio (without ID3)", ext: "mp3", mime: "audio/mpeg" },
  { bytes: ["42", "4D"], type: "BMP Image", ext: "bmp", mime: "image/bmp" },
  { bytes: ["D0", "CF", "11", "E0", "A1", "B1", "1A", "E1"], type: "Microsoft Office (Legacy)", ext: "doc, xls, ppt", mime: "application/msword" },
];

export default function MagicBytesDetector() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    extension: string;
    reportedMime: string;
  } | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<{
    hexSignature: string[];
    detectedType: string | null;
    detectedExts: string | null;
    detectedMime: string | null;
    isMismatch: boolean;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    // Basic file info
    const extMatch = file.name.match(/\.([^.]+)$/);
    const extension = extMatch ? extMatch[1].toLowerCase() : "unknown";
    
    setFileInfo({
      name: file.name,
      size: file.size,
      extension: extension,
      reportedMime: file.type || "unknown"
    });

    // Read first 32 bytes
    const slice = file.slice(0, 32);
    const buffer = await slice.arrayBuffer();
    const view = new Uint8Array(buffer);
    
    // Convert to uppercase Hex strings
    const hexArray = Array.from(view).map(b => b.toString(16).padStart(2, '0').toUpperCase());
    
    // Find matching signature
    let matchedType = null;
    let matchedExts = null;
    let matchedMime = null;

    for (const signature of MAGIC_NUMBERS) {
      // Check if the file's hex starts with the signature
      let isMatch = true;
      for (let i = 0; i < signature.bytes.length; i++) {
        if (hexArray[i] !== signature.bytes[i]) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        matchedType = signature.type;
        matchedExts = signature.ext;
        matchedMime = signature.mime;
        break; // Stop at first match
      }
    }

    // Determine mismatch
    let isMismatch = false;
    if (matchedExts && extension !== "unknown") {
      // Very basic mismatch check
      if (!matchedExts.includes(extension)) {
        isMismatch = true;
      }
    }

    setAnalysisResult({
      hexSignature: hexArray,
      detectedType: matchedType,
      detectedExts: matchedExts,
      detectedMime: matchedMime,
      isMismatch: isMismatch
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const reset = () => {
    setFileInfo(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ToolLayout
      title="File Magic Bytes Detector"
      description="Identify the true file type of any file by inspecting its hexadecimal signature. Detect extension spoofing and disguised malware."
    >
      <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto w-full">
        
        {/* Input Area */}
        {!fileInfo ? (
          <div 
            className={`border-2 border-dashed p-12 text-center transition-colors cursor-pointer group
              ${isDragging ? 'border-[#00ff9c] bg-[#00ff9c]/5' : 'border-[#1a1a1a] bg-[#050505] hover:border-zinc-700'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-[#00ff9c]/10 text-[#00ff9c]' : 'bg-[#1a1a1a] text-zinc-400 group-hover:text-zinc-300'}`}>
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-zinc-200 font-medium text-lg">Click or drag a file here</p>
                <p className="text-zinc-500 text-sm mt-1">Files are processed entirely in your browser. No data is uploaded.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-[#050505] border border-[#1a1a1a] p-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileSearch className="w-5 h-5 text-[#00ff9c] shrink-0" />
                <div className="truncate">
                  <h3 className="text-zinc-200 font-medium truncate">{fileInfo.name}</h3>
                  <p className="text-zinc-500 text-xs font-mono">{formatSize(fileInfo.size)}</p>
                </div>
              </div>
              <Button onClick={reset} variant="outline" className="shrink-0 ml-4 border-[#1a1a1a] hover:bg-[#1a1a1a]">
                <Trash2 className="w-4 h-4 mr-2" /> Clear
              </Button>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Hex Signature Box */}
                <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-4">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">
                    Hex Signature (First 32 Bytes)
                  </h4>
                  <div className="font-mono text-sm grid grid-cols-8 gap-2 break-all text-zinc-400 p-4 bg-black border border-[#1a1a1a]">
                    {analysisResult.hexSignature.map((hex, i) => (
                      <span key={i} className={`text-center ${i < 4 ? 'text-[#00ff9c] font-bold' : ''}`}>
                        {hex}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Analysis Details */}
                <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-4">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1a1a1a] pb-2">
                    File Identity
                  </h4>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-mono">Apparent Extension</p>
                      <p className="text-zinc-200 font-mono text-lg">.{fileInfo.extension}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-mono">True File Type (Magic Bytes)</p>
                      {analysisResult.detectedType ? (
                        <p className="text-[#00ff9c] font-medium text-lg">{analysisResult.detectedType}</p>
                      ) : (
                        <p className="text-zinc-500 text-lg italic">Unknown / Unrecognized</p>
                      )}
                    </div>

                    {analysisResult.detectedType && (
                      <div className={`p-4 mt-6 border ${analysisResult.isMismatch ? 'bg-red-500/10 border-red-500/30' : 'bg-[#00ff9c]/5 border-[#00ff9c]/20'}`}>
                        {analysisResult.isMismatch ? (
                          <div className="flex items-start gap-3">
                            <FileWarning className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-500 font-medium text-sm">Extension Mismatch Detected!</p>
                              <p className="text-red-400/70 text-xs mt-1 leading-relaxed">
                                The file claims to be a <strong>.{fileInfo.extension}</strong>, but its binary signature indicates it is actually a <strong>{analysisResult.detectedType}</strong> ({analysisResult.detectedExts}). This technique is often used to disguise executable malware.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#00ff9c] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[#00ff9c] font-medium text-sm">Extension Matches Signature</p>
                              <p className="text-[#00ff9c]/70 text-xs mt-1 leading-relaxed">
                                The binary signature matches the reported file extension. No obvious extension spoofing detected.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!analysisResult.detectedType && (
                      <div className="p-4 mt-6 border bg-amber-500/10 border-amber-500/30 flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-500 font-medium text-sm">Signature Not in Database</p>
                          <p className="text-amber-500/70 text-xs mt-1 leading-relaxed">
                            The file signature does not match any common magic numbers in our offline database. It could be a custom format or a plain text file.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
