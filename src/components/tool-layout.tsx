import * as React from "react";
import { CommandMenu } from "./command-menu";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#050505]">
        <div>
          <h1 className="text-sm font-bold text-[#ffb000] glow-amber flex items-center gap-2 uppercase tracking-widest">
            <span className="text-[#00ff9c] text-xs">/</span>
            {title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">{description}</p>
        </div>
        <div className="hidden md:block w-64">
          <CommandMenu />
        </div>
      </header>
      <main className="flex-1 p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
