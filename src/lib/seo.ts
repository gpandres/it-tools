import type { ToolDefinition } from "@/lib/tools";

export const SITE_URL = "https://tools.andresgp.dev";

export function toolCanonicalUrl(tool: ToolDefinition): string {
  return new URL(tool.path, SITE_URL).toString();
}

export function toolTitle(tool: ToolDefinition): string {
  return `${tool.name} | IT Tools`;
}

export function toolStructuredData(
  tool: ToolDefinition,
  description: string,
) {
  const url = toolCanonicalUrl(tool);
  const features = [
    `${tool.name} for ${tool.category.toLowerCase()}`,
    ...tool.keywords.slice(0, 8),
    ...(tool.offline ? ["local processing", "no data upload"] : []),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#software`,
        name: tool.name,
        description,
        url,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: tool.category,
        operatingSystem: "Any",
        isAccessibleForFree: true,
        ...(features.length > 0 ? { featureList: features } : {}),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Andres",
          url: "https://andresgp.dev",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "IT Tools",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: tool.category,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.name,
            item: url,
          },
        ],
      },
    ],
  };
}

export function catalogStructuredData(tools: ToolDefinition[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: "IT Tools",
        url: SITE_URL,
        description: "Local-first tools for developers, sysadmins, DevOps and cybersecurity teams.",
        publisher: {
          "@type": "Person",
          name: "Andres",
          url: "https://andresgp.dev",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}#tool-catalogue`,
        name: "IT Tools catalogue",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: toolCanonicalUrl(tool),
        })),
      },
    ],
  };
}

export function serializeJsonLd(value: unknown): string {
  // Prevent static values from ever closing the script element if the registry grows.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
