'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FilamentStock } from '@/types';

export function useFilamentStock() {
  const [filaments, setFilaments] = useState<FilamentStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'filamentStock'), orderBy('filamentName', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setFilaments(snap.docs.map(d => ({ id: d.id, ...d.data() } as FilamentStock)));
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { filaments, loading, error };
}
