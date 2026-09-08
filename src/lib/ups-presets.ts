export type UpsPreset = {
  id: string;
  vendor: string;
  model: string;
  rating: string;
  battery: string;
  voltage: number;
  capacityAh: number;
  batteries: number;
  topology: "parallel" | "series";
  note: string;
};

/** Common market models from manufacturer specifications; not a global sales ranking. */
export const UPS_PRESETS: readonly UpsPreset[] = [
  {
    id: "apc-bx1600mi",
    vendor: "APC",
    model: "Back-UPS BX1600MI",
    rating: "1600 VA",
    battery: "2 × 12 V / 7 Ah",
    voltage: 12,
    capacityAh: 7,
    batteries: 2,
    topology: "series",
    note: "Regional outlet variants may differ.",
  },
  {
    id: "cyberpower-cp1500epfclcd",
    vendor: "CyberPower",
    model: "CP1500EPFCLCD",
    rating: "1500 VA / 900 W",
    battery: "2 × 12 V / 9 Ah (RBP0016)",
    voltage: 12,
    capacityAh: 9,
    batteries: 2,
    topology: "series",
    note: "230 V EU model; outlet variants differ by region.",
  },
  {
    id: "eaton-5sc1000i",
    vendor: "Eaton",
    model: "5SC1000I",
    rating: "1000 VA / 700 W",
    battery: "2 × 12 V / 9 Ah",
    voltage: 12,
    capacityAh: 9,
    batteries: 2,
    topology: "series",
    note: "230 V line-interactive tower model.",
  },
  {
    id: "eaton-5sc1500i",
    vendor: "Eaton",
    model: "5SC1500I",
    rating: "1500 VA / 1050 W",
    battery: "3 × 12 V / 9 Ah",
    voltage: 12,
    capacityAh: 9,
    batteries: 3,
    topology: "series",
    note: "230 V line-interactive tower model.",
  },
];
