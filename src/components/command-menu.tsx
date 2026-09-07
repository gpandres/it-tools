"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { searchTools } from "@/lib/tool-discovery";

import { CATEGORIES, ToolDefinition } from "@/lib/tools";
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
  const [searchQuery, setSearchQuery] = React.useState("");
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
    setSearchQuery("");
  }, []);

  const filteredTools = React.useMemo(() => searchTools(searchQuery), [searchQuery]);

  // Group tools for display if not searching
  const groupedTools = React.useMemo(() => {
    const groups: Record<string, ToolDefinition[]> = {};
    CATEGORIES.forEach((c) => (groups[c] = []));

    filteredTools.forEach((tool) => {
      if (groups[tool.category]) {
        groups[tool.category].push(tool);
      } else {
        groups[tool.category] = [tool];
      }
    });

    return groups;
  }, [filteredTools]);

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
      <CommandDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setSearchQuery("");
        }}
        commandProps={{ shouldFilter: false }}
      >
        <CommandInput
          aria-label="Search tools"
          placeholder="Type a command or search (e.g. 'wildcard', 'firewall', 'chmod')..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No tools found.</CommandEmpty>

          {searchQuery.trim() ? (
            // Flat list when searching
            <CommandGroup heading="Search Results">
              {filteredTools.map((tool) => (
                <CommandItem
                  key={tool.id}
                  value={tool.id} // value is needed for cmdk even if not filtering
                  onSelect={() => runCommand(() => router.push(tool.path))}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[#00ff9c] font-medium">{tool.name}</span>
                    <span className="text-xs text-zinc-500">{tool.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            // Grouped list when empty
            CATEGORIES.map((category) => {
              const tools = groupedTools[category];
              if (!tools || tools.length === 0) return null;

              return (
                <CommandGroup key={category} heading={category}>
                  {tools.map((tool) => (
                    <CommandItem
                      key={tool.id}
                      value={tool.id}
                      onSelect={() => runCommand(() => router.push(tool.path))}
                    >
                      {tool.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
