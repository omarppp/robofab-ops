'use client';
import { useParams } from 'next/navigation';
import OrderFormPage from '@/components/order/OrderFormPage';

export default function EditGeneralOrderPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderFormPage category="general" orderId={id} backHref="/orders/general" />;
}
