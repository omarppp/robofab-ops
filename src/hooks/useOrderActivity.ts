'use client';
import { useState, useEffect } from 'react';
import { subscribeToActivity } from '@/lib/activity';
import type { ActivityEntry } from '@/types';

export function useOrderActivity(orderId: string) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    const unsub = subscribeToActivity(
      orderId,
      (entries) => { setActivities(entries); setLoading(false); },
      ()        => { setActivities([]);       setLoading(false); }, // permission-denied or any error
    );

    return unsub;
  }, [orderId]);

  return { activities, loading };
}
