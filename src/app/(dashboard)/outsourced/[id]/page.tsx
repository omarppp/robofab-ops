'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { BusinessBadge, Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import QuickActions from '@/components/order/QuickActions';
import { getOrder, deleteOrder } from '@/lib/firestore';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency, OUTSOURCED_STATUS_LABELS } from '@/utils/formatters';
import type { Order, OutsourcedStatus } from '@/types';

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-600 uppercase tracking-wider">{label}</span>
      <span className="text-slate-200 font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function OutsourcedOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { getOrder(id).then(o => { setOrder(o); setLoading(false); }); }, [id]);

  if (loading) return <DashboardLayout title="تفاصيل الطلب"><LoadingSpinner /></DashboardLayout>;
  if (!order) return <DashboardLayout title="تفاصيل الطلب"><p className="text-slate-500 p-6">الطلب غير موجود</p></DashboardLayout>;

  const profit = (order.sellingPrice || 0) - (order.cost || 0);
  const BackArrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <DashboardLayout title="تفاصيل طلب الطباعة الخارجية">
      <div className="max-w-4xl space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <Link href="/outsourced" className="flex items-center gap-1 text-slate-500 hover:text-slate-200 transition-colors text-sm">
            <BackArrow className="w-4 h-4" />{t('common.back')}
          </Link>
          <div className="flex gap-2">
            <Link href={`/outsourced/${id}/edit`}><Button variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>{t('common.edit')}</Button></Link>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setConfirmDelete(true)}>{t('common.delete')}</Button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">{order.orderName}</h2>
              <p className="text-slate-500 text-sm mt-1">{order.companyName} — {order.contactPerson || '—'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge label={OUTSOURCED_STATUS_LABELS[order.status as OutsourcedStatus] || order.status} className="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
              <BusinessBadge label={order.businessLabel} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Detail label="تاريخ الإرسال" value={formatDate(order.dateSent)} />
            <Detail label="التسليم المتوقع" value={formatDate(order.expectedDeliveryDate)} />
            <Detail label="التسليم الفعلي" value={formatDate(order.actualDeliveryDate)} />
            <Detail label="رقم الهاتف" value={order.clientPhone} />
          </div>
        </div>

        <QuickActions order={order} />

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-200 font-semibold mb-4">المالية</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-slate-500 text-xs mb-1">التكلفة</div>
              <div className="text-slate-100 font-bold text-lg">{formatCurrency(order.cost || 0)} ر.س</div>
            </div>
            <div className="text-center bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="text-slate-500 text-xs mb-1">سعر البيع</div>
              <div className="text-blue-400 font-bold text-lg">{formatCurrency(order.sellingPrice || 0)} ر.س</div>
            </div>
            <div className={`text-center rounded-xl p-4 border ${profit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="text-slate-500 text-xs mb-1">الربح</div>
              <div className={`font-bold text-lg ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(profit)} ر.س</div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-slate-200 font-semibold mb-2">ملاحظات</h3>
            <p className="text-slate-400 text-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </div>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={async () => { setDeleting(true); await deleteOrder(id); router.push('/outsourced'); }} loading={deleting} />
    </DashboardLayout>
  );
}
