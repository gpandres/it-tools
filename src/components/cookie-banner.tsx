"use client";
import { useState } from "react";
import { useFavorites } from "./favorites-provider";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
export function CookieBanner() {
  const { isLoaded, consent, changeConsent, storageError } = useFavorites();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const choose = (value: "essential" | "none") => {
    changeConsent(value);
    setOpen(false);
    setDismissed(true);
  };
  const choices = <div className="flex flex-wrap gap-3">
    <Button variant="outline" onClick={() => choose("none")}>Use without saving</Button>
    <Button onClick={() => choose("essential")}>Save on this device</Button>
  </div>;
  return <>
    <footer className="border-t border-[#1a1a1a] p-4 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-3">
      <span>{isLoaded && (consent === "all" || consent === "essential") ? "Device storage enabled" : "Session only · tool data is not saved"}</span>
      <button className="text-[#00ff9c] underline underline-offset-4" onClick={() => setOpen(true)}>Storage preferences</button>
      {storageError && <p role="alert" className="w-full text-amber-400">Browser storage is unavailable or full. Your current session still works, but changes may not survive a reload.</p>}
    </footer>
    {isLoaded && consent === null && !dismissed && !open && <section aria-label="Storage choice" className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-[#050505] border border-[#00ff9c] p-5 space-y-4 shadow-xl">
        <h2 className="font-bold text-[#00ff9c]">Keep your work on this device?</h2>
        <p className="text-sm text-zinc-300">Optional browser storage remembers favorites, recent tools and supported drafts. No analytics or tracking. You can change this choice below at any time.</p>
        {choices}
      </div>
    </section>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Storage preferences</DialogTitle>
        <DialogDescription>Saving is optional. Recent tools contain tool names only, never your input. Disabling storage removes saved favorites, recent tools and supported drafts from this browser. Open editors keep their current content until you leave them.</DialogDescription>
        {choices}
      </DialogContent>
    </Dialog>
  </>;
}
