import { zipSync, strToU8 } from "fflate";
import { binaryStl, DESIGNS, qrPayload, type StandConfig, type StandModel } from "./model";

export function printInstructions(config: StandConfig, model: StandModel): string {
  const lines = [
    `QR & NFC Stand Builder — ${DESIGNS[config.design].name}`,
    "", "All STL units are millimetres. Import at 100% scale.",
    `Plate: 110 x 145 x ${model.plateThickness.toFixed(1)} mm + 0.6 mm raised artwork.`,
    `Print parts flat on Z=0. Use a light plate and change to dark filament after Z=${model.plateThickness.toFixed(1)} mm for the artwork. Use 0.2 mm layers. STL does not store colors.`,
    "", `Slide the plate into the base slot. Total slot clearance: ${config.clearance} mm. Check the fit before forcing parts together.`,
  ];
  if (model.pauseHeight !== null) {
    lines.push("", "EMBEDDED NFC — INSERT DURING PRINTING",
      `Insert dimensions: ${config.cardWidth} x ${config.cardHeight} x ${config.cardThickness} mm. The cavity has ${config.clearance} mm total XY clearance; its height is rounded up to a 0.2 mm layer.`,
      `In your slicer add a pause AFTER finishing Z=${model.pauseHeight.toFixed(1)} mm, BEFORE the first layer closing the cavity (Z=${(model.pauseHeight + 0.2).toFixed(1)} mm at 0.2 mm layers).`,
      "Check this transition in the slicer preview, especially if using adaptive or different first layers. STL does not contain pauses or printer-specific G-code.",
      "Disable supports inside the NFC cavity. Program and test the NFC insert first. During the pause, place it flat inside the recess, below the printed rim, and resume. The roof seals it permanently.",
      "Use only an NFC insert and casing rated for your printing temperatures. Ordinary plastic cards can warp. Check clearance from the nozzle and use a printer-appropriate pause command.",
      "This sealed version cannot be opened to replace the card. Use the separate pocket for access after printing.");
  } else if (model.pocket) {
    lines.push("", `NFC POCKET — ${config.cardWidth} x ${config.cardHeight} x ${config.cardThickness} mm card + ${config.clearance} mm total clearance.`,
      "Glue ONLY the two side rail rims and bottom rim to the BACK of the plate, with the opening aligned to its top edge. Keep glue out of the cavity. Insert the card from above after the glue cures. The rear notch provides finger access.");
  }
  if (config.mode !== "qr") lines.push("", "Program NFC separately with your phone. This tool does not write the chip. Use a URL record for links or a compatible Wi-Fi record for network access; phone support varies. Test reading through the finished plate. NFC hardware is not included.");
  if (config.mode !== "nfc") {
    lines.push("", config.content.type === "wifi" ? "QR content: Wi-Fi credentials (password is encoded in the geometry; not repeated in this file)." : `QR target: ${qrPayload(config.content)}`,
      `QR module: ${model.moduleSize.toFixed(2)} mm, four-module quiet margin, correction M. Scan the printed code before using it with customers.`);
  }
  lines.push("", "Digitally checked geometry; not physically print-tested. Verify slicer preview, fit, stability and reading with your printer and phone.");
  return lines.join("\n");
}

export function createPrintKit(config: StandConfig, model: StandModel): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "plate.stl": binaryStl(model.printablePlate),
    [`${config.design}-base.stl`]: binaryStl(model.base),
    "assembly.txt": strToU8(printInstructions(config, model)),
  };
  if (model.pocket) files["nfc-pocket.stl"] = binaryStl(model.pocket);
  return zipSync(files);
}
