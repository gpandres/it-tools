"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Copy, Star, Terminal, Server, Shield, Box, GitBranch, Layers, Check, ChevronRight, AlertTriangle } from "lucide-react";
import { CHEATSHEETS, CheatSheetEntry } from './data';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { assessCommandRisk } from '@/lib/command-risk';

const PLATFORM_ICONS: Record<string, any> = {
  Linux: Terminal,
  Windows: Server,
  Cisco: Layers,
  MikroTik: Layers,
  FortiGate: Shield,
  Docker: Box,
  Kubernetes: Box,
  Git: GitBranch,
  Nmap: Shield,
  OpenSSL: Shield,
  Other: Terminal
};

const PLATFORM_CATEGORIES = [
  {
    name: "Operating Systems",
    platforms: ["Linux", "Windows"]
  },
  {
    name: "Networking",
    platforms: ["Cisco", "MikroTik", "FortiGate"]
  },
  {
    name: "Containers & VCS",
    platforms: ["Docker", "Kubernetes", "Git"]
  },
  {
    name: "Security Tools",
    platforms: ["Nmap", "OpenSSL"]
  }
];

export default function CheatsheetsPage() {
  const [query, setQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All Categories");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load favorites from local storage
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const saved = readLocalStorage("it_cheatsheets_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites");
      }
    }
  }, []);

  // Save favorites to local storage
  useEffect(() => {
    writeLocalStorage("it_cheatsheets_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in another input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape' && e.target === searchInputRef.current) {
          setQuery("");
          searchInputRef.current?.blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const copyCommand = (id: string, command: string) => {
    const risk = assessCommandRisk(command);
    if (risk.risk === "destructive" && !window.confirm(`${risk.message}\n\nCopy this command to the clipboard?`)) {
      return;
    }
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Filter and group logic
  const filteredAndGrouped = useMemo(() => {
    let results = CHEATSHEETS;

    if (showOnlyFavorites) {
      results = results.filter(c => favorites.includes(c.id));
    }

    if (selectedPlatform !== "All Categories") {
      results = results.filter(c => c.platform === selectedPlatform);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(c => {
        return c.command.toLowerCase().includes(q) ||
               c.description.toLowerCase().includes(q) ||
               c.platform.toLowerCase().includes(q) ||
               c.category.toLowerCase().includes(q) ||
               c.tags.some(t => t.toLowerCase().includes(q)) ||
               c.aliases.some(a => a.toLowerCase().includes(q));
      });
    }

    // Cross-Platform grouping: Group by similar generic intents if query exists, 
    // otherwise group by Category
    const grouped: Record<string, CheatSheetEntry[]> = {};
    
    // If the user searches something specific (like "routing table"), we just list them all 
    // but visually it's nice to see them grouped by platform. 
    // To make it structured, we'll group by Category by default.
    results.forEach(entry => {
      if (!grouped[entry.category]) {
        grouped[entry.category] = [];
      }
      grouped[entry.category].push(entry);
    });

    return grouped;
  }, [query, showOnlyFavorites, favorites, selectedPlatform]);

  return (
    <ToolLayout
      title="IT Cheatsheets"
      description="Fast, cross-platform command reference. Press '/' to search."
    >
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto items-start min-h-[calc(100vh-12rem)]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2 sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
          
          <button
            onClick={() => setSelectedPlatform("All Categories")}
            className={`flex items-center gap-3 px-3 py-2 mt-1 mb-2 rounded-md text-sm transition-colors text-left ${selectedPlatform === "All Categories" ? 'bg-[#1a1a1a] text-[#00ff9c] font-medium' : 'text-zinc-400 hover:text-white hover:bg-[#111]'}`}
          >
            <Layers className={`w-4 h-4 ${selectedPlatform === "All Categories" ? 'text-[#00ff9c]' : 'text-zinc-500'}`} />
            All Categories
          </button>

          <div className="pl-2 border-l border-[#1a1a1a] ml-3 mb-2 flex flex-col gap-2">
            {PLATFORM_CATEGORIES.map(category => {
              const isCollapsed = collapsedCategories.includes(category.name);
              return (
                <div key={category.name} className="">
                  <button 
                    onClick={() => toggleCategory(category.name)}
                    className="flex items-center w-full text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-wider mb-1 px-3 py-1 rounded transition-colors"
                  >
                    <ChevronRight className={`w-3 h-3 mr-1 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                    {category.name}
                  </button>
                  
                  {!isCollapsed && (
                    <div className="flex flex-col gap-0.5 ml-1">
                      {category.platforms.map(p => {
                        const Icon = PLATFORM_ICONS[p] || Layers;
                        const isActive = selectedPlatform === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setSelectedPlatform(p)}
                            className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${isActive ? 'bg-[#1a1a1a] text-[#00ff9c] font-medium' : 'text-zinc-400 hover:text-white hover:bg-[#111]'}`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#00ff9c]' : 'text-zinc-500'}`} />
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6 w-full">
          
          {/* Search Bar */}
          <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              ref={searchInputRef}
              placeholder="Search commands, platforms, aliases (e.g. 'routing table', 'ufw')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-[#0a0a0a] border-[#1a1a1a] focus-visible:ring-[#333] h-12 text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-[#333] rounded text-[10px] text-zinc-500 bg-black font-mono">
                /
              </kbd>
            </div>
          </div>
          <Button 
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            variant="outline" 
            className={`h-12 border-[#1a1a1a] transition-colors ${showOnlyFavorites ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-[#0a0a0a] text-zinc-400 hover:text-white'}`}
          >
            <Star className={`w-4 h-4 mr-2 ${showOnlyFavorites ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            Favorites
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-8">
          {Object.keys(filteredAndGrouped).length === 0 ? (
            <div className="text-center py-12 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
              <Terminal className="w-8 h-8 mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">No commands found for your query.</p>
            </div>
          ) : (
            Object.entries(filteredAndGrouped).map(([category, entries]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-sm font-bold text-[#00ff9c] uppercase tracking-wider">{category}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {entries.map(entry => {
                    const Icon = PLATFORM_ICONS[entry.platform] || Terminal;
                    const isFav = favorites.includes(entry.id);
                    const risk = assessCommandRisk(entry.command);
                    
                    return (
                      <div key={entry.id} className="bg-black border border-[#1a1a1a] rounded-lg overflow-hidden flex flex-col group hover:border-[#333] transition-colors">
                        {/* Header */}
                        <div className="bg-[#050505] border-b border-[#1a1a1a] px-4 py-2 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-zinc-500" />
                            <span className="text-xs font-bold text-zinc-300">{entry.platform}</span>
                          </div>
                          <button 
                            onClick={() => toggleFavorite(entry.id)}
                            className="text-zinc-600 hover:text-yellow-400 transition-colors focus:outline-none"
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-4 flex-1 flex flex-col">
                          <p className="text-sm text-zinc-400 mb-3 line-clamp-2 min-h-[40px]">{entry.description}</p>

                          {risk.risk !== "safe" && (
                            <div
                              className={`mb-3 flex items-start gap-2 rounded border px-3 py-2 text-xs ${risk.risk === "destructive" ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300'}`}
                              role="note"
                            >
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                              <span><strong>{risk.label}:</strong> {risk.message}</span>
                            </div>
                          )}
                          
                          <div className="relative mt-auto bg-[#0a0a0a] rounded border border-[#1a1a1a] group-hover:border-[#333] transition-colors">
                            <pre className="p-3 text-sm text-[#00ff9c] font-mono overflow-x-auto custom-scrollbar">
                              {entry.command}
                            </pre>
                            <button
                              onClick={() => copyCommand(entry.id, entry.command)}
                              className="absolute top-2 right-2 bg-black border border-[#1a1a1a] p-1.5 rounded text-zinc-500 hover:text-white hover:bg-[#1a1a1a] transition-all opacity-0 group-hover:opacity-100"
                              title={risk.risk === "destructive" ? "Copy command (confirmation required)" : "Copy command"}
                            >
                              {copiedId === entry.id ? <Check className="w-4 h-4 text-[#00ff9c]" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        
        </div>
      </div>
    </ToolLayout>
  );
}
