"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum"
];

function getRandomWord() {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function generateSentence(wordCount: number = 8) {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(getRandomWord());
  }
  let sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function generateParagraph(sentenceCount: number = 5) {
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) {
    // vary sentence length between 5 and 12 words
    sentences.push(generateSentence(Math.floor(Math.random() * 8) + 5));
  }
  return sentences.join(" ");
}

export default function LoremIpsumGenerator() {
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [count, setCount] = useState<number>(3);
  const [output, setOutput] = useState("");
  
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const generate = useCallback(() => {
    let result = "";
    const safeCount = Math.min(Math.max(1, count || 1), 1000); // Max limits to prevent freezing

    if (type === "paragraphs") {
      const paras = [];
      for (let i = 0; i < safeCount; i++) {
        paras.push(generateParagraph(Math.floor(Math.random() * 4) + 4));
      }
      result = paras.join("\n\n");
    } else if (type === "sentences") {
      const sents = [];
      for (let i = 0; i < safeCount; i++) {
        sents.push(generateSentence(Math.floor(Math.random() * 8) + 5));
      }
      result = sents.join(" ");
    } else if (type === "words") {
      const words = [];
      for (let i = 0; i < safeCount; i++) {
        words.push(getRandomWord());
      }
      result = words.join(" ");
      result = result.charAt(0).toUpperCase() + result.slice(1) + ".";
    }

    setOutput(result);
  }, [type, count]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <ToolLayout 
      title="Lorem Ipsum Generator" 
      description="Generate placeholder dummy text for your designs and mockups."
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Controls */}
        <article className="xl:col-span-1 border border-[#1a1a1a] bg-[#050505] flex flex-col h-fit sticky top-24">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-zinc-600 text-xs">[CMD]</span>
            <span className="text-[#00ff9c] text-sm font-semibold uppercase tracking-widest">Configuration</span>
          </header>
          <div className="p-6 flex flex-col gap-6">
            
            <div className="space-y-3">
              <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Format</Label>
              <div className="flex flex-col gap-2">
                {(["paragraphs", "sentences", "words"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`text-left px-4 py-2 font-mono text-sm border transition-colors ${type === t ? "border-[#00ff9c] text-[#00ff9c] bg-[#00ff9c]/10" : "border-[#1a1a1a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Quantity</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                className="font-mono text-base bg-black border-[#1a1a1a] rounded-none focus-visible:ring-[#00ff9c] h-10 text-zinc-200"
              />
            </div>

            <Button 
              onClick={generate}
              className="mt-4 w-full rounded-none font-mono tracking-widest uppercase border border-[#ffb000] text-[#ffb000] bg-transparent hover:bg-[#ffb000]/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Generate
            </Button>
          </div>
        </article>

        {/* Output */}
        <article className="xl:col-span-3 border border-[#1a1a1a] bg-[#050505] flex flex-col min-h-[500px]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff9c] text-xs">[OUT]</span>
              <span className="text-[#ffb000] text-sm font-semibold glow-amber uppercase tracking-widest">Generated Text</span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs font-mono rounded-none text-zinc-400 hover:text-[#00ff9c] hover:bg-[#00ff9c]/10 transition-colors border border-transparent hover:border-[#00ff9c]/30"
              onClick={copy}
            >
              {copiedKey ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </header>
          <div className="p-0 flex-1 flex flex-col">
            <Textarea
              readOnly
              value={output}
              className="flex-1 w-full p-6 font-mono text-sm leading-relaxed bg-black border-none text-zinc-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none custom-scrollbar"
              spellCheck={false}
            />
          </div>
        </article>

      </div>
    </ToolLayout>
  );
}
