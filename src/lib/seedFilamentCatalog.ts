import type { MaterialType } from '@/types';

// ─── FG Filament catalog — reference data only ─────────────────────────────────
// Extracted from the uploaded FabriGate PDF. This is a REFERENCE list used to
// help fill in the "Add Filament" form quickly — it is never written to
// Firestore automatically. Nothing here touches the database on its own.

export interface CatalogEntry {
  filamentName: string;
  materialType: MaterialType;
  colorName: string;
  costPerKg: number;
}

const PLA_PLUS_COLORS = [
  'Black', 'White', 'Coffee Brown', 'Grey', 'Red', 'Chocolate', 'Cyan', 'Transparent',
  'Green', 'Klein Blue', 'Yellow', 'Lavender Purple', 'Magenta', 'Oak', 'Beige',
  'Sunny Orange', 'Bone White', 'Silver', 'Sakura Pink',
];
const PLA_META_COLORS = ['Sky Blue', 'Sakura Pink', 'Mint Green', 'Lemon Yellow', 'Chocolate', 'Taro Purple', 'Olive Green'];
const PLA_MATTE_COLORS = ['Green', 'Clay', 'Light Blue', 'Matte Black'];
const SILK_PLA_PLUS_COLORS = ['Light Gold', 'Silver', 'Red Copper', 'Purple'];
const PLA_MARBLE_COLORS = ['Ashen Concrete', 'Shadow Storm', 'Oreo', 'Chestnut Brown', 'Forest Green', 'Brick Red'];
const PETG_COLORS = ['Black', 'White', 'Grey', 'Transparent'];
const ABS_COLORS = ['Black'];
const TPU_COLORS = ['Black'];

export const FILAMENT_CATALOG: CatalogEntry[] = [
  ...PLA_PLUS_COLORS.map(colorName => ({ filamentName: 'PLA+', materialType: 'PLA' as MaterialType, colorName, costPerKg: 800 })),
  ...PLA_META_COLORS.map(colorName => ({ filamentName: 'PLA Meta', materialType: 'PLA' as MaterialType, colorName, costPerKg: 850 })),
  ...PLA_MATTE_COLORS.map(colorName => ({ filamentName: 'PLA Matte', materialType: 'PLA' as MaterialType, colorName, costPerKg: 850 })),
  ...SILK_PLA_PLUS_COLORS.map(colorName => ({ filamentName: 'Silk PLA+', materialType: 'PLA' as MaterialType, colorName, costPerKg: 850 })),
  ...PLA_MARBLE_COLORS.map(colorName => ({ filamentName: 'PLA Marble', materialType: 'PLA' as MaterialType, colorName, costPerKg: 950 })),
  ...PETG_COLORS.map(colorName => ({ filamentName: 'PETG', materialType: 'PETG' as MaterialType, colorName, costPerKg: 800 })),
  ...ABS_COLORS.map(colorName => ({ filamentName: 'ABS', materialType: 'ABS' as MaterialType, colorName, costPerKg: 800 })),
  ...TPU_COLORS.map(colorName => ({ filamentName: 'TPU', materialType: 'TPU' as MaterialType, colorName, costPerKg: 1350 })),
];

// Grouped by filament line, for a browsable reference panel.
export function groupCatalogByFilament(): Record<string, CatalogEntry[]> {
  const groups: Record<string, CatalogEntry[]> = {};
  for (const entry of FILAMENT_CATALOG) {
    (groups[entry.filamentName] ||= []).push(entry);
  }
  return groups;
}
