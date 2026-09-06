"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 bg-[#050505] border border-[#1a1a1a] hover:border-[#00ff9c] hover:text-[#00ff9c] transition-colors w-full justify-between group"
      >
        <span className="flex items-center gap-2 font-mono">
          <span className="text-zinc-600">$&gt;</span>
          <span>search_tools</span>
          <span className="cursor-blink text-[#00ff9c]">_</span>
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 border border-[#1a1a1a] bg-[#0a0a0a] px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-[#ffb000]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="CYBERSECURITY / BLUE TEAM">
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/security/scorecard"))}>
              Headers & TLS Scorecard
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="NETWORKING">
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/network/subnet"))}>
              Subnetting Calculator
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/network/vlsm"))}>
              VLSM Calculator
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/network/cidr"))}>
              CIDR Converter
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Encoding">
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/encoding/base64"))}>
              Base64
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/encoding/url"))}>
              URL Encode/Decode
            </CommandItem>
          </CommandGroup>
          {/* Add more groups as needed */}
        </CommandList>
      </CommandDialog>
    </>
  );
}
