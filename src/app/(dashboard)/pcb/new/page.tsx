'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PCBOrderForm from '@/components/forms/PCBOrderForm';
import { createOrder } from '@/lib/firestore';
import type { Order } from '@/types';

export default function NewPCBOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (data: Partial<Order>) => {
    setLoading(true);
    try { await createOrder(data as any); router.push('/pcb'); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  return (
    <DashboardLayout title="طلب طباعة PCB جديد">
      <div className="max-w-3xl"><div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><PCBOrderForm onSubmit={handleSubmit} loading={loading} /></div></div>
    </DashboardLayout>
  );
}
