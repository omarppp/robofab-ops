'use client';
import { useEffect } from 'react';
import { initAnalytics } from '@/lib/firebase';

// Initializes Firebase Analytics once on the client side.
// Safe: the import of firebase/analytics is dynamic and never runs during SSR.
export default function AnalyticsInit() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
