'use client';
import OrderFormPage from '@/components/order/OrderFormPage';

export default function NewHolderOrderPage() {
  return <OrderFormPage category="holder" backHref="/orders/holder" />;
}
