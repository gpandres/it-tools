const fs = require('fs');
const path = require('path');

const routes = [
  { path: 'network/cidr', title: 'CIDR Converter', desc: 'CIDR to Subnet Mask converter.' },
  { path: 'network/ip-converter', title: 'IP to Bin/Hex', desc: 'Convert IP address to binary or hexadecimal formats.' },
  { path: 'network/mac', title: 'MAC Validator', desc: 'Validate and format MAC addresses.' },
  
  { path: 'encoding/base64', title: 'Base64 Encoder/Decoder', desc: 'Encode and decode Base64 strings.' },
  { path: 'encoding/url', title: 'URL Encoder/Decoder', desc: 'Encode and decode URL parameters.' },
  { path: 'encoding/jwt', title: 'JWT Decoder', desc: 'Decode JSON Web Tokens (client-side only).' },
  { path: 'encoding/json-yaml', title: 'JSON/YAML/TOML Converter', desc: 'Convert between JSON, YAML, and TOML.' },
  { path: 'encoding/number-base', title: 'Number Base Converter', desc: 'Convert between Binary, Octal, Decimal, and Hexadecimal.' },

  { path: 'text/regex', title: 'Regex Tester', desc: 'Test regular expressions against text.' },
  { path: 'text/diff', title: 'Text Diff', desc: 'Compare two texts and highlight changes.' },
  { path: 'text/json', title: 'JSON Formatter', desc: 'Format and minify JSON strings.' },
  { path: 'text/counter', title: 'Word Counter', desc: 'Count words, characters, and lines.' },
  { path: 'text/lorem', title: 'Lorem Ipsum Generator', desc: 'Generate placeholder text.' },

  { path: 'crypto/hash', title: 'Hash Generators', desc: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes.' },
  { path: 'crypto/password', title: 'Password Generator', desc: 'Generate secure, random passwords locally.' },
  { path: 'crypto/uuid', title: 'UUID Generator', desc: 'Generate UUIDs and ULIDs.' },

  { path: 'other/cron', title: 'Cron Parser', desc: 'Parse and explain cron expressions.' },
  { path: 'other/qr', title: 'QR Code Generator', desc: 'Generate QR codes from text.' },
  { path: 'other/color', title: 'Color Converter', desc: 'Convert between HEX, RGB, and HSL.' },
];

const template = (title, desc) => `"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function PlaceholderTool() {
  return (
    <ToolLayout 
      title="${title}" 
      description="${desc}"
    >
      <Card className="bg-zinc-950 border-zinc-800 border-dashed">
        <CardContent className="p-12 text-center">
          <p className="text-zinc-500 font-mono text-sm">
            <span className="glow-amber">TODO:</span> Implement this tool.
          </p>
        </CardContent>
      </Card>
    </ToolLayout>
  );
}
`;

const baseDir = path.join(__dirname, 'src', 'app', 'tools');

routes.forEach(route => {
  const dirPath = path.join(baseDir, route.path);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), template(route.title, route.desc));
  console.log('Generated', route.path);
});
