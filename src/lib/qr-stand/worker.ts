import type { ManifoldToplevel } from "manifold-3d";
import { buildStand, type StandConfig } from "./model";

let engine: Promise<ManifoldToplevel> | undefined;
self.onmessage = async (event: MessageEvent<StandConfig>) => {
  try {
    engine ??= (async () => {
      const url = new URL("/api/stand-engine/manifold.js", self.location.origin).href;
      const library = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
      const instance = await library.default({ locateFile: () => "/api/stand-engine/manifold.wasm" }) as ManifoldToplevel;
      instance.setup();
      return instance;
    })();
    const model = buildStand(await engine, event.data);
    self.postMessage({ model });
  } catch (error) {
    engine = undefined;
    self.postMessage({ error: error instanceof Error ? error.message : "Model generation failed. Try again." });
  }
};
