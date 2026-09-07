import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(readFileSync(path.join(root, "scripts/lint-baseline.json"), "utf8"));
const result = spawnSync(process.execPath, [path.join(root, "node_modules/eslint/bin/eslint.js"), ".", "--format", "json"], {
  cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
});
if (result.error || ![0, 1].includes(result.status)) {
  console.error(result.error?.message || result.stderr || "ESLint did not complete.");
  process.exit(1);
}
let rows;
try { rows = JSON.parse(result.stdout); } catch {
  console.error("ESLint returned invalid JSON.", result.stderr);
  process.exit(1);
}
const counts = {};
for (const row of rows) for (const message of row.messages) {
  const key = [path.relative(root, row.filePath).split(path.sep).join("/"), message.ruleId || "parser", message.severity].join("|");
  counts[key] = (counts[key] || 0) + 1;
}
const regressions = Object.entries(counts).filter(([key, count]) => count > (baseline[key] || 0));
if (regressions.length) {
  console.error("New lint findings (file | rule | severity):");
  for (const [key, count] of regressions) console.error(`${key}: ${count} (baseline ${baseline[key] || 0})`);
  process.exit(1);
}
console.log(`No new lint findings. Existing debt: ${rows.reduce((sum, row) => sum + row.errorCount, 0)} errors, ${rows.reduce((sum, row) => sum + row.warningCount, 0)} warnings. Run npm run lint for full details.`);
