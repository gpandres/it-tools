"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef } from "react";
import { Search, ShieldAlert, Cpu, Clock, Activity, ArrowLeftRight, ChevronLeft, ChevronRight, FileJson } from "lucide-react";
import { useNotification } from "@/components/notification-provider";
import { createEvidenceBundle } from "@/lib/evidence-bundle";
import { downloadTextFile, safeDownloadName } from "@/lib/browser-download";

interface ParsedPacket {
  id: number;
  tsSec: number;
  tsUsec: number;
  inclLen: number;
  origLen: number;
  srcMac: string;
  dstMac: string;
  etherType: number;
  srcIp: string;
  dstIp: string;
  protocol: number;
  protocolName: string;
  payloadOffset: number;
  raw: Uint8Array;
}

const MAX_PCAP_FILE_SIZE = 100 * 1024 * 1024;
const MAX_PACKET_COUNT = 50_000;
const MAX_PACKET_SIZE = 1024 * 1024;

export default function PcapViewer() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [packets, setPackets] = useState<ParsedPacket[]>([]);
  const [globalHeader, setGlobalHeader] = useState<{ magic: string, version: string, linkType: number } | null>(null);
  const [captureName, setCaptureName] = useState("capture.pcap");
  
  const [selectedPacketId, setSelectedPacketId] = useState<number | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  
  // New features state
  const [timeFormat, setTimeFormat] = useState<"unix" | "local">("unix");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 250;
  const { notify } = useNotification();

  const selectedPacket = useMemo(() => {
    if (selectedPacketId === null) return null;
    return packets.find(p => p.id === selectedPacketId) || null;
  }, [packets, selectedPacketId]);

  const filteredPackets = useMemo(() => {
    if (!filterQuery) return packets;
    const q = filterQuery.toLowerCase();
    return packets.filter(p => 
      String(p.id).includes(q) ||
      p.srcIp.includes(q) || 
      p.dstIp.includes(q) ||
      p.srcMac.includes(q) ||
      p.dstMac.includes(q) ||
      p.protocolName.toLowerCase().includes(q)
    );
  }, [packets, filterQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPackets.length / ITEMS_PER_PAGE);
  const paginatedPackets = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredPackets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPackets, page]);

  // Analytics
  const analytics = useMemo(() => {
    if (packets.length === 0) return null;
    
    const srcIps: Record<string, number> = {};
    const dstIps: Record<string, number> = {};
    const protos: Record<string, number> = {};
    
    for (const p of packets) {
      if (p.srcIp) srcIps[p.srcIp] = (srcIps[p.srcIp] || 0) + 1;
      if (p.dstIp) dstIps[p.dstIp] = (dstIps[p.dstIp] || 0) + 1;
      protos[p.protocolName] = (protos[p.protocolName] || 0) + 1;
    }
    
    const getTop = (dict: Record<string, number>, max = 5) => {
      return Object.entries(dict)
        .sort((a, b) => b[1] - a[1])
        .slice(0, max);
    };

    return {
      topSrcIps: getTop(srcIps),
      topDstIps: getTop(dstIps),
      topProtos: getTop(protos)
    };
  }, [packets]);

  const formatMac = (bytes: Uint8Array, offset: number) => {
    const mac = [];
    for (let i = 0; i < 6; i++) {
      mac.push(bytes[offset + i].toString(16).padStart(2, '0'));
    }
    return mac.join(':');
  };

  const formatIp = (bytes: Uint8Array, offset: number) => {
    return `${bytes[offset]}.${bytes[offset + 1]}.${bytes[offset + 2]}.${bytes[offset + 3]}`;
  };

  const getProtocolName = (proto: number) => {
    switch (proto) {
      case 1: return "ICMP";
      case 6: return "TCP";
      case 17: return "UDP";
      default: return `Proto-${proto}`;
    }
  };

  const parsePcap = (buffer: ArrayBuffer) => {
    try {
      setLoading(true);
      setErrorMsg("");
      
      // Delay to allow UI to render loading state
      setTimeout(() => {
        try {
          const view = new DataView(buffer);
          const bytes = new Uint8Array(buffer);
          
          if (buffer.byteLength < 24) throw new Error("File too small to be a PCAP");

          const magic = view.getUint32(0, false);
          let le = false; // little-endian
          
          if (magic === 0xa1b2c3d4 || magic === 0xa1b23c4d) {
            le = false;
          } else if (magic === 0xd4c3b2a1 || magic === 0x4d3cb2a1) {
            le = true;
          } else if (magic === 0x0a0d0d0a) {
            throw new Error("PCAPNG format detected. Only standard PCAP is supported.");
          } else {
            throw new Error(`Invalid PCAP Magic Number: 0x${magic.toString(16)}`);
          }

          const version = `${view.getUint16(4, le)}.${view.getUint16(6, le)}`;
          const linkType = view.getUint32(20, le);
          
          if (linkType !== 1) {
            console.warn("Only Ethernet (LinkType 1) is fully supported for deep parsing.");
          }

          let offset = 24;
          let packetCount = 0;
          const parsed: ParsedPacket[] = [];

          while (offset + 16 <= buffer.byteLength) {
            if (packetCount >= MAX_PACKET_COUNT) {
              setErrorMsg("Displaying first 50,000 packets to prevent out-of-memory errors.");
              break;
            }

            const tsSec = view.getUint32(offset, le);
            const tsUsec = view.getUint32(offset + 4, le);
            const inclLen = view.getUint32(offset + 8, le);
            const origLen = view.getUint32(offset + 12, le);

            offset += 16;
            
            // Safety check for corrupted packets and hostile capture sizes.
            if (inclLen > MAX_PACKET_SIZE || offset + inclLen > buffer.byteLength) {
              throw new Error("Truncated or invalid packet record in PCAP file.");
            }

            const rawPacket = bytes.slice(offset, offset + inclLen);
            
            let srcMac = "", dstMac = "", etherType = 0;
            let srcIp = "", dstIp = "", protocol = 0, protocolName = "Unknown";
            
            if (linkType === 1 && inclLen >= 14) {
              dstMac = formatMac(rawPacket, 0);
              srcMac = formatMac(rawPacket, 6);
              etherType = (rawPacket[12] << 8) | rawPacket[13];
              
              if (etherType === 0x0800 && inclLen >= 34) { // IPv4
                protocol = rawPacket[23];
                protocolName = getProtocolName(protocol);
                srcIp = formatIp(rawPacket, 26);
                dstIp = formatIp(rawPacket, 30);
              } else if (etherType === 0x0806) {
                protocolName = "ARP";
              } else if (etherType === 0x86dd) {
                protocolName = "IPv6";
              }
            }

            parsed.push({
              id: ++packetCount,
              tsSec,
              tsUsec,
              inclLen,
              origLen,
              srcMac,
              dstMac,
              etherType,
              srcIp,
              dstIp,
              protocol,
              protocolName,
              payloadOffset: 0,
              raw: rawPacket
            });

            offset += inclLen;
          }

          setGlobalHeader({
            magic: magic.toString(16),
            version,
            linkType
          });
          setPackets(parsed);
          setLoading(false);
          setPage(1);
        } catch (e: any) {
          setErrorMsg(e.message);
          setLoading(false);
          setPackets([]);
        }
      }, 50); // small delay
    } catch (e: any) {
      setErrorMsg(e.message);
      setLoading(false);
      setPackets([]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.size > MAX_PCAP_FILE_SIZE) {
      setErrorMsg("PCAP files are limited to 100 MB in the browser to protect memory.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pcap")) {
      setErrorMsg("Choose a standard .pcap file.");
      return;
    }
    setCaptureName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        parsePcap(e.target.result as ArrayBuffer);
      }
    };
    reader.onerror = () => {
      setLoading(false);
      setErrorMsg("Could not read the PCAP file.");
    };
    reader.readAsArrayBuffer(file);
  };

  const toHexDump = (buffer: Uint8Array) => {
    let hexString = "";
    let asciiString = "";
    let output = "";

    // Limit dump to 2000 bytes to avoid lag on huge packets
    const limit = Math.min(buffer.length, 2000);

    for (let i = 0; i < limit; i++) {
      if (i % 16 === 0) {
        if (i !== 0) output += `${hexString.padEnd(48, ' ')}  |${asciiString}|\n`;
        hexString = "";
        asciiString = "";
        output += `${i.toString(16).padStart(4, '0')}  `;
      }
      
      const byte = buffer[i];
      hexString += byte.toString(16).padStart(2, '0') + " ";
      asciiString += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ".";
    }

    if (hexString !== "") {
      output += `${hexString.padEnd(48, ' ')}  |${asciiString}|\n`;
    }

    if (buffer.length > limit) {
      output += `\n... [${buffer.length - limit} bytes truncated] ...`;
    }

    return output;
  };

  const formatTime = (tsSec: number, tsUsec: number) => {
    if (timeFormat === "unix") {
      return `${tsSec}.${tsUsec.toString().padStart(6, '0')}`;
    }
    const d = new Date(tsSec * 1000);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}.${tsUsec.toString().padStart(6, '0')}`;
  };

  const exportEvidenceBundle = () => {
    if (packets.length === 0) return;
    const seenIps = new Set<string>();
    const iocs = [...(analytics?.topSrcIps ?? []), ...(analytics?.topDstIps ?? [])]
      .map(([value]) => value)
      .filter(value => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) && !seenIps.has(value) && seenIps.add(value))
      .map(value => ({ type: "ip" as const, value, tag: "unknown" as const, notes: "Observed in PCAP traffic." }));
    const ordered = [...packets].sort((a, b) => a.tsSec - b.tsSec || a.tsUsec - b.tsUsec);
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const timeline: Array<{ timestamp: string; description: string; source: string }> = first ? [{
      timestamp: new Date(first.tsSec * 1000 + Math.floor(first.tsUsec / 1000)).toISOString(),
      description: `Capture contains ${packets.length.toLocaleString()} parsed packets.`,
      source: captureName
    }] : [];
    if (last && first && (last.tsSec !== first.tsSec || last.tsUsec !== first.tsUsec)) {
      timeline.push({
        timestamp: new Date(last.tsSec * 1000 + Math.floor(last.tsUsec / 1000)).toISOString(),
        description: `Last parsed packet observed (${last.protocolName}, ${last.origLen} bytes).`,
        source: captureName
      });
    }
    const bundle = createEvidenceBundle({
      source: "pcap",
      title: `PCAP analysis: ${captureName}`,
      description: "Network capture evidence exported locally for investigation.",
      iocs,
      timeline,
      findings: `## Capture Summary\n- Packets parsed: ${packets.length.toLocaleString()}\n- Protocols: ${analytics?.topProtos.map(([protocol, count]) => `${protocol} (${count})`).join(", ") || "Not available"}`,
      artifacts: [{
        name: "Capture metadata",
        detail: `${globalHeader ? `PCAP ${globalHeader.version}, link type ${globalHeader.linkType}` : "PCAP"}; ${iocs.length} top IPv4 indicators exported.`
      }]
    });
    downloadTextFile(JSON.stringify(bundle, null, 2), `${safeDownloadName(captureName.replace(/\.pcap$/i, ""), "capture")}.evidence.json`, "application/json;charset=utf-8");
    notify("PCAP evidence bundle exported for Investigation.");
  };

  return (
    <ToolLayout 
      title="PCAP Analyzer" 
      description="Zero-dependency PCAP binary viewer. Parse network captures directly in your browser without uploading."
      fullWidth={true}
    >
      <div className="flex flex-col gap-6 w-full mx-auto min-h-[calc(100vh-200px)]">
        
        {/* DRAG AND DROP AREA */}
        {!packets.length && (
          <div 
            className={`border-2 border-dashed ${isDragging ? "border-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] bg-[#050505] hover:border-zinc-700"} flex flex-col items-center justify-center p-20 transition-all cursor-pointer h-[400px]`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} 
              className="hidden" 
              accept=".pcap,application/vnd.tcpdump.pcap"
            />
            <Cpu className="w-16 h-16 text-zinc-600 mb-6" />
            <h3 className="font-mono text-xl text-zinc-300 mb-2 uppercase tracking-widest">Drop a .pcap file here</h3>
            <p className="font-mono text-zinc-500 text-sm">Or click to browse. Fully optimized offline engine.</p>
            {loading && <p className="text-[#00ff9c] font-mono mt-4 animate-pulse">Decoding binary... Please wait.</p>}
            {errorMsg && <p className="text-red-500 font-mono mt-4 flex items-center"><ShieldAlert className="w-4 h-4 mr-2" /> {errorMsg}</p>}
          </div>
        )}

        {/* WORKSPACE */}
        {packets.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[800px]">
            
            {/* PACKET LIST (LEFT) */}
            <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col xl:col-span-8 overflow-hidden relative">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[#00ff9c] text-sm font-semibold glow flex items-center uppercase tracking-widest">
                    Packet Grid
                  </span>
                  {globalHeader && (
                    <span className="text-xs font-mono text-zinc-500 bg-[#1a1a1a] px-2 py-1">
                      v{globalHeader.version} / {globalHeader.linkType === 1 ? "Ethernet" : globalHeader.linkType}
                    </span>
                  )}
                  <button 
                    onClick={() => setTimeFormat(prev => prev === "unix" ? "local" : "unix")}
                    className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-[#1a1a1a] text-zinc-400 hover:text-zinc-200 rounded-none"
                  >
                    <Clock className="w-3 h-3" />
                    {timeFormat}
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-black border border-[#1a1a1a] rounded-none">
                    <Search className="w-3 h-3 text-zinc-500 ml-2" />
                    <input 
                      type="text"
                      placeholder="Filter IP / Protocol..."
                      value={filterQuery}
                      onChange={(e) => { setFilterQuery(e.target.value); setPage(1); }}
                      className="bg-transparent border-none text-xs font-mono text-zinc-300 w-40 px-2 py-1.5 focus:outline-none placeholder:text-zinc-600 rounded-none focus:border-[#00ff9c] focus:ring-1 focus:ring-[#00ff9c]"
                    />
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={exportEvidenceBundle}
                    className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 border border-[#1a1a1a]"
                  >
                    <FileJson className="mr-1 h-3 w-3" /> Bundle
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setPackets([]); setSelectedPacketId(null); setFilterQuery(""); setGlobalHeader(null); setErrorMsg(""); }}
                    className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-[#1a1a1a]"
                  >
                    Close File
                  </Button>
                </div>
              </header>

              {errorMsg && (
                <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-2 text-xs font-mono text-orange-400 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-2 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="flex-1 overflow-auto bg-black custom-scrollbar">
                <table className="w-full text-left border-collapse cursor-default min-w-max">
                  <thead className="bg-[#0a0a0a] sticky top-0 z-10 border-b border-[#1a1a1a] shadow-md">
                    <tr>
                      <th className="px-4 py-2 font-mono text-xs text-zinc-500 font-medium border-r border-[#1a1a1a] w-16 text-center">No.</th>
                      <th className="px-4 py-2 font-mono text-xs text-blue-400 uppercase tracking-wider font-semibold border-r border-[#1a1a1a] w-48">Time</th>
                      <th className="px-4 py-2 font-mono text-xs text-blue-400 uppercase tracking-wider font-semibold border-r border-[#1a1a1a]">Source</th>
                      <th className="px-4 py-2 font-mono text-xs text-blue-400 uppercase tracking-wider font-semibold border-r border-[#1a1a1a]">Destination</th>
                      <th className="px-4 py-2 font-mono text-xs text-blue-400 uppercase tracking-wider font-semibold border-r border-[#1a1a1a] w-24 text-center">Proto</th>
                      <th className="px-4 py-2 font-mono text-xs text-blue-400 uppercase tracking-wider font-semibold w-24 text-right">Length</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px] divide-y divide-[#1a1a1a]">
                    {paginatedPackets.length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-8 text-zinc-600">No packets match filter.</td></tr>
                    ) : paginatedPackets.map((p) => {
                      const isSelected = selectedPacketId === p.id;
                      
                      let bgClass = "hover:bg-[#050505]";
                      
                      if (isSelected) {
                        bgClass = "bg-blue-900/20";
                      } else {
                        if (p.protocolName === "TCP") bgClass = "hover:bg-blue-900/10 text-blue-200/70";
                        else if (p.protocolName === "UDP") bgClass = "hover:bg-purple-900/10 text-purple-200/70";
                        else if (p.protocolName === "ICMP") bgClass = "hover:bg-pink-900/10 text-pink-200/70";
                        else if (p.protocolName === "ARP") bgClass = "hover:bg-yellow-900/10 text-yellow-200/70";
                      }

                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => setSelectedPacketId(isSelected ? null : p.id)}
                          className={`transition-colors ${bgClass} ${isSelected ? 'border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}
                        >
                          <td className="px-4 py-1.5 border-r border-[#1a1a1a] text-center text-zinc-600">{p.id}</td>
                          <td className="px-4 py-1.5 border-r border-[#1a1a1a]">{formatTime(p.tsSec, p.tsUsec)}</td>
                          <td className="px-4 py-1.5 border-r border-[#1a1a1a]">{p.srcIp || p.srcMac}</td>
                          <td className="px-4 py-1.5 border-r border-[#1a1a1a]">{p.dstIp || p.dstMac}</td>
                          <td className={`px-4 py-1.5 border-r border-[#1a1a1a] text-center font-bold ${
                            p.protocolName === "TCP" ? "text-blue-400" : 
                            p.protocolName === "UDP" ? "text-purple-400" : 
                            p.protocolName === "ICMP" ? "text-pink-400" : "text-zinc-400"
                          }`}>{p.protocolName}</td>
                          <td className="px-4 py-1.5 text-right">{p.origLen}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <footer className="px-4 py-2 bg-[#0a0a0a] border-t border-[#1a1a1a] flex justify-between items-center text-[10px] font-mono text-zinc-500 shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-zinc-400">Total Packets: {filteredPackets.length}</span>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 border border-[#1a1a1a] hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors rounded-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-zinc-300">Page {page} of {totalPages}</span>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1 border border-[#1a1a1a] hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors rounded-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </footer>
            </article>

            {/* RIGHT PANEL (DETAILS OR ANALYTICS) */}
            <article className="border border-[#1a1a1a] bg-[#050505] flex flex-col xl:col-span-4 overflow-hidden">
              <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#ffb000] text-xs">{selectedPacket ? "[HEX]" : "[STAT]"}</span>
                  <span className="text-[#ffb000] text-sm font-semibold uppercase tracking-widest glow-amber">
                    {selectedPacket ? "Packet Dump" : "Capture Analytics"}
                  </span>
                </div>
                {selectedPacket && (
                  <Button 
                    variant="ghost" size="sm"
                    onClick={() => setSelectedPacketId(null)}
                    className="h-6 px-2 text-[10px] font-mono rounded-none text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-[#1a1a1a]"
                  >
                    View Analytics
                  </Button>
                )}
              </header>
              
              <div className="flex-1 overflow-auto bg-black p-4 custom-scrollbar">
                {!selectedPacket && analytics ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4">
                      <h4 className="text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-3 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Protocol Distribution
                      </h4>
                      <div className="space-y-2">
                        {analytics.topProtos.map(([proto, count]) => (
                          <div key={proto} className="flex justify-between items-center text-xs font-mono">
                            <span className="text-zinc-400">{proto}</span>
                            <span className="text-zinc-300 bg-[#1a1a1a] px-2 py-0.5">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4">
                      <h4 className="text-xs font-mono text-purple-400 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-3 flex items-center gap-2">
                        <ArrowLeftRight className="w-3 h-3" /> Top Sources
                      </h4>
                      <div className="space-y-2">
                        {analytics.topSrcIps.map(([ip, count]) => (
                          <div key={ip} className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-400">{ip}</span>
                            <span className="text-zinc-300 bg-[#1a1a1a] px-2 py-0.5">{count} pkts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4">
                      <h4 className="text-xs font-mono text-pink-400 uppercase tracking-widest border-b border-[#1a1a1a] pb-2 mb-3 flex items-center gap-2">
                        <ArrowLeftRight className="w-3 h-3" /> Top Destinations
                      </h4>
                      <div className="space-y-2">
                        {analytics.topDstIps.map(([ip, count]) => (
                          <div key={ip} className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-400">{ip}</span>
                            <span className="text-zinc-300 bg-[#1a1a1a] px-2 py-0.5">{count} pkts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-center text-[10px] font-mono text-zinc-600 mt-4">
                      Select a packet to view raw hex dump
                    </div>
                  </div>
                ) : selectedPacket ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                      <div>
                        <div className="text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Frame Length</div>
                        <div className="text-zinc-300">{selectedPacket.origLen} bytes</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Capture Length</div>
                        <div className="text-zinc-300">{selectedPacket.inclLen} bytes</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Ethernet II MACs</div>
                        <div className="text-zinc-400">Src: <span className="text-zinc-300">{selectedPacket.srcMac}</span></div>
                        <div className="text-zinc-400">Dst: <span className="text-zinc-300">{selectedPacket.dstMac}</span></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-zinc-500 uppercase tracking-widest text-[10px] mb-2 border-b border-[#1a1a1a] pb-1">Hex & ASCII Dump</div>
                      <pre className="font-mono text-[10px] md:text-xs text-blue-400/80 break-all whitespace-pre-wrap">
                        {toHexDump(selectedPacket.raw)}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
