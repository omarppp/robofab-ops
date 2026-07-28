'use client';
import OrderListPage from '@/components/order/OrderListPage';
import { useTranslation } from '@/hooks/useTranslation';

export default function HolderOrdersPage() {
  const { t } = useTranslation();
  return <OrderListPage category="holder" title={t('nav.holder')} newHref="/orders/holder/new" />;
}
