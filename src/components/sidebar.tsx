"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toolsRegistry, CATEGORIES } from "@/lib/tools";
import { useFavorites } from "./favorites-provider";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { favorites, isLoaded } = useFavorites();
  const renderLink = (tool: typeof toolsRegistry[number]) => <Link
    key={tool.id} href={tool.path} onClick={() => setIsOpen(false)}
    aria-current={pathname === tool.path ? "page" : undefined}
    className={`block py-1 text-xs transition-colors hover:text-[#00ff9c] ${pathname === tool.path ? "text-[#00ff9c]" : "text-zinc-400"}`}
    title={tool.description}>{pathname === tool.path ? "> " : ""}{tool.name}</Link>;
  const navigation = <nav aria-label="Tools" className="p-4 space-y-6">
    <Link href="/" onClick={() => setIsOpen(false)} className="block text-sm text-[#ffb000]" aria-current={pathname === "/" ? "page" : undefined}>All tools</Link>
    {isLoaded && favorites.length > 0 && <section>
      <h2 className="text-xs text-[#ffb000] mb-2">FAVORITES</h2>
      {toolsRegistry.filter(tool => favorites.includes(tool.id)).map(renderLink)}
    </section>}
    {CATEGORIES.map(category => <section key={category}>
      <h2 className="mb-2 text-[10px] font-bold text-[#00ff9c] tracking-widest">/ {category}</h2>
      {toolsRegistry.filter(tool => tool.category === category).map(renderLink)}
    </section>)}
  </nav>;
  return <>
    <div className="md:hidden p-4 border-b border-[#1a1a1a] flex items-center justify-between gap-4 bg-black">
      <Link href="/" className="font-bold text-[#ffb000] tracking-widest">IT_TOOLS_</Link>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="border border-zinc-700 px-3 py-2 text-sm" aria-label="Open navigation">Menu</DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-[#050505]">
          <DialogTitle>Tool navigation</DialogTitle>
          <DialogDescription>Browse all categories and your favorites.</DialogDescription>
          {navigation}
        </DialogContent>
      </Dialog>
    </div>
    <aside className="hidden md:block sticky top-0 h-screen w-64 shrink-0 bg-[#050505] border-r border-[#1a1a1a] overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-[#1a1a1a]">
        <Link href="/" className="font-bold text-xl text-[#ffb000] tracking-widest">IT_TOOLS_</Link>
        <p className="text-[10px] text-zinc-400 mt-2 tracking-widest">LOCAL-FIRST · NO TRACKING</p>
      </div>
      {navigation}
    </aside>
  </>;
}
