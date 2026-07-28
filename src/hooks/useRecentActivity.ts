'use client';
import { useState, useEffect } from 'react';
import { collectionGroup, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ActivityEntry } from '@/types';

export interface RecentActivityEntry extends ActivityEntry {
  orderId: string;
}

export function useRecentActivity(max = 15) {
  const [activities, setActivities] = useState<RecentActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collectionGroup(db, 'activity'), orderBy('timestamp', 'desc'), limit(max));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map(d => ({
        id: d.id,
        orderId: d.ref.parent.parent?.id || '',
        ...d.data(),
      } as RecentActivityEntry)));
      setLoading(false);
    }, () => {
      setActivities([]);
      setLoading(false);
    });
    return unsub;
  }, [max]);

  return { activities, loading };
}
