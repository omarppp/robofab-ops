'use client';
import OrderListPage from '@/components/order/OrderListPage';
import { useTranslation } from '@/hooks/useTranslation';

export default function ChandelierOrdersPage() {
  const { t } = useTranslation();
  return <OrderListPage category="chandelier" title={t('nav.chandelier')} newHref="/orders/chandelier/new" />;
}
