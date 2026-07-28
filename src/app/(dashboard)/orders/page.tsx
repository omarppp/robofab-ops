'use client';
import OrderListPage from '@/components/order/OrderListPage';
import { useTranslation } from '@/hooks/useTranslation';

export default function AllOrdersPage() {
  const { t } = useTranslation();
  return <OrderListPage title={t('nav.allOrders')} showCategoryFilter />;
}
