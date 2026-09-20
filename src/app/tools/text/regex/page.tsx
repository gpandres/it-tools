"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolActionButton, ToolActionPanel, ToolBadge, ToolEmptyState, ToolField, ToolPanel, ToolPanelBody, ToolPanelHeader, ToolPanelTitle, ToolStatus } from "@/components/tool-design";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";

const examples = [
  { label: "Email", val: "(?<=\\s|^)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})" },
  { label: "IPv4", val: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b" },
  { label: "MAC Address", val: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$" },
  { label: "URL", val: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)" },
];
const flagOptions = [
  ["g", "Global"], ["i", "Case Insensitive"], ["m", "Multiline"],
  ["s", "DotAll"], ["u", "Unicode"], ["y", "Sticky"],
] as const;

export default function RegexTester() {
  const [regexStr, setRegexStr] = useState(examples[0].val);
  const [flags, setFlags] = useState("gm");
  const [testText, setTestText] = useState("Contact us at support@example.com or sales@company.net for more info.\nAlso test invalid-email@... \nHello admin@localhost.dev");

  const regexData = useMemo(() => {
    if (!regexStr) return { error: null, matches: [] };
    try {
      const regex = new RegExp(regexStr, flags);
      // matchAll advances empty matches by Unicode code point when required.
      const match = flags.includes("g") ? null : regex.exec(testText);
      const matches = flags.includes("g") ? Array.from(testText.matchAll(regex)) : match ? [match] : [];
      return { error: null, matches };
    } catch (error) {
      return { error: (error as Error).message, matches: [] };
    }
  }, [regexStr, flags, testText]);

  const renderHighlightedText = () => {
    const elements = [];
    let lastIndex = 0;
    for (const [index, match] of regexData.matches.entries()) {
      const start = match.index;
      if (start > lastIndex) elements.push(<span key={`text-${index}`}>{testText.substring(lastIndex, start)}</span>);
      elements.push(
        <mark key={`match-${index}`} className="border-b border-[#00ff9c] bg-[#00ff9c]/20 font-bold text-[#00ff9c]" title={`Match ${index + 1}, index ${start}`}>
          {match[0] || <span aria-label="Zero-length match">│</span>}
        </mark>
      );
      lastIndex = start + match[0].length;
    }
    if (lastIndex < testText.length) elements.push(<span key="remaining">{testText.substring(lastIndex)}</span>);
    return elements;
  };

  const emptyTitle = regexData.error ? "Fix the expression to continue" : !regexStr ? "Awaiting expression" : "No matches found";

  return (
    <ToolLayout title="Regex Tester" description="Test regular expressions in real-time with syntax highlighting and match extraction.">
      <div className="space-y-6">
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="RE">Regular Expression</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-4">
            <ToolField htmlFor="regex-pattern" label="Pattern" helper="JavaScript regular expression without enclosing slashes. Flags are selected below.">
              <Input id="regex-pattern" value={regexStr} onChange={event => setRegexStr(event.target.value)} placeholder="Enter regular expression..."
                aria-invalid={!!regexData.error} aria-describedby={regexData.error ? "regex-error" : undefined}
                className="rounded-none border-[#1a1a1a] bg-black! font-mono text-zinc-300" spellCheck={false} />
            </ToolField>
            {regexData.error && <ToolStatus id="regex-error" tone="error" title="Invalid expression" className="break-all">{regexData.error}</ToolStatus>}
            <ToolActionPanel label="FLAGS">
              {flagOptions.map(([flag, label]) => (
                <ToolActionButton key={flag} aria-label={`${label} (${flag})`} aria-pressed={flags.includes(flag)}
                  tone={flags.includes(flag) ? "accent" : "neutral"}
                  onClick={() => setFlags(current => current.includes(flag) ? current.replace(flag, "") : current + flag)}>
                  {flag} · {label}
                </ToolActionButton>
              ))}
            </ToolActionPanel>
            <ToolActionPanel label="EXAMPLES">
              {examples.map(example => <ToolActionButton key={example.label} onClick={() => setRegexStr(example.val)}>{example.label}</ToolActionButton>)}
            </ToolActionPanel>
          </ToolPanelBody>
        </ToolPanel>
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <ToolPanel>
            <ToolPanelHeader><ToolPanelTitle marker="IN">Test String</ToolPanelTitle></ToolPanelHeader>
            <ToolPanelBody>
              <ToolField htmlFor="regex-text" label="Test text" helper="Matches update as you type. Disable Global to return only the first match.">
                <Textarea id="regex-text" value={testText} onChange={event => setTestText(event.target.value)} placeholder="Type text to test your regex against..."
                  className="h-80 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-zinc-300" spellCheck={false} />
              </ToolField>
            </ToolPanelBody>
          </ToolPanel>
          <ToolPanel>
            <ToolPanelHeader>
              <ToolPanelTitle marker="OUT">Highlighted</ToolPanelTitle>
              {!regexData.error && regexStr && <ToolBadge>{regexData.matches.length} {regexData.matches.length === 1 ? "Match" : "Matches"}</ToolBadge>}
            </ToolPanelHeader>
            <ToolPanelBody className="space-y-3">
              {regexData.error || !regexStr ? <ToolEmptyState title={emptyTitle}>Enter a valid expression to highlight matches.</ToolEmptyState> : (
                <>
                  <p className="text-xs text-zinc-400">Underlined text marks matches. │ marks a zero-length match.</p>
                  <div role="region" aria-label="Highlighted text" tabIndex={0}
                    className="max-h-80 min-h-36 overflow-auto whitespace-pre-wrap break-all border border-[#1a1a1a] bg-black p-4 text-sm leading-relaxed text-zinc-300 focus-visible:outline-2 focus-visible:outline-[#00ff9c]">
                    {testText || regexData.matches.length ? renderHighlightedText() : "Empty test text."}
                  </div>
                </>
              )}
            </ToolPanelBody>
          </ToolPanel>
        </div>
        <ToolPanel>
          <ToolPanelHeader><ToolPanelTitle marker="OUT">Capture Groups</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody>
            {regexData.matches.length === 0 ? <ToolEmptyState title={emptyTitle}>Matched text, capture groups and character indexes appear here.</ToolEmptyState> : (
              <div role="region" aria-label="Capture groups" tabIndex={0} className="max-h-96 overflow-auto border border-[#1a1a1a] bg-black text-xs focus-visible:outline-2 focus-visible:outline-[#00ff9c]">
                {regexData.matches.map((match, index) => (
                  <div key={index} className="border-b border-[#1a1a1a] last:border-b-0">
                    <div className="flex flex-wrap justify-between gap-2 bg-[#0a0a0a] px-4 py-2 font-bold text-zinc-400"><span>Match {index + 1}</span><span>Index: {match.index}</span></div>
                    <div className="whitespace-pre-wrap break-all px-4 py-3 text-zinc-300">{match[0] || "(zero-length match)"}</div>
                    {match.length > 1 && <dl className="space-y-2 border-t border-[#1a1a1a] px-4 py-3">
                      {match.slice(1).map((group, groupIndex) => (
                        <div key={groupIndex} className="flex flex-wrap gap-2">
                          <dt className="shrink-0 text-zinc-400">Group {groupIndex + 1}:</dt>
                          <dd className="min-w-0 whitespace-pre-wrap break-all text-zinc-300">{group === undefined ? "(unmatched)" : group || "(empty)"}</dd>
                        </div>
                      ))}
                    </dl>}
                  </div>
                ))}
              </div>
            )}
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
