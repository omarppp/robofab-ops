import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, Timestamp,
  serverTimestamp, writeBatch, limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Order, Machine, Client, AppUser } from '@/types';
import { sanitizeForFirestore } from '@/utils/sanitize';

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  const payload = sanitizeForFirestore({
    ...data,
    remainingAmount: (data.price || 0) - (data.paidAmount || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(db, 'orders'), payload as Record<string, unknown>);
  return ref.id;
}

export async function updateOrder(id: string, data: Partial<Order>) {
  const ref = doc(db, 'orders', id);
  const raw: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  if (data.price !== undefined || data.paidAmount !== undefined) {
    raw.remainingAmount = (data.price ?? 0) - (data.paidAmount ?? 0);
  }
  await updateDoc(ref, sanitizeForFirestore(raw) as Record<string, unknown>);
}

export async function deleteOrder(id: string) {
  await deleteDoc(doc(db, 'orders', id));
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export async function getOrders(section?: string): Promise<Order[]> {
  let q = section
    ? query(collection(db, 'orders'), where('section', '==', section), orderBy('createdAt', 'desc'))
    : query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrdersByMonth(year: number, month: number): Promise<Order[]> {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
  const q = query(
    collection(db, 'orders'),
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

// ─── Machines ────────────────────────────────────────────────────────────────

export async function createMachine(data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) {
  const payload = sanitizeForFirestore({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(db, 'machines'), payload as Record<string, unknown>);
  return ref.id;
}

export async function updateMachine(id: string, data: Partial<Machine>) {
  await updateDoc(
    doc(db, 'machines', id),
    sanitizeForFirestore({ ...data, updatedAt: new Date().toISOString() }) as Record<string, unknown>
  );
}

export async function deleteMachine(id: string) {
  await deleteDoc(doc(db, 'machines', id));
}

export async function getMachines(): Promise<Machine[]> {
  const snap = await getDocs(query(collection(db, 'machines'), orderBy('name', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Machine));
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
  const payload = sanitizeForFirestore({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(db, 'clients'), payload as Record<string, unknown>);
  return ref.id;
}

export async function updateClient(id: string, data: Partial<Client>) {
  await updateDoc(
    doc(db, 'clients', id),
    sanitizeForFirestore({ ...data, updatedAt: new Date().toISOString() }) as Record<string, unknown>
  );
}

export async function deleteClient(id: string) {
  await deleteDoc(doc(db, 'clients', id));
}

export async function getClients(): Promise<Client[]> {
  const snap = await getDocs(query(collection(db, 'clients'), orderBy('name', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getOrCreateUser(uid: string, email: string, displayName: string): Promise<AppUser> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() } as AppUser;
  const newUser: Omit<AppUser, 'id'> = {
    email,
    displayName: displayName || email,
    role: 'staff',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  const cleanUser = sanitizeForFirestore(newUser) as Record<string, unknown>;
  await updateDoc(ref, cleanUser).catch(() =>
    addDoc(collection(db, 'users'), { id: uid, ...cleanUser })
  );
  return { id: uid, ...newUser };
}

export async function setUserDoc(uid: string, data: Partial<AppUser>) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, sanitizeForFirestore(data) as Record<string, unknown>);
  } else {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, sanitizeForFirestore({ ...data, createdAt: new Date().toISOString() }) as Record<string, unknown>);
  }
}
