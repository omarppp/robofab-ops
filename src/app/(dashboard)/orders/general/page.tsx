'use client';
import OrderListPage from '@/components/order/OrderListPage';
import { useTranslation } from '@/hooks/useTranslation';

export default function GeneralOrdersPage() {
  const { t } = useTranslation();
  return <OrderListPage category="general" title={t('nav.general')} newHref="/orders/general/new" />;
}
