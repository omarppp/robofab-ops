'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { BusinessBadge, Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getOrder, deleteOrder } from '@/lib/firestore';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency, OUTSOURCED_STATUS_LABELS } from '@/utils/formatters';
import type { Order, OutsourcedStatus } from '@/types';

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="flex flex-col gap-1"><span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span><span className="text-slate-900 font-medium">{value ?? '—'}</span></div>;
}

export default function OutsourcedOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { getOrder(id).then(o => { setOrder(o); setLoading(false); }); }, [id]);

  if (loading) return <DashboardLayout title="تفاصيل الطلب"><LoadingSpinner /></DashboardLayout>;
  if (!order) return <DashboardLayout title="تفاصيل الطلب"><p className="text-slate-500 p-6">الطلب غير موجود</p></DashboardLayout>;

  const profit = (order.sellingPrice || 0) - (order.cost || 0);

  return (
    <DashboardLayout title="تفاصيل طلب الطباعة الخارجية">
      <div className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/outsourced" className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm"><ArrowRight className="w-4 h-4" />العودة</Link>
          <div className="flex gap-2">
            <Link href={`/outsourced/${id}/edit`}><Button variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>تعديل</Button></Link>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setConfirmDelete(true)}>حذف</Button>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{order.orderName}</h2>
              <p className="text-slate-500 text-sm mt-1">{order.companyName} — {order.contactPerson || '—'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge label={OUTSOURCED_STATUS_LABELS[order.status as OutsourcedStatus] || order.status} className="bg-blue-50 text-blue-700 border border-blue-200" />
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
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">المالية</h3>
          <div className="grid grid-cols-3 gap-5">
            <div className="text-center bg-slate-50 border border-slate-100 rounded-xl p-4"><div className="text-slate-500 text-xs mb-1">التكلفة</div><div className="text-slate-900 font-bold text-lg">{formatCurrency(order.cost || 0)} ر.س</div></div>
            <div className="text-center bg-blue-50 border border-blue-100 rounded-xl p-4"><div className="text-slate-500 text-xs mb-1">سعر البيع</div><div className="text-blue-600 font-bold text-lg">{formatCurrency(order.sellingPrice || 0)} ر.س</div></div>
            <div className={`text-center rounded-xl p-4 ${profit >= 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
              <div className="text-slate-500 text-xs mb-1">الربح</div>
              <div className={`font-bold text-lg ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)} ر.س</div>
            </div>
          </div>
        </div>
        {order.notes && <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"><h3 className="text-slate-900 font-semibold mb-2">ملاحظات</h3><p className="text-slate-600 text-sm whitespace-pre-wrap">{order.notes}</p></div>}
      </div>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={async () => { setDeleting(true); await deleteOrder(id); router.push('/outsourced'); }} loading={deleting} />
    </DashboardLayout>
  );
}
