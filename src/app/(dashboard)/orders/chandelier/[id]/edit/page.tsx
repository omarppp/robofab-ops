'use client';
import { useParams } from 'next/navigation';
import OrderFormPage from '@/components/order/OrderFormPage';

export default function EditChandelierOrderPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderFormPage category="chandelier" orderId={id} backHref="/orders/chandelier" />;
}
