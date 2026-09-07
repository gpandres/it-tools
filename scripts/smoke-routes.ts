import { toolsRegistry } from "../src/lib/tools.ts";
const origin = "http://localhost:3501";
const pending = ["/", ...toolsRegistry.map(tool => tool.path)];
const failures: string[] = [];
let checked = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (pending.length) {
    const path = pending.shift()!;
    try {
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(60_000), redirect: "error" });
      const html = await response.text();
      if (response.status !== 200 || !html.includes("<html")) failures.push(`${path}: HTTP ${response.status}, expected an HTML page`);
    } catch (error) { failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`); }
    checked++;
  }
}));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
console.log(`HTTP smoke: ${checked - failures.length}/${checked} pages passed at ${origin}. This does not test browser hydration or calculations.`);
