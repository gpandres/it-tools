"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Upload, Trash2, Camera, MapPin, Calendar, Smartphone, Download, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import exifr from "exifr";

export default function ExifAnalyzer() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    url: string;
    file: File;
  } | null>(null);
  
  const [exifData, setExifData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scrubStatus, setScrubStatus] = useState<"idle" | "scrubbing" | "done">("idle");
  const [cleanFileUrl, setCleanFileUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPEG, PNG, WEBP, etc).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    
    setFileInfo({
      name: file.name,
      size: file.size,
      url: objectUrl,
      file: file
    });

    setIsAnalyzing(true);
    setScrubStatus("idle");
    setCleanFileUrl(null);
    
    try {
      // exifr parses the image and returns all tags
      const parsed = await exifr.parse(file, true); // true = extract all available blocks (EXIF, IPTC, XMP, GPS)
      if (parsed) {
        setExifData(parsed);
      } else {
        setExifData({});
      }
    } catch (e) {
      console.error("EXIF Parsing Error", e);
      setExifData({});
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrubMetadata = async () => {
    if (!fileInfo) return;
    
    setScrubStatus("scrubbing");

    // The most robust browser-native way to scrub metadata is to render the image to a canvas
    // and then export it back to a Blob. The browser's native encoder strips EXIF/XMP/IPTC entirely.
    const img = new Image();
    img.src = fileInfo.url;
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        alert("Canvas not supported in this browser.");
        setScrubStatus("idle");
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Keep original format if possible, default to jpeg
      const type = fileInfo.file.type === "image/png" ? "image/png" : "image/jpeg";
      
      canvas.toBlob((blob) => {
        if (blob) {
          const cleanUrl = URL.createObjectURL(blob);
          setCleanFileUrl(cleanUrl);
          setScrubStatus("done");
        } else {
          alert("Error exporting clean image.");
          setScrubStatus("idle");
        }
      }, type, 1.0);
    };
    
    img.onerror = () => {
      alert("Failed to process image for scrubbing.");
      setScrubStatus("idle");
    };
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
    if (fileInfo?.url) URL.revokeObjectURL(fileInfo.url);
    if (cleanFileUrl) URL.revokeObjectURL(cleanFileUrl);
    setFileInfo(null);
    setExifData(null);
    setCleanFileUrl(null);
    setScrubStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert decimal degrees to DMS for display
  const formatGPS = (lat?: number, lng?: number) => {
    if (lat === undefined || lng === undefined) return "No GPS Data";
    return `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(5)}° ${lng >= 0 ? 'E' : 'W'}`;
  };

  return (
    <ToolLayout
      title="EXIF Analyzer & Cleaner"
      description="Extract hidden metadata (GPS, camera info, dates) from images, or permanently scrub it to protect your privacy before sharing."
    >
      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        
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
              accept="image/*"
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-[#00ff9c]/10 text-[#00ff9c]' : 'bg-[#1a1a1a] text-zinc-400 group-hover:text-zinc-300'}`}>
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-zinc-200 font-medium text-lg">Click or drag an image here</p>
                <p className="text-zinc-500 text-sm mt-1">Files are analyzed and scrubbed entirely in your browser.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header & Preview */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Preview Box */}
              <div className="w-full md:w-64 shrink-0 bg-[#050505] border border-[#1a1a1a] p-2 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileInfo.url} alt="Preview" className="max-h-48 object-contain" />
              </div>

              {/* Status and Actions */}
              <div className="flex-1 flex flex-col justify-between border border-[#1a1a1a] bg-[#050505] p-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-200 truncate">{fileInfo.name}</h3>
                  <p className="text-zinc-500 font-mono text-sm mt-1">{formatSize(fileInfo.size)}</p>
                  
                  {isAnalyzing ? (
                    <p className="text-[#00ff9c] mt-4 font-mono text-sm animate-pulse">Analyzing EXIF data...</p>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <span className={`px-2 py-1 text-xs font-mono rounded ${exifData && Object.keys(exifData).length > 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30'}`}>
                        {exifData && Object.keys(exifData).length > 0 ? `${Object.keys(exifData).length} Tags Found` : 'No Metadata Found'}
                      </span>
                      {exifData?.latitude && (
                        <span className="px-2 py-1 text-xs font-mono rounded bg-red-500/20 text-red-500 border border-red-500/30 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> GPS Detected
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  {scrubStatus === "idle" && exifData && Object.keys(exifData).length > 0 && (
                    <Button onClick={scrubMetadata} className="bg-amber-500 hover:bg-amber-600 text-black">
                      <ShieldCheck className="w-4 h-4 mr-2" /> Scrub Metadata
                    </Button>
                  )}
                  {scrubStatus === "scrubbing" && (
                    <Button disabled className="bg-amber-500/50 text-black">
                      Scrubbing...
                    </Button>
                  )}
                  {scrubStatus === "done" && cleanFileUrl && (
                    <a href={cleanFileUrl} download={`clean_${fileInfo.name}`}>
                      <Button className="bg-[#00ff9c] hover:bg-[#00cc7d] text-black">
                        <Download className="w-4 h-4 mr-2" /> Download Clean Image
                      </Button>
                    </a>
                  )}
                  <Button onClick={reset} variant="outline" className="border-[#1a1a1a] hover:bg-[#1a1a1a]">
                    <Trash2 className="w-4 h-4 mr-2" /> Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Summary Grid */}
            {exifData && Object.keys(exifData).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#050505] border border-[#1a1a1a] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Camera className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-bold">Camera</span>
                  </div>
                  <span className="text-sm font-mono text-zinc-300 truncate" title={exifData.Model || "Unknown"}>
                    {exifData.Make ? `${exifData.Make} ${exifData.Model || ''}` : (exifData.Model || "Unknown")}
                  </span>
                </div>
                
                <div className="bg-[#050505] border border-[#1a1a1a] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-bold">Settings</span>
                  </div>
                  <span className="text-sm font-mono text-zinc-300 truncate">
                    {exifData.FNumber ? `f/${exifData.FNumber} ` : ""}
                    {exifData.ExposureTime ? `${typeof exifData.ExposureTime === 'number' && exifData.ExposureTime < 1 ? '1/' + Math.round(1/exifData.ExposureTime) : exifData.ExposureTime}s ` : ""}
                    {exifData.ISO ? `ISO${exifData.ISO}` : ""}
                    {!exifData.FNumber && !exifData.ExposureTime && !exifData.ISO && "Unknown"}
                  </span>
                </div>

                <div className="bg-[#050505] border border-[#1a1a1a] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-bold">Date Taken</span>
                  </div>
                  <span className="text-sm font-mono text-zinc-300 truncate">
                    {exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toLocaleString() : "Unknown"}
                  </span>
                </div>

                <div className={`border p-4 flex flex-col gap-2 ${exifData.latitude ? 'bg-red-500/5 border-red-500/20' : 'bg-[#050505] border-[#1a1a1a]'}`}>
                  <div className={`flex items-center gap-2 ${exifData.latitude ? 'text-red-500' : 'text-zinc-500'}`}>
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-bold">Location</span>
                  </div>
                  <span className={`text-sm font-mono truncate ${exifData.latitude ? 'text-red-400' : 'text-zinc-300'}`}>
                    {exifData.latitude ? formatGPS(exifData.latitude, exifData.longitude) : "No GPS"}
                  </span>
                </div>
              </div>
            )}

            {/* Raw Tags Dump */}
            {exifData && Object.keys(exifData).length > 0 && (
              <div className="bg-[#050505] border border-[#1a1a1a] overflow-hidden">
                <div className="p-4 border-b border-[#1a1a1a] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#00ff9c]" />
                  <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">All Extracted Tags</h4>
                </div>
                <div className="p-0 max-h-96 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-[#0a0a0a] sticky top-0 border-b border-[#1a1a1a]">
                      <tr>
                        <th className="p-3 text-zinc-500 font-normal w-1/3">Tag Name</th>
                        <th className="p-3 text-zinc-500 font-normal">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {Object.entries(exifData).map(([key, value], i) => {
                        // Skip raw array buffers / complex objects to avoid React errors
                        if (value instanceof Uint8Array || value instanceof ArrayBuffer) return null;
                        
                        let displayValue = "";
                        if (value === null || value === undefined) displayValue = "null";
                        else if (typeof value === 'object') {
                          if (value instanceof Date) displayValue = value.toISOString();
                          else displayValue = JSON.stringify(value);
                        } else {
                          displayValue = String(value);
                        }

                        return (
                          <tr key={i} className="hover:bg-[#1a1a1a]/50 transition-colors">
                            <td className="p-3 text-[#00ff9c] break-all">{key}</td>
                            <td className="p-3 text-zinc-300 break-all">{displayValue}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {exifData && Object.keys(exifData).length === 0 && (
              <div className="bg-[#050505] border border-[#1a1a1a] p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-[#00ff9c] mx-auto mb-4" />
                <h4 className="text-lg font-medium text-zinc-200">No Metadata Found</h4>
                <p className="text-zinc-500 mt-2">This image appears to be clean. No EXIF, GPS, or camera metadata was detected.</p>
              </div>
            )}

          </div>
        )}
      </div>
    </ToolLayout>
  );
}
