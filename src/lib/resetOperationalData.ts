import {
  collection, collectionGroup, getDocs, query, limit,
  writeBatch, doc, type Query, type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { ROBOFAB_MACHINES } from './seedMachines';

// ─── Owner-only production reset ───────────────────────────────────────────────
// Wipes ONLY operational data (orders + their activity subcollections, clients,
// filament stock, machines) and re-seeds the current RoboFab machine fleet.
// The `users` collection (Firebase Auth profiles / roles) is NEVER touched here.

export type ResetStep = 'activity' | 'orders' | 'clients' | 'filamentStock' | 'machines' | 'seeding';

export interface ResetResult {
  deleted: {
    activity: number;
    orders: number;
    clients: number;
    filamentStock: number;
    machines: number;
  };
  seededMachines: number;
}

async function drainQuery(base: Query<DocumentData>, batchSize = 400): Promise<number> {
  let total = 0;
  for (;;) {
    const snap = await getDocs(query(base, limit(batchSize)));
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    total += snap.docs.length;
    if (snap.docs.length < batchSize) break;
  }
  return total;
}

export async function resetOperationalData(
  onProgress?: (step: ResetStep) => void
): Promise<ResetResult> {
  onProgress?.('activity');
  const activity = await drainQuery(collectionGroup(db, 'activity'));

  onProgress?.('orders');
  const orders = await drainQuery(collection(db, 'orders'));

  onProgress?.('clients');
  const clients = await drainQuery(collection(db, 'clients'));

  onProgress?.('filamentStock');
  const filamentStock = await drainQuery(collection(db, 'filamentStock'));

  onProgress?.('machines');
  const machines = await drainQuery(collection(db, 'machines'));

  onProgress?.('seeding');
  const now = new Date().toISOString();
  const seedBatch = writeBatch(db);
  for (const m of ROBOFAB_MACHINES) {
    seedBatch.set(doc(collection(db, 'machines')), { ...m, createdAt: now, updatedAt: now });
  }
  await seedBatch.commit();

  return {
    deleted: { activity, orders, clients, filamentStock, machines },
    seededMachines: ROBOFAB_MACHINES.length,
  };
}
