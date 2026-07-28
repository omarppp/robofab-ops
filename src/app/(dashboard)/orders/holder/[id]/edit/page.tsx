'use client';
import { useParams } from 'next/navigation';
import OrderFormPage from '@/components/order/OrderFormPage';

export default function EditHolderOrderPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderFormPage category="holder" orderId={id} backHref="/orders/holder" />;
}
