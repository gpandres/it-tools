"use client";

import { ToolLayout } from "@/components/tool-layout";
import { ToolPanel, ToolPanelHeader, ToolPanelTitle, ToolPanelBody, ToolField, ToolActionButton, ToolStatus } from "@/components/tool-design";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useNotification } from "@/components/notification-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback } from "react";
import { Copy, RefreshCw } from "lucide-react";

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
  
  const { notify } = useNotification();

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy. Select the text and copy it manually.", "error");
    }
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  }, [generate]);

  return (
    <ToolLayout title="Lorem Ipsum Generator" description="Generate placeholder dummy text for your designs and mockups.">
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-4">
        <ToolPanel className="h-fit xl:col-span-1">
          <ToolPanelHeader><ToolPanelTitle marker="IN">Configuration</ToolPanelTitle></ToolPanelHeader>
          <ToolPanelBody className="space-y-6">
            <ToolField htmlFor="lorem-format" label="Format">
              <Select value={type} onValueChange={value => {
                if (value === "paragraphs" || value === "sentences" || value === "words") setType(value);
              }}>
                <SelectTrigger id="lorem-format" className="w-full rounded-none border-[#1a1a1a] bg-black!">
                  <SelectValue>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraphs">Paragraphs</SelectItem>
                  <SelectItem value="sentences">Sentences</SelectItem>
                  <SelectItem value="words">Words</SelectItem>
                </SelectContent>
              </Select>
            </ToolField>
            <ToolField htmlFor="lorem-count" label="Quantity" helper="Choose 1 to 1,000. Text updates automatically when you change the format or quantity.">
              <Input id="lorem-count" type="number" min={1} max={1000} value={count}
                onChange={event => setCount(parseInt(event.target.value) || 0)}
                aria-describedby={count < 1 || count > 1000 ? "lorem-count-status" : undefined}
                className="h-10 rounded-none border-[#1a1a1a] bg-black! text-base text-zinc-300" />
            </ToolField>
            {(count < 1 || count > 1000) && <ToolStatus id="lorem-count-status" tone="attention">Generating {Math.min(Math.max(1, count || 1), 1000).toLocaleString("en-US")} {count < 1 ? type.slice(0, -1) : type}. Choose a quantity between 1 and 1,000.</ToolStatus>}
            <ToolActionButton tone="accent" onClick={generate} className="w-full"><RefreshCw aria-hidden="true" /> Generate</ToolActionButton>
          </ToolPanelBody>
        </ToolPanel>
        <ToolPanel className="xl:col-span-3">
          <ToolPanelHeader>
            <ToolPanelTitle marker="OUT">Generated text</ToolPanelTitle>
            <ToolActionButton onClick={copy} disabled={!output} aria-label="Copy generated text"><Copy aria-hidden="true" /> Copy</ToolActionButton>
          </ToolPanelHeader>
          <ToolPanelBody>
            <ToolField htmlFor="lorem-output" label="Generated text" helper="Read-only output. Generate creates a new variation with the same settings.">
              <Textarea id="lorem-output" readOnly value={output} spellCheck={false}
                className="h-64 field-sizing-fixed resize-y rounded-none border-[#1a1a1a] bg-black! text-sm leading-relaxed text-zinc-300 xl:h-96" />
            </ToolField>
          </ToolPanelBody>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
