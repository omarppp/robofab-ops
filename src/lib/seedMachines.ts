import {
  collection, getDocs, writeBatch, doc, query, limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Machine } from '@/types';

// ─── RoboFab Machine Fleet (current) ──────────────────────────────────────────

export const ROBOFAB_MACHINES: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Creality Ender 3 V3 Plus 1', type: '3D Printer', status: 'active', notes: 'Creality Ender 3 V3 Plus — وحدة 1' },
  { name: 'Creality Ender 3 V3 Plus 2', type: '3D Printer', status: 'active', notes: 'Creality Ender 3 V3 Plus — وحدة 2' },
  { name: 'Creality Ender 3 V3 Plus 3', type: '3D Printer', status: 'active', notes: 'Creality Ender 3 V3 Plus — وحدة 3' },
  { name: 'Elegoo Neptune 4 Max 1',     type: '3D Printer', status: 'active', notes: 'Elegoo Neptune 4 Max — وحدة 1' },
  { name: 'Elegoo Neptune 4 Max 2',     type: '3D Printer', status: 'active', notes: 'Elegoo Neptune 4 Max — وحدة 2' },
  { name: 'Creality Ender 3 V3',        type: '3D Printer', status: 'active', notes: 'Creality Ender 3 V3' },
  { name: 'Centuri Carbon 2',           type: '3D Printer', status: 'active', notes: 'Centuri Carbon — وحدة 2' },
];

// Previous fleet names — retired. Kept here only so the migration function
// knows what to clean up; historical orders keep their denormalized
// machineName untouched either way.
const RETIRED_MACHINE_NAMES = [
  'Centuri 1', 'Neptune Plus', 'Kobra 2 Pro', 'Neptune Max 1', 'Neptune Max 2',
  'Neptune Max 3', 'Neptune Max 4', 'Anycubic Max 3', 'Ender 3 Max Neo',
  'Neptune 3 Pro', 'Anker',
];

// ─── Auto-seed: write all machines if collection is empty ─────────────────────

export async function seedMachinesIfEmpty(): Promise<{ seeded: boolean; count: number }> {
  const snap = await getDocs(query(collection(db, 'machines'), limit(1)));

  if (!snap.empty) {
    return { seeded: false, count: 0 };
  }

  const now = new Date().toISOString();
  const batch = writeBatch(db);

  for (const machine of ROBOFAB_MACHINES) {
    const ref = doc(collection(db, 'machines'));
    batch.set(ref, {
      ...machine,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  return { seeded: true, count: ROBOFAB_MACHINES.length };
}

// ─── Safe migration: retire old-fleet docs, add any missing new-fleet docs ────
// Never touches machines that aren't part of either list (custom/manual entries
// stay exactly as they are), and never adds a machine that already exists
// (case-insensitive name match) — safe to run more than once.

export async function migrateToNewFleet(): Promise<{ removed: number; added: number }> {
  const snap = await getDocs(collection(db, 'machines'));
  const existing = snap.docs.map(d => ({ id: d.id, ...d.data() } as Machine));

  const retiredLower = RETIRED_MACHINE_NAMES.map(n => n.toLowerCase());
  const toRemove = existing.filter(m => retiredLower.includes(m.name.toLowerCase()));

  const existingLower = new Set(existing.map(m => m.name.toLowerCase()));
  const toAdd = ROBOFAB_MACHINES.filter(m => !existingLower.has(m.name.toLowerCase()));

  const now = new Date().toISOString();
  const batch = writeBatch(db);
  for (const m of toRemove) batch.delete(doc(db, 'machines', m.id));
  for (const m of toAdd) batch.set(doc(collection(db, 'machines')), { ...m, createdAt: now, updatedAt: now });
  await batch.commit();

  return { removed: toRemove.length, added: toAdd.length };
}

export function hasRetiredMachines(machines: Machine[]): boolean {
  const retiredLower = RETIRED_MACHINE_NAMES.map(n => n.toLowerCase());
  return machines.some(m => retiredLower.includes(m.name.toLowerCase()));
}
