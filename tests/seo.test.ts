import assert from "node:assert/strict";
import test from "node:test";
import { catalogStructuredData, serializeJsonLd, toolCanonicalUrl, toolStructuredData, toolTitle } from "../src/lib/seo.ts";
import { toolsRegistry } from "../src/lib/tools.ts";

test("tool SEO data uses canonical registry URLs and readable titles", () => {
  const tool = toolsRegistry.find(item => item.id === "subnet-calculator");
  assert.ok(tool);
  assert.equal(toolTitle(tool), "Subnetting Calculator | IT Tools");
  assert.equal(toolCanonicalUrl(tool), "https://tools.andresgp.dev/tools/network/subnet");

  const structuredData = toolStructuredData(tool, tool.description);
  const software = structuredData["@graph"].find(item => item["@type"] === "SoftwareApplication") as { url?: string; name?: string } | undefined;
  assert.equal(software?.url, toolCanonicalUrl(tool));
  assert.equal(software?.name, tool.name);
});

test("catalog SEO data exposes every registered tool once", () => {
  const structuredData = catalogStructuredData(toolsRegistry);
  const catalogue = structuredData["@graph"].find(item => item["@type"] === "ItemList");
  assert.equal(catalogue?.numberOfItems, toolsRegistry.length);
  assert.equal(catalogue?.itemListElement.length, toolsRegistry.length);
  assert.equal(new Set(catalogue?.itemListElement.map(item => item.url)).size, toolsRegistry.length);
  assert.doesNotThrow(() => JSON.parse(serializeJsonLd(structuredData)));
});
