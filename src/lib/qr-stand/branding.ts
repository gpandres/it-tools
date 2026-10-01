import type { Bitmap, StandMode } from "./model";

export type NfcArtwork = { style: "text" | "logo"; title: string; instruction: string };

export async function createBranding(name: string, caption: string, logo: string | null, mode: StandMode, nfc: NfcArtwork): Promise<Bitmap> {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = mode === "nfc" ? 210 : 46;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser could not prepare the logo.");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  const text = (value: string, x: number, y: number, size: number, maxWidth: number, center = false) => {
    ctx.textAlign = center ? "center" : "left";
    ctx.font = `bold ${size}px monospace`;
    while (ctx.measureText(value).width > maxWidth && size > 6) ctx.font = `bold ${--size}px monospace`;
    ctx.fillText(value, x, y);
  };
  const offset = canvas.height - 46;
  let image: HTMLImageElement | undefined;
  if (logo) { image = new Image(); image.src = logo; await image.decode(); }
  const drawLogo = (x: number, y: number, width: number, height: number) => {
    if (!image) return;
    const scale = Math.min(width / image.width, height / image.height);
    ctx.drawImage(image, x + (width - image.width * scale) / 2, y + (height - image.height * scale) / 2, image.width * scale, image.height * scale);
  };
  if (mode === "nfc") {
    if (nfc.style === "logo") {
      if (!image) throw new Error("Upload a logo to use it as the main NFC artwork.");
      drawLogo(25, 4, 130, 106);
    } else text(nfc.title, 90, 70, 48, 175, true);
    text(nfc.instruction, 90, 139, 16, 175, true);
  }
  if (image && !(mode === "nfc" && nfc.style === "logo")) {
    drawLogo(0, offset + 3, 40, 40);
    text(name, 46, offset + 18, 14, 133);
    text(caption, 46, offset + 36, 11, 133);
  } else {
    text(name, 90, offset + 18, 17, 178, true);
    text(caption, 90, offset + 38, 12, 178, true);
  }
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const pixels = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < pixels.length; i++) pixels[i] = (rgba[i * 4] * 0.2126 + rgba[i * 4 + 1] * 0.7152 + rgba[i * 4 + 2] * 0.0722) < 160 ? 1 : 0;
  return { width: canvas.width, height: canvas.height, pixels };
}

export async function readLogo(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error("Choose a PNG, JPEG or SVG under 2 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.width * image.height > 16_000_000 || !image.width || !image.height) throw new Error("Use an image smaller than 16 megapixels.");
    // Normalize uploads to a small raster. SVG markup is never inserted into the page.
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 512 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is unavailable.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally { URL.revokeObjectURL(url); }
}
