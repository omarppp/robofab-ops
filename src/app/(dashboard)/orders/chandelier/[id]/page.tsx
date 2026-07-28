'use client';
import { useParams } from 'next/navigation';
import OrderDetailPage from '@/components/order/OrderDetailPage';

export default function ChandelierOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderDetailPage id={id} backHref="/orders/chandelier" />;
}
