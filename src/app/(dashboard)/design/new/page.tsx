'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DesignOrderForm from '@/components/forms/DesignOrderForm';
import { createOrder } from '@/lib/firestore';
import type { Order } from '@/types';

export default function NewDesignOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (data: Partial<Order>) => {
    setLoading(true);
    try { await createOrder(data as any); router.push('/design'); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  return (
    <DashboardLayout title="طلب تصميم جديد">
      <div className="max-w-3xl">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <DesignOrderForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
