import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { ActivityEntry } from '@/types';
import { sanitizeForFirestore } from '@/utils/sanitize';

export async function logActivity(
  orderId: string,
  entry: Omit<ActivityEntry, 'id'>
): Promise<void> {
  await addDoc(
    collection(db, 'orders', orderId, 'activity'),
    sanitizeForFirestore(entry) as Record<string, unknown>
  );
}

export function subscribeToActivity(
  orderId: string,
  callback: (entries: ActivityEntry[]) => void,
  onError?: () => void
): () => void {
  const q = query(
    collection(db, 'orders', orderId, 'activity'),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(
    q,
    snap => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityEntry))); },
    (err: unknown) => {
      const fbErr = err as { code?: string };
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Activity] onSnapshot error:', fbErr.code);
      }
      // Silently resolve — missing subcollection rule should not crash the page
      onError?.();
    }
  );
}
