import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

// Serve only the installed modelling engine, never user-supplied paths or data.
export async function GET(_request: Request, context: { params: Promise<{ asset: string }> }) {
  const { asset } = await context.params;
  if (asset !== "manifold.js" && asset !== "manifold.wasm") return new Response("Not found", { status: 404 });
  const filename = asset === "manifold.js"
    ? path.join(process.cwd(), "node_modules/manifold-3d/manifold.js")
    : path.join(process.cwd(), "node_modules/manifold-3d/manifold.wasm");
  const content = await readFile(filename);
  return new Response(content, { headers: {
    "Content-Type": asset.endsWith(".wasm") ? "application/wasm" : "text/javascript; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  } });
}
