import QRCode from "qrcode";
import type { Manifold, ManifoldToplevel, Vec3 } from "manifold-3d";

export type StandDesign = "wedge" | "plinth" | "easel";
export type StandMode = "qr" | "nfc" | "both";
export type NfcMount = "pocket" | "embedded";
export type QrContent = { type: "url"; url: string } | { type: "wifi"; ssid: string; password: string; security: "WPA" | "WEP" | "nopass"; hidden: boolean };
export type Bitmap = { width: number; height: number; pixels: Uint8Array };
export type StandConfig = {
  design: StandDesign;
  mode: StandMode;
  content: QrContent;
  nfcMount: NfcMount;
  cardWidth: number;
  cardHeight: number;
  cardThickness: number;
  clearance: number;
  branding: Bitmap;
};
export type SolidMesh = { positions: Float32Array; indices: Uint32Array };
export type StandModel = {
  plate: SolidMesh;
  relief: SolidMesh;
  printablePlate: SolidMesh;
  base: SolidMesh;
  pocket?: SolidMesh;
  cavityPreview?: SolidMesh;
  plateThickness: number;
  pauseHeight: number | null;
  angle: number;
  moduleSize: number;
  pocketWidth: number;
  pocketHeight: number;
  pocketDepth: number;
  volume: number;
};

export const DESIGNS = {
  wedge: { name: "Wedge", description: "A solid, inclined counter stand.", angle: 70 },
  plinth: { name: "Plinth", description: "An upright sign on a compact base.", angle: 90 },
  easel: { name: "Easel", description: "An open frame with two side supports.", angle: 75 },
} as const;

