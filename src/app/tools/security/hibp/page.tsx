"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { KeyRound, ShieldAlert, ShieldCheck, Info, Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HIBPChecker() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "safe" | "breached" | "error">("idle");
  const [breachCount, setBreachCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Helper to hash password to SHA-1 using native crypto API
  const sha1 = async (str: string) => {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  const checkPassword = async () => {
    if (!password) return;

    setStatus("loading");
    try {
      const hash = await sha1(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      // K-Anonymity model: only send the first 5 characters of the hash
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) {
        throw new Error("Failed to connect to HIBP API");
      }
      
      const text = await res.text();
      
      // Parse the response (Format: SUFFIX:COUNT)
      const lines = text.split('\n');
      let found = false;
      let count = 0;

      for (const line of lines) {
        const [lineSuffix, lineCount] = line.trim().split(':');
        if (lineSuffix === suffix) {
          found = true;
          count = parseInt(lineCount, 10);
          break;
        }
      }

      if (found) {
        setBreachCount(count);
        setStatus("breached");
      } else {
        setBreachCount(0);
        setStatus("safe");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unknown error occurred.");
      setStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      checkPassword();
    }
  };

  return (
    <ToolLayout
      title="Pwned Password Checker"
      description="Check if a password has been exposed in data breaches. This tool uses the Have I Been Pwned API via the K-Anonymity model, meaning your actual password never leaves your browser."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">
        
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="border border-[#1a1a1a] bg-[#050505] p-6 lg:p-12 text-center space-y-8">
            
            <div className="mx-auto w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-zinc-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-zinc-200">Test a Password</h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                Type a password below to check its breach status safely.
              </p>
            </div>

            <div className="max-w-md mx-auto relative flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                   setPassword(e.target.value);
                   setStatus("idle");
                }}
                onKeyDown={handleKeyDown}
                className="pl-4 pr-24 py-6 text-lg bg-black border-[#1a1a1a] focus:border-[#00ff9c] text-zinc-200"
              />
              <div className="absolute right-2 flex gap-2">
                <Button 
                  onClick={checkPassword} 
                  disabled={!password || status === "loading"}
                  className="bg-[#00ff9c] hover:bg-[#00cc7d] text-black h-9"
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                </Button>
              </div>
            </div>

            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
            >
              {showPassword ? "Hide Password" : "Show Password"}
            </button>
            
          </div>

          {/* Results Area */}
          {status === "breached" && (
            <div className="border border-red-500/30 bg-red-500/10 p-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-3xl font-bold text-red-500 mb-2">Oh no — pwned!</h2>
              <p className="text-red-400/80 text-lg mb-6">
                This password has been seen <strong className="text-red-400 font-bold">{breachCount.toLocaleString()}</strong> times in data breaches.
              </p>
              <p className="text-sm text-red-400/60 max-w-lg">
                This password previously appeared in a data breach and should <strong>never</strong> be used. If you've ever used it anywhere before, change it immediately!
              </p>
            </div>
          )}

          {status === "safe" && (
            <div className="border border-[#00ff9c]/30 bg-[#00ff9c]/5 p-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ShieldCheck className="w-16 h-16 text-[#00ff9c] mb-4" />
              <h2 className="text-3xl font-bold text-[#00ff9c] mb-2">Good news — no pwnage found!</h2>
              <p className="text-[#00ff9c]/80 text-lg mb-6">
                This password wasn't found in any of the Pwned Passwords loaded into HIBP.
              </p>
              <p className="text-sm text-[#00ff9c]/60 max-w-lg">
                While it hasn't been breached yet, ensure you are not reusing it across multiple sites and that it is sufficiently complex.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="border border-amber-500/30 bg-amber-500/10 p-8 flex items-center gap-4 text-amber-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Info className="w-8 h-8 shrink-0" />
              <div className="text-left">
                <h3 className="font-bold">Error Checking Password</h3>
                <p className="text-sm opacity-80 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#1a1a1a] bg-black p-6 space-y-4">
            <h3 className="font-bold text-zinc-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#00ff9c]" /> Is this safe?
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              <strong>Yes.</strong> This tool uses the <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noreferrer" className="text-[#00ff9c] hover:underline">K-Anonymity model</a>.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              When you type a password, your browser creates a SHA-1 hash of it. It only sends the <strong>first 5 characters</strong> of that hash to the server.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The API returns hundreds of suffixes that match those 5 characters. Your browser then checks the list locally. Your actual password (and even its full hash) is never transmitted.
            </p>
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
