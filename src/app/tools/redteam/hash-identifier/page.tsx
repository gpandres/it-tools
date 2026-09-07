"use client";

import React, { useState, useMemo } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, Fingerprint, HelpCircle, ShieldAlert } from "lucide-react";
import Link from 'next/link';

interface FormatMatch {
  name: string;
  category: 'Hash' | 'Encoding' | 'Other';
  confidence: 'High' | 'Medium' | 'Low';
  reason: string;
}

export default function HashIdentifierPage() {
  const [input, setInput] = useState("");

  const matches = useMemo(() => {
    if (!input.trim()) return [];
    
    const str = input.trim();
    const len = str.length;
    const isHex = /^[a-f0-9]+$/i.test(str);
    const isBase64 = /^[a-zA-Z0-9+/]+={0,2}$/.test(str);
    const isNumeric = /^[0-9]+$/.test(str);
    
    const results: FormatMatch[] = [];

    // HEX HASHES
    if (isHex) {
      if (len === 32) {
        results.push({ name: "MD5", category: "Hash", confidence: "High", reason: "32 hex characters" });
        results.push({ name: "MD4", category: "Hash", confidence: "Medium", reason: "32 hex characters" });
        results.push({ name: "NTLM", category: "Hash", confidence: "Medium", reason: "32 hex characters" });
      } else if (len === 40) {
        results.push({ name: "SHA-1", category: "Hash", confidence: "High", reason: "40 hex characters" });
        results.push({ name: "RIPEMD-160", category: "Hash", confidence: "Low", reason: "40 hex characters" });
      } else if (len === 56) {
        results.push({ name: "SHA-224", category: "Hash", confidence: "High", reason: "56 hex characters" });
        results.push({ name: "SHA-3 (224)", category: "Hash", confidence: "Medium", reason: "56 hex characters" });
      } else if (len === 64) {
        results.push({ name: "SHA-256", category: "Hash", confidence: "High", reason: "64 hex characters" });
        results.push({ name: "SHA-3 (256)", category: "Hash", confidence: "Medium", reason: "64 hex characters" });
        results.push({ name: "BLAKE2s", category: "Hash", confidence: "Low", reason: "64 hex characters" });
      } else if (len === 96) {
        results.push({ name: "SHA-384", category: "Hash", confidence: "High", reason: "96 hex characters" });
      } else if (len === 128) {
        results.push({ name: "SHA-512", category: "Hash", confidence: "High", reason: "128 hex characters" });
        results.push({ name: "SHA-3 (512)", category: "Hash", confidence: "Medium", reason: "128 hex characters" });
        results.push({ name: "Whirlpool", category: "Hash", confidence: "Medium", reason: "128 hex characters" });
      } else if (len === 16) {
        results.push({ name: "MySQL (Pre-4.1)", category: "Hash", confidence: "Medium", reason: "16 hex characters" });
      } else if (len === 8) {
        results.push({ name: "CRC32", category: "Hash", confidence: "Low", reason: "8 hex characters" });
      }

      // If it's hex of any other length
      results.push({ name: "Hexadecimal String", category: "Encoding", confidence: "Medium", reason: "Contains only 0-9 and A-F" });
    }

    // SPECIAL FORMATS
    if (str.startsWith("$2a$") || str.startsWith("$2b$") || str.startsWith("$2y$")) {
      results.push({ name: "Bcrypt", category: "Hash", confidence: "High", reason: "Starts with bcrypt identifier ($2*)" });
    }
    if (str.startsWith("$1$")) {
      results.push({ name: "MD5 Crypt", category: "Hash", confidence: "High", reason: "Starts with $1$" });
    }
    if (str.startsWith("$5$")) {
      results.push({ name: "SHA-256 Crypt", category: "Hash", confidence: "High", reason: "Starts with $5$" });
    }
    if (str.startsWith("$6$")) {
      results.push({ name: "SHA-512 Crypt", category: "Hash", confidence: "High", reason: "Starts with $6$" });
    }
    if (str.startsWith("$argon2")) {
      results.push({ name: "Argon2", category: "Hash", confidence: "High", reason: "Starts with $argon2" });
    }

    // ENCODINGS
    if (isBase64 && len >= 4 && !isHex && !isNumeric) {
      // Very basic base64 check
      results.push({ name: "Base64", category: "Encoding", confidence: str.endsWith("=") ? "High" : "Medium", reason: "Matches Base64 charset and padding" });
      
      // JWT check
      if (str.split('.').length === 3) {
        results.push({ name: "JSON Web Token (JWT)", category: "Other", confidence: "High", reason: "3 Base64 segments separated by dots" });
      }
    }

    if (isNumeric) {
      results.push({ name: "Decimal / Integer", category: "Encoding", confidence: "Low", reason: "Contains only digits" });
      if (len === 10 || len === 13) {
        results.push({ name: "Unix Timestamp", category: "Other", confidence: "Medium", reason: "10 or 13 digits is typical for epoch time" });
      }
    }

    if (str.includes("%") && /%[0-9a-fA-F]{2}/.test(str)) {
      results.push({ name: "URL Encoded", category: "Encoding", confidence: "High", reason: "Contains %XX escape sequences" });
    }

    return results;
  }, [input]);

  const getConfidenceColor = (conf: string) => {
    if (conf === 'High') return 'text-green-400 bg-green-900/20 border-green-900/50';
    if (conf === 'Medium') return 'text-amber-400 bg-amber-900/20 border-amber-900/50';
    return 'text-zinc-400 bg-zinc-900/50 border-zinc-800';
  };

  return (
    <ToolLayout
      title="Hash / Format Identifier"
      description="Identify possible hashing algorithms or encoding formats based on string length and charset."
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">

        {/* DISCLAIMER */}
        <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-200">
            <strong>Important Note:</strong> Because many hash functions produce hexadecimal strings of the same length (e.g. MD5 and NTLM are both 32 hex chars), it is <em>mathematically impossible</em> to guarantee the algorithm just by looking at it. The results below are only <strong>compatible possibilities</strong>.
          </div>
        </div>

        {/* INPUT */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-[#00ff9c]" /> Input String
          </h3>
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] bg-[#111] border-[#333] font-mono text-sm text-[#00ff9c] resize-none"
            placeholder="Paste your hash, encoded string, or token here..."
          />
          {input.trim() && (
            <div className="flex gap-4 text-xs font-mono text-zinc-500">
              <span>Length: {input.trim().length}</span>
              <span>Charset: {/^[a-f0-9]+$/i.test(input.trim()) ? 'Hexadecimal' : 'Mixed / Alphanumeric'}</span>
            </div>
          )}
        </div>

        {/* RESULTS */}
        {input.trim() && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Fingerprint className="w-4 h-4" /> Possible Formats ({matches.length})
            </h3>
            
            {matches.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 text-center text-zinc-500 flex flex-col items-center">
                <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
                <p>No standard hashes or encodings recognized.</p>
                <p className="text-xs mt-1">This could be plain text, a proprietary format, or salted/custom.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match, i) => (
                  <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex flex-col justify-between hover:bg-[#111] transition-colors">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-base">{match.name}</h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getConfidenceColor(match.confidence)}`}>
                          {match.confidence} Match
                        </span>
                      </div>
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2">{match.category}</span>
                      <p className="text-sm text-zinc-400">{match.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RELATED TOOLS */}
        <div className="pt-8 border-t border-[#1a1a1a]">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Related Generation Tools</h4>
          <div className="flex flex-wrap gap-2">
            <Link href="/tools/crypto/hash">
              <Button variant="outline" size="sm" className="h-8 text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white">
                Hash Generators
              </Button>
            </Link>
            <Link href="/tools/crypto/file-hash">
              <Button variant="outline" size="sm" className="h-8 text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white">
                File Hash Analyzer
              </Button>
            </Link>
            <Link href="/tools/encoding/base64">
              <Button variant="outline" size="sm" className="h-8 text-xs bg-[#111] border-[#333] text-zinc-300 hover:text-white">
                Base64 Encoder
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
