'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderSection } from '@/types';

export function useOrders(section?: OrderSection) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (section) constraints.unshift(where('section', '==', section));
    const q = query(collection(db, 'orders'), ...constraints);

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return unsub;
  }, [section]);

  return { orders, loading, error };
}

export function useAllOrders() {
  return useOrders(undefined);
}
