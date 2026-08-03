'use client';
import OrderFormPage from '@/components/order/OrderFormPage';

export default function NewGeneralOrderPage() {
  return <OrderFormPage category="general" backHref="/orders/general" />;
}
