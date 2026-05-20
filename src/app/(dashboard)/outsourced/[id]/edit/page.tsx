'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OutsourcedOrderForm from '@/components/forms/OutsourcedOrderForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getOrder, updateOrder } from '@/lib/firestore';
import type { Order } from '@/types';

export default function EditOutsourcedOrderPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { getOrder(id).then(o => { setOrder(o); setFetching(false); }); }, [id]);

  const handleSubmit = async (data: Partial<Order>) => {
    setLoading(true);
    try { await updateOrder(id, data); router.push(`/outsourced/${id}`); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (fetching) return <DashboardLayout title="تعديل الطلب"><LoadingSpinner /></DashboardLayout>;
  if (!order) return <DashboardLayout title="تعديل الطلب"><p className="text-slate-400">الطلب غير موجود</p></DashboardLayout>;
  return (
    <DashboardLayout title="تعديل طلب الطباعة الخارجية">
      <div className="max-w-3xl"><div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><OutsourcedOrderForm initial={order} onSubmit={handleSubmit} loading={loading} /></div></div>
    </DashboardLayout>
  );
}
