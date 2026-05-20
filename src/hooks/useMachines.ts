'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Machine } from '@/types';

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'machines'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMachines(snap.docs.map(d => ({ id: d.id, ...d.data() } as Machine)));
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { machines, loading, error };
}
