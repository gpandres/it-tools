"use client";

import { ToolLayout } from "@/components/tool-layout";
import { CommandMenu } from "@/components/command-menu";
import Link from "next/link";
import { useState, useEffect } from "react";

const ASCII_DESKTOP = String.raw`
  ___ _____   _____ ___   ___  _    ___ 
 |_ _|_   _| |_   _/ _ \ / _ \| |  / __|
  | |  | |     | || (_) | (_) | |__\__ \
 |___| |_|     |_| \___/ \___/|____|___/
                                        
`;

const categories = [
  {
    name: "Networking",
    desc: "Subnetting, IP conversion, CIDR calculators",
    path: "/tools/network/subnet"
  },
  {
    name: "Encoding & Converters",
    desc: "Base64, URL encoding, JWT decoder",
    path: "/tools/encoding/base64"
  },
  {
    name: "Text Tools",
    desc: "Diffs, JSON formatting, Regex",
    path: "/tools/text/regex"
  },
  {
    name: "Cryptography",
    desc: "Hash generation, Passwords, UUID",
    path: "/tools/crypto/password"
  },
];

export default function Home() {
  const [glitch, setGlitch] = useState(false);

  function triggerGlitch() {
    setGlitch(true);
    setTimeout(() => setGlitch(false), 500);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          
          <section className="pt-12 pb-10 sm:pt-24 sm:pb-16 border-b border-[#1a1a1a]">
            {/* desktop ASCII */}
            <pre
              className="ascii hidden sm:block text-[10px] md:text-xs text-[#00ff9c] glow leading-none overflow-hidden"
              aria-label="ASCII banner: IT TOOLS"
            >
              {ASCII_DESKTOP}
            </pre>

            {/* mobile logo block */}
            <div className="block sm:hidden">
              <div className="border border-[#00ff9c]/40 bg-[#050505] p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-1">
                  ┌ system ┐
                </p>
                <h1 className="text-2xl font-bold text-[#00ff9c] glow tracking-widest">
                  IT_TOOLS
                </h1>
                <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mt-1">
                  └─
                </p>
              </div>
            </div>

            <div className={`mt-6 sm:mt-8 space-y-2 text-sm ${glitch ? "animate-pulse" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-2 break-all">
                <span className="text-[#ffb000]">root@it-tools</span>
                <span className="text-zinc-500">:</span>
                <span className="text-cyan-400">~</span>
                <span className="text-zinc-500">#</span>
                <span className="text-zinc-100">./start.sh</span>
                <button
                  onClick={triggerGlitch}
                  className="cursor-blink text-[#00ff9c] hover:text-[#ffb000] focus:outline-none"
                >
                  _
                </button>
              </div>

              <div className="pt-6 max-w-2xl space-y-1 text-zinc-300 text-sm leading-relaxed">
                <p><span className="text-zinc-600 mr-2">&gt;</span>A privacy-first, client-side toolkit for developers and sysadmins.</p>
                <p><span className="text-zinc-600 mr-2">&gt;</span>No tracking, no backend, absolute privacy.</p>
                
                <div className="pt-4">
                  <a 
                    href="https://github.com/gpandres/it-tools" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black border border-[#1a1a1a] text-zinc-400 hover:text-white hover:border-[#333] transition-colors rounded-md text-sm font-mono"
                  >
                    <span>View Source on GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="flex items-center gap-4 mb-8">
               <span className="text-zinc-600">/var/www/modules/</span>
               <div className="w-64">
                 <CommandMenu />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
              {categories.map((cat, i) => (
                <Link key={cat.name} href={cat.path} className="group block">
                  <article className="border border-[#1a1a1a] bg-[#050505] hover:border-[#2a2a2a] transition-colors h-full">
                    <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                      <span className="text-[#00ff9c] text-xs">[{String(i+1).padStart(2, '0')}]</span>
                      <span className="text-[#ffb000] text-sm font-semibold glow-amber">
                        {cat.name}
                      </span>
                    </header>
                    <div className="px-4 py-4 space-y-1.5 text-sm text-zinc-400">
                      <div className="flex gap-2 leading-relaxed">
                        <span className="text-[#00ff9c] shrink-0 select-none">[INFO]</span>
                        <span>{cat.desc}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
