'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderCategory } from '@/types';

export function useOrders(category?: OrderCategory) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (category) constraints.unshift(where('category', '==', category));
    const q = query(collection(db, 'orders'), ...constraints);

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return unsub;
  }, [category]);

  return { orders, loading, error };
}

export function useAllOrders() {
  return useOrders(undefined);
}
