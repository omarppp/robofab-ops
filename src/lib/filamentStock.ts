import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FilamentStock } from '@/types';
import { sanitizeForFirestore } from '@/utils/sanitize';

export async function createFilament(data: Omit<FilamentStock, 'id' | 'createdAt' | 'updatedAt'>) {
  const payload = sanitizeForFirestore({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(db, 'filamentStock'), payload as Record<string, unknown>);
  return ref.id;
}

export async function updateFilament(id: string, data: Partial<FilamentStock>) {
  await updateDoc(
    doc(db, 'filamentStock', id),
    sanitizeForFirestore({ ...data, updatedAt: new Date().toISOString() }) as Record<string, unknown>
  );
}

export async function deleteFilament(id: string) {
  await deleteDoc(doc(db, 'filamentStock', id));
}

export async function getFilaments(): Promise<FilamentStock[]> {
  const snap = await getDocs(query(collection(db, 'filamentStock'), orderBy('filamentName', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FilamentStock));
}
