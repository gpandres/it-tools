"use client";

import { ToolLayout } from "@/components/tool-layout";
import {
  ToolActionButton,
  ToolBadge,
  ToolEmptyState,
  ToolField,
  ToolPanel,
  ToolPanelBody,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolStatus,
} from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/components/notification-provider";
import { AlertTriangle, Copy, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import zxcvbn from "zxcvbn";

const MAX_ANALYSIS_LENGTH = 256;
type PasswordAnalysis = ReturnType<typeof zxcvbn>;

function generateSecurePassword(length: number, useUpper: boolean, useLower: boolean, useNums: boolean, useSyms: boolean): string {
  let charset = "";
  if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
  if (useNums) charset += "0123456789";
  if (useSyms) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
  if (!charset) return "";

  // Rejection sampling avoids the small modulo bias from mapping every uint32
  // value directly onto a charset whose size does not divide 2^32.
  const range = 0x100000000;
  const limit = Math.floor(range / charset.length) * charset.length;
  const password: string[] = [];
  const randomValues = new Uint32Array(Math.max(16, Math.min(length * 2, 256)));

  while (password.length < length) {
    window.crypto.getRandomValues(randomValues);
    for (const value of randomValues) {
      if (value >= limit) continue;
      password.push(charset[value % charset.length]);
      if (password.length === length) break;
    }
  }
  return password.join("");
}

function PasswordGeneratorContent() {
  const [state, setState] = useState({ len: "16", u: "1", l: "1", n: "1", s: "1" });
  const [password, setPassword] = useState("");
  const [customInput, setCustomInput] = useState(false);
  const [analysisState, setAnalysisState] = useState<{ password: string; result: PasswordAnalysis } | null>(null);
  const { notify } = useNotification();

  const length = Number.parseInt(state.len, 10) || 16;
  const useUpper = state.u === "1";
  const useLower = state.l === "1";
  const useNums = state.n === "1";
  const useSyms = state.s === "1";
  const hasCharset = useUpper || useLower || useNums || useSyms;

  // Generate the initial value after mount, when the browser crypto API exists.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setPassword(generateSecurePassword(16, true, true, true, true));
  }, []);

  useEffect(() => {
    if (!password || password.length > MAX_ANALYSIS_LENGTH) return;

    const timer = window.setTimeout(() => {
      setAnalysisState({ password, result: zxcvbn(password) });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [password]);

  const analysis = analysisState?.password === password ? analysisState.result : null;

  const copyToClipboard = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      notify("Password copied to clipboard");
    } catch {
      notify("Could not copy. Select the password and copy it manually.", "error");
    }
  };

  const generate = () => {
    if (!hasCharset) return;
    setPassword(generateSecurePassword(length, useUpper, useLower, useNums, useSyms));
    setCustomInput(false);
  };

  const toggleOption = (key: "u" | "l" | "n" | "s") => {
    const nextState = { ...state, [key]: state[key] === "1" ? "0" : "1" };
    setState(nextState);
    const nextUseUpper = nextState.u === "1";
    const nextUseLower = nextState.l === "1";
    const nextUseNums = nextState.n === "1";
    const nextUseSyms = nextState.s === "1";
    setPassword(generateSecurePassword(length, nextUseUpper, nextUseLower, nextUseNums, nextUseSyms));
    setCustomInput(false);
  };

  const handleLengthChange = (value: string) => {
    const nextLength = Number.parseInt(value, 10) || 16;
    setState(previous => ({ ...previous, len: value }));
    if (!customInput) setPassword(generateSecurePassword(nextLength, useUpper, useLower, useNums, useSyms));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setCustomInput(true);
  };

  return (
    <ToolLayout
      title="Password Generator & Analyzer"
      description="Generate a random password or check a password’s strength locally."
    >
      <div className="mx-auto grid w-full max-w-7xl min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <ToolPanel className="lg:col-span-4">
          <ToolPanelHeader>
            <ToolPanelTitle marker="IN">Generator</ToolPanelTitle>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-6">
            <ToolField htmlFor="password-length" label="Length" helper="Choose a length from 4 to 128 characters.">
              <div className="flex items-center gap-4">
                <input
                  id="password-length"
                  type="range"
                  min="4"
                  max="128"
                  value={length}
                  onChange={event => handleLengthChange(event.target.value)}
                  aria-valuetext={`${length} characters`}
                  className="tool-range min-w-0 flex-1"
                  style={{ "--tool-range-progress": `${((length - 4) / 124) * 100}%` } as CSSProperties}
                />
                <span className="min-w-12 text-right font-mono text-sm text-[#00ff9c]">{length}</span>
              </div>
            </ToolField>

            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-widest text-zinc-200">Character sets</legend>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <ToggleOption label="Uppercase [A-Z]" active={useUpper} onClick={() => toggleOption("u")} />
                <ToggleOption label="Lowercase [a-z]" active={useLower} onClick={() => toggleOption("l")} />
                <ToggleOption label="Numbers [0-9]" active={useNums} onClick={() => toggleOption("n")} />
                <ToggleOption label="Symbols [!@#]" active={useSyms} onClick={() => toggleOption("s")} />
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-2">
              <ToolActionButton tone="accent" onClick={generate} disabled={!hasCharset}>
                <RefreshCw aria-hidden="true" /> Generate random
              </ToolActionButton>
            </div>

            {!hasCharset ? (
              <ToolStatus tone="attention" title="Select a character set">Choose at least one set before generating a password.</ToolStatus>
            ) : (
              <ToolStatus tone="info">You can also enter your own password in the analysis field.</ToolStatus>
            )}
          </ToolPanelBody>
        </ToolPanel>

        <ToolPanel className="lg:col-span-8">
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Password</ToolPanelTitle>
            <ToolActionButton onClick={copyToClipboard} disabled={!password} aria-label="Copy password">
              <Copy aria-hidden="true" /> Copy
            </ToolActionButton>
          </ToolPanelHeader>
          <ToolPanelBody className="space-y-6">
            <ToolField htmlFor="password-test" label="Test or copy password" helper="Analysis runs locally after a short pause. Up to 256 characters can be analyzed.">
              <Input
                id="password-test"
                value={password}
                onChange={event => handlePasswordChange(event.target.value)}
                placeholder="Type a password to audit..."
                className="h-10 rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300 focus-visible:ring-[#00ff9c]/50"
                spellCheck={false}
                autoComplete="new-password"
              />
            </ToolField>

            {password.length > MAX_ANALYSIS_LENGTH ? (
              <ToolStatus tone="attention" title="Password is too long to analyze">Enter 256 characters or fewer. The value stays in the field and is not truncated.</ToolStatus>
            ) : analysis ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border border-[#1a1a1a] bg-[#080808] p-4">
                  <div className="flex items-center gap-3">
                    {analysis.score < 3 ? <ShieldAlert className="h-6 w-6 text-[#fbbf24]" aria-hidden="true" /> : <ShieldCheck className="h-6 w-6 text-[#00ff9c]" aria-hidden="true" />}
                    <div className="font-mono">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400">zxcvbn score</div>
                      <div className="text-sm font-bold uppercase tracking-widest text-zinc-100">{getScoreLabel(analysis.score)}</div>
                    </div>
                  </div>
                  <div className="text-left font-mono sm:text-right">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400">Estimated guesses</div>
                    <div className="text-sm font-bold text-[#00ff9c]">10^{analysis.guesses_log10.toFixed(1)}</div>
                  </div>
                </div>

                {(analysis.feedback.warning || analysis.feedback.suggestions.length > 0) && (
                  <ToolStatus tone="attention" title="Review this feedback">
                    <div className="space-y-2">
                      {analysis.feedback.warning && <p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{analysis.feedback.warning}</p>}
                      {analysis.feedback.suggestions.length > 0 && <ul className="list-disc space-y-1 pl-5">{analysis.feedback.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}>{suggestion}</li>)}</ul>}
                    </div>
                  </ToolStatus>
                )}

                <div className="border border-[#1a1a1a]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">Estimated attack times</h3>
                    <ToolBadge tone="info">Illustrative</ToolBadge>
                  </div>
                  <div className="divide-y divide-[#1a1a1a]">
                    <TimeRow label="Online, rate-limited (100 guesses/hour)" desc="A service applying login throttling" time={analysis.crack_times_display.online_throttling_100_per_hour} />
                    <TimeRow label="Online, no throttling (10 guesses/second)" desc="An unthrottled online login" time={analysis.crack_times_display.online_no_throttling_10_per_second} />
                    <TimeRow label="Offline, slow hash (10⁴ guesses/second)" desc="For example, bcrypt, scrypt, or PBKDF2 with a moderate work factor" time={analysis.crack_times_display.offline_slow_hashing_1e4_per_second} />
                    <TimeRow label="Offline, fast hash (10¹⁰ guesses/second)" desc="An illustrative estimate for a fast hash such as MD5, SHA-1, or SHA-256" time={analysis.crack_times_display.offline_fast_hashing_1e10_per_second} />
                  </div>
                </div>
                <ToolStatus tone="info">These are zxcvbn estimates, not a guarantee of security. Real attack times vary with rate limits, hardware, hash settings, and attacker resources.</ToolStatus>

                {analysis.sequence.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pattern matches detected</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.sequence.map((match, index) => (
                        <span key={`${index}-${match.i}-${match.j}`} className="max-w-full break-all border border-[#2a2a2a] bg-[#111111] px-2 py-1 font-mono text-[10px] text-zinc-300">
                          {match.pattern} ({match.token})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : password ? (
              <ToolStatus tone="info">Analyzing this password locally…</ToolStatus>
            ) : (
              <ToolEmptyState title="Enter a password to analyze">The score, guess estimate, feedback, and attack-time estimates will appear here.</ToolEmptyState>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}

function getScoreLabel(score: PasswordAnalysis["score"]): string {
  switch (score) {
    case 0: return "Very weak";
    case 1: return "Weak";
    case 2: return "Fair";
    case 3: return "Good";
    case 4: return "Strong";
  }
}

function TimeRow({ label, desc, time }: { label: string; desc: string; time: string | number }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="break-words font-mono text-xs text-zinc-200">{label}</div>
        <div className="mt-1 text-[10px] leading-relaxed text-zinc-400">{desc}</div>
      </div>
      <div className="shrink-0 font-mono text-xs uppercase tracking-wider text-zinc-100 sm:text-right">{time}</div>
    </div>
  );
}

function ToggleOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <ToolActionButton
      aria-pressed={active}
      tone={active ? "accent" : "neutral"}
      onClick={onClick}
      className="h-auto min-h-10 w-full justify-start gap-3 whitespace-normal px-3 py-2 text-left font-mono text-xs"
    >
      <span aria-hidden="true" className="flex h-3 w-3 shrink-0 items-center justify-center border border-current">
        {active && <span className="h-1.5 w-1.5 bg-current" />}
      </span>
      {label}
    </ToolActionButton>
  );
}

export default function PasswordGenerator() {
  return <PasswordGeneratorContent />;
}