const escapeWifi = (value: string) => value.replace(/[\\;,:\"]/g, "\\$&");
export function qrPayload(content: QrContent): string {
  if (content.type === "url") return content.url.trim();
  return `WIFI:T:${content.security};S:${escapeWifi(content.ssid)};${content.security === "nopass" ? "" : `P:${escapeWifi(content.password)};`}H:${content.hidden};;`;
}

export function plateDimensions(config: Pick<StandConfig, "mode" | "nfcMount" | "cardThickness" | "clearance">) {
  const embedded = config.mode !== "qr" && config.nfcMount === "embedded";
  // Align the floor, cavity roof and color change to a 0.2 mm layer grid.
  const cavityDepth = Math.ceil((config.cardThickness + config.clearance - 1e-8) / 0.2) * 0.2;
  const pauseHeight = embedded ? Number((1.2 + cavityDepth).toFixed(1)) : null;
  return { plateThickness: pauseHeight === null ? 3 : Number((pauseHeight + 1.2).toFixed(1)), pauseHeight };
}

export function validateConfig(config: StandConfig): string | null {
  if (!(config.design in DESIGNS) || !["qr", "nfc", "both"].includes(config.mode)) return "Choose a stand and a mode.";
  if (config.mode !== "nfc") {
    if (config.content.type === "url") {
      try { const url = new URL(config.content.url); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); }
      catch { return "Enter a complete http:// or https:// review link."; }
    } else {
      if (!config.content.ssid || new TextEncoder().encode(config.content.ssid).length > 32) return "Enter a Wi-Fi network name of 1–32 UTF-8 bytes.";
      if (config.content.security !== "nopass" && !config.content.password) return "Enter the Wi-Fi password, or choose an open network.";
    }
    if (new TextEncoder().encode(qrPayload(config.content)).length > 500) return "QR content must fit within 500 UTF-8 bytes. Shorten the link or network details.";
  }
  if (!Number.isFinite(config.clearance) || config.clearance < 0.2 || config.clearance > 1) return "Clearance must be between 0.2 and 1 mm.";
  if (config.mode !== "qr" && (!Number.isFinite(config.cardWidth) || config.cardWidth < 20 || config.cardWidth > 90 || !Number.isFinite(config.cardHeight) || config.cardHeight < 20 || config.cardHeight > 65 || !Number.isFinite(config.cardThickness) || config.cardThickness < 0.5 || config.cardThickness > 3)) return "NFC dimensions: width 20–90 mm, height 20–65 mm, thickness 0.5–3 mm.";
  if (config.mode !== "qr" && !["pocket", "embedded"].includes(config.nfcMount)) return "Choose an NFC mounting method.";
  return null;
}

/** All printable solids are in millimetres, Z up, with their flat side on Z=0. */
export function buildStand(engine: ManifoldToplevel, config: StandConfig): StandModel {
  const error = validateConfig(config);
  if (error) throw new Error(error);
  const { Manifold: M } = engine;
  const allocated: Manifold[] = [];
  const keep = (solid: Manifold) => { allocated.push(solid); return solid; };
  const box = (size: Vec3, position: Vec3 = [0, 0, 0]) => keep(keep(M.cube(size)).translate(position));
  const union = (solids: Manifold[]) => keep(M.union(solids));
  const mesh = (solid: Manifold): SolidMesh => {
    if (solid.status() !== "NoError" || solid.isEmpty()) throw new Error("Could not build a closed printable solid.");
    // Remove sub-micron CSG edges before converting to STL's float32 coordinates.
    const simplified = keep(solid.simplify(0.001));
    const result = simplified.getMesh();
    return { positions: new Float32Array(result.vertProperties), indices: new Uint32Array(result.triVerts) };
  };
  try {
    const { plateThickness, pauseHeight } = plateDimensions(config);
    let plate = box([110, 145, plateThickness], [-55, 0, 0]);
    let cavityPreview: Manifold | undefined;
    if (pauseHeight !== null) {
      const cavity = box([config.cardWidth + config.clearance, config.cardHeight + config.clearance, pauseHeight - 1.2], [-(config.cardWidth + config.clearance) / 2, 100 - (config.cardHeight + config.clearance) / 2, 1.2]);
      plate = keep(plate.subtract(cavity));
      cavityPreview = keep(plate.intersect(box([110, 145, pauseHeight], [-55, 0, 0])));
    }
    const marks: Manifold[] = [];
    // Row strips penetrate the plate by 0.05 mm. A 0.02 mm separation avoids
    // zero-width corner contacts between diagonal pixels in the STL mesh.
    const raster = (bitmap: Bitmap, x: number, y: number, width: number, height: number) => {
      for (let row = 0; row < bitmap.height; row++) {
        for (let col = 0; col < bitmap.width;) {
          if (!bitmap.pixels[row * bitmap.width + col]) { col++; continue; }
          const start = col;
          while (col < bitmap.width && bitmap.pixels[row * bitmap.width + col]) col++;
          marks.push(box([(col - start) * width / bitmap.width - 0.02, height / bitmap.height - 0.02, 0.65], [x + start * width / bitmap.width + 0.01, y + (bitmap.height - row - 1) * height / bitmap.height + 0.01, plateThickness - 0.05]));
        }
      }
    };
    let moduleSize = 0;
    if (config.mode !== "nfc") {
      const qr = QRCode.create(qrPayload(config.content), { errorCorrectionLevel: "M" });
      const size = qr.modules.size;
      moduleSize = 80 / (size + 8);
      if (moduleSize < 0.8) throw new Error("This link makes the QR too dense for this plate. Use a shorter link.");
      raster({ width: size, height: size, pixels: qr.modules.data }, -40 + 4 * moduleSize, 60 + 4 * moduleSize, size * moduleSize, size * moduleSize);
    }
    raster(config.branding, -45, 35, 90, config.mode === "nfc" ? 100 : 22);
    if (!marks.length) throw new Error("Add a business name or a logo.");
    const relief = union(marks);
    const printablePlate = union([plate, relief]);
    const angle = DESIGNS[config.design].angle;
    const slot = keep(keep(box([110 + config.clearance, 160, plateThickness + config.clearance], [-55 - config.clearance / 2, -0.05, -config.clearance / 2]).rotate([angle, 0, 0])).translate([0, 0, 4]));
    let base: Manifold;
    if (config.design === "plinth") {
      base = box([120, 65, 20], [-60, -25, 0]);
    } else if (config.design === "wedge") {
      base = keep(M.hull([[-60, -25, 0], [60, -25, 0], [-60, 65, 0], [60, 65, 0], [-60, -5, 32], [60, -5, 32], [-60, 35, 32], [60, 35, 32]]));
    } else {
      const rails = [-55, 47].map(x => keep(M.hull([[x, -10, 3], [x + 8, -10, 3], [x, 60, 3], [x + 8, 60, 3], [x, 18, 55], [x + 8, 18, 55]])));
      base = union([box([120, 85, 4], [-60, -20, 0]), ...rails]);
    }
    base = keep(base.subtract(slot));
    let pocket: Manifold | undefined;
    const pocketWidth = config.cardWidth + config.clearance + 4;
    const pocketHeight = config.cardHeight + config.clearance + 2;
    const pocketDepth = config.cardThickness + config.clearance + 1.2;
    if (config.mode !== "qr" && config.nfcMount === "pocket") {
      // U-shaped pocket: flat back, two rails and a bottom stop. Open at the top.
      const blank = box([pocketWidth, pocketHeight, pocketDepth]);
      const cavity = box([pocketWidth - 4, pocketHeight, pocketDepth], [2, 2, 1.2]);
      pocket = keep(blank.subtract(cavity));
      // Finger access on the back; the side rails retain their full height.
      pocket = keep(pocket.subtract(box([pocketWidth - 12, 10, 2], [6, pocketHeight - 8, -0.1])));
    }
    return { plate: mesh(plate), relief: mesh(relief), printablePlate: mesh(printablePlate), base: mesh(base), pocket: pocket ? mesh(pocket) : undefined, cavityPreview: cavityPreview ? mesh(cavityPreview) : undefined, plateThickness, pauseHeight, angle, moduleSize, pocketWidth, pocketHeight, pocketDepth, volume: printablePlate.volume() + base.volume() + (pocket?.volume() ?? 0) };
  } finally {
    for (let i = allocated.length - 1; i >= 0; i--) allocated[i].delete();
  }
}

export function binaryStl(mesh: SolidMesh): Uint8Array {
  const triangles = mesh.indices.length / 3;
  const buffer = new ArrayBuffer(84 + triangles * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triangles, true);
  for (let tri = 0; tri < triangles; tri++) {
    const vertices = [0, 1, 2].map(corner => {
      const start = mesh.indices[tri * 3 + corner] * 3;
      return mesh.positions.subarray(start, start + 3);
    });
    const [a, b, c] = vertices;
    const u = b.map((v, i) => v - a[i]);
    const v = c.map((value, i) => value - a[i]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const length = Math.hypot(...n) || 1;
    const values = [...n.map(value => value / length), ...a, ...b, ...c];
    values.forEach((value, index) => view.setFloat32(84 + tri * 50 + index * 4, value, true));
  }
  return new Uint8Array(buffer);
}
