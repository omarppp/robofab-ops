'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PrintingOrderForm from '@/components/forms/PrintingOrderForm';
import { createOrder } from '@/lib/firestore';
import type { Order } from '@/types';

export default function NewPrintingOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<Order>) => {
    setLoading(true);
    try {
      await createOrder(data as Omit<Order, 'id' | 'createdAt' | 'updatedAt'>);
      router.push('/printing');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="طلب طباعة جديد">
      <div className="max-w-3xl">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <PrintingOrderForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
