import {
  collection, getDocs, writeBatch, doc, query, limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Machine } from '@/types';

// ─── RoboFab Machine Fleet ────────────────────────────────────────────────────

export const ROBOFAB_MACHINES: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Centuri 1',
    type: '3D Printer',
    status: 'active',
    notes: 'Centuri series — طابعة الإنتاج',
  },
  {
    name: 'Neptune Plus',
    type: '3D Printer',
    status: 'active',
    notes: 'Elegoo Neptune Plus',
  },
  {
    name: 'Kobra 2 Pro',
    type: '3D Printer',
    status: 'active',
    notes: 'Anycubic Kobra 2 Pro — طباعة عالية السرعة',
  },
  {
    name: 'Neptune Max 1',
    type: '3D Printer',
    status: 'active',
    notes: 'Elegoo Neptune Max — وحدة 1',
  },
  {
    name: 'Neptune Max 2',
    type: '3D Printer',
    status: 'active',
    notes: 'Elegoo Neptune Max — وحدة 2',
  },
  {
    name: 'Neptune Max 3',
    type: '3D Printer',
    status: 'active',
    notes: 'Elegoo Neptune Max — وحدة 3',
  },
  {
    name: 'Neptune Max 4',
    type: '3D Printer',
    status: 'active',
    notes: 'Elegoo Neptune Max — وحدة 4',
  },
  {
    name: 'Anycubic Max 3',
    type: '3D Printer',
    status: 'active',
    notes: 'Anycubic Kobra Max 3',
  },
  {
    name: 'Ender 3 Max Neo',
    type: '3D Printer',
    status: 'active',
    notes: 'Creality Ender 3 Max Neo',
  },
  {
    name: 'Neptune 3 Pro',
    type: '3D Printer',
    status: 'active',
    notes: 'Elegoo Neptune 3 Pro',
  },
  {
    name: 'Anker',
    type: '3D Printer',
    status: 'active',
    notes: 'Anker Make M5',
  },
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

// ─── Force re-seed: clears existing machines and re-creates all ───────────────
// Use this carefully — only if you need to reset the machines list completely.

export async function forceReseedMachines(): Promise<{ count: number }> {
  const existing = await getDocs(collection(db, 'machines'));
  const deleteBatch = writeBatch(db);
  existing.docs.forEach(d => deleteBatch.delete(d.ref));
  await deleteBatch.commit();

  const now = new Date().toISOString();
  const insertBatch = writeBatch(db);
  for (const machine of ROBOFAB_MACHINES) {
    const ref = doc(collection(db, 'machines'));
    insertBatch.set(ref, { ...machine, createdAt: now, updatedAt: now });
  }
  await insertBatch.commit();

  return { count: ROBOFAB_MACHINES.length };
}
