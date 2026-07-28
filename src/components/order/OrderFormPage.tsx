'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderForm from '@/components/forms/OrderForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getOrder } from '@/lib/firestore';
import { createOrderWithStock, updateOrderWithStock } from '@/lib/orders';
import { useTranslation } from '@/hooks/useTranslation';
import type { Order, OrderCategory } from '@/types';

interface Props {
  category: OrderCategory;
  orderId?: string;
  backHref: string;
}

export default function OrderFormPage({ category, orderId, backHref }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId).then(o => { setOrder(o); setFetching(false); });
  }, [orderId]);

  const handleSubmit = async (data: Partial<Order>) => {
    setLoading(true);
    try {
      if (orderId && order) {
        await updateOrderWithStock(orderId, data, order);
        router.push(`${backHref}/${orderId}`);
      } else {
        const result = await createOrderWithStock(data as Omit<Order, 'id' | 'createdAt' | 'updatedAt'>);
        router.push(`${backHref}/${result.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const title = orderId ? t('common.edit') : t('order.new');

  if (fetching) return <DashboardLayout title={title}><LoadingSpinner /></DashboardLayout>;
  if (orderId && !order) return <DashboardLayout title={title}><p className="text-slate-400 p-6">{t('detail.notFound')}</p></DashboardLayout>;

  return (
    <DashboardLayout title={title}>
      <div className="max-w-3xl">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <OrderForm category={category} initial={order || undefined} onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
