import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { toolsRegistry, CATEGORIES } from "../src/lib/tools.ts";
import { searchTools, relatedToolsFor, workflows, toolDataFlow } from "../src/lib/tool-discovery.ts";
import { parsePreferences, recordRecent } from "../src/lib/tool-preferences.ts";

test("every tool route is registered once and every registry entry resolves to a page", () => {
  assert.equal(new Set(toolsRegistry.map(tool => tool.id)).size, toolsRegistry.length);
  assert.equal(new Set(toolsRegistry.map(tool => tool.path)).size, toolsRegistry.length);
  for (const tool of toolsRegistry) {
    assert.ok(CATEGORIES.some(category => category === tool.category), tool.id);
    assert.ok(existsSync(new URL(`../src/app${tool.path}/page.tsx`, import.meta.url)), tool.path);
  }
  const routes = readdirSync(new URL("../src/app/tools", import.meta.url), { recursive: true })
    .map(String).filter(file => /(^|[/\\])page\.tsx$/.test(file));
  assert.equal(routes.length, toolsRegistry.length);
});
test("search reuses aliases, vendors and fuzzy matching", () => {
  assert.equal(searchTools("wildcard")[0].id, "subnet-calculator");
  assert.ok(searchTools("fortigate").some(tool => tool.id === "acl-builder"));
  assert.ok(searchTools("subneting").some(tool => tool.id === "subnet-calculator"));
  assert.equal(searchTools("zzzzunknownzzzz").length, 0);
});
test("workflows reuse real tools and related tools do not link to themselves", () => {
  for (const workflow of workflows) for (const id of workflow.toolIds) {
    assert.ok(toolsRegistry.some(tool => tool.id === id), id);
    assert.ok(relatedToolsFor(id).every(tool => tool.id !== id));
  }
  assert.ok(relatedToolsFor("acl-builder").some(tool => tool.id === "acl-simulator"));
});
test("network and PDF dependencies are excluded from the no external services filter", () => {
  const exceptions = toolsRegistry.filter(tool => toolDataFlow(tool).label !== "Local processing").map(tool => tool.id);
  assert.deepEqual(exceptions.sort(), ["dns-recon", "headers-scorecard", "hibp-check", "incident-report"].sort());
});
test("saved preferences reject invalid versions, oversized data and malformed JSON", () => {
  for (const raw of ["{", "null", JSON.stringify({ version: 2, favorites: [], recent: [] }), " ".repeat(64001)]) {
    assert.equal(parsePreferences(raw), null);
  }
});
test("saved preferences discard unknown ids and duplicates and recent visits stay bounded", () => {
  const result = parsePreferences(JSON.stringify({ version: 1, favorites: ["acl-builder", 4, "unknown", "acl-builder"], recent: ["log-parser"] }));
  assert.deepEqual(result?.favorites, ["acl-builder"]);
  assert.deepEqual(recordRecent(["log-parser", "acl-builder"], "acl-builder"), ["acl-builder", "log-parser"]);
  assert.equal(recordRecent(toolsRegistry.map(tool => tool.id), "acl-builder").length, 12);
});
