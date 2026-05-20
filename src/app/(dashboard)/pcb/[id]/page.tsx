'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { StatusBadge, PriorityBadge, BusinessBadge, LateBadge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getOrder, deleteOrder } from '@/lib/firestore';
import { isLate, formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatters';
import type { Order } from '@/types';

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="flex flex-col gap-1"><span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span><span className="text-slate-900 font-medium">{value ?? '—'}</span></div>;
}

export default function PCBOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { getOrder(id).then(o => { setOrder(o); setLoading(false); }); }, [id]);

  if (loading) return <DashboardLayout title="تفاصيل الطلب"><LoadingSpinner /></DashboardLayout>;
  if (!order) return <DashboardLayout title="تفاصيل الطلب"><p className="text-slate-500 p-6">الطلب غير موجود</p></DashboardLayout>;

  return (
    <DashboardLayout title="تفاصيل طلب PCB">
      <div className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/pcb" className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm"><ArrowRight className="w-4 h-4" />العودة</Link>
          <div className="flex gap-2">
            <Link href={`/pcb/${id}/edit`}><Button variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>تعديل</Button></Link>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setConfirmDelete(true)}>حذف</Button>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div><h2 className="text-xl font-bold text-slate-900">{order.orderName}</h2><p className="text-slate-500 text-sm mt-1">{order.clientName}</p></div>
            <div className="flex flex-col items-end gap-2"><StatusBadge status={order.status} /><PriorityBadge priority={order.priority} /><BusinessBadge label={order.businessLabel} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Detail label="نوع اللوحة" value={order.boardType} />
            <Detail label="حجم اللوحة" value={order.boardSize} />
            <Detail label="الكمية" value={order.quantity} />
            <Detail label="الطبقات" value={order.layers} />
            <Detail label="تاريخ الاستلام" value={formatDate(order.receivedDate)} />
            <Detail label="تاريخ التسليم" value={formatDate(order.deliveryDate)} />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">المالية</h3>
          <div className="grid grid-cols-3 gap-5">
            <div className="text-center bg-slate-50 border border-slate-100 rounded-xl p-4"><div className="text-slate-500 text-xs mb-1">السعر</div><div className="text-slate-900 font-bold text-lg">{formatCurrency(order.price)} ر.س</div></div>
            <div className="text-center bg-green-50 border border-green-100 rounded-xl p-4"><div className="text-slate-500 text-xs mb-1">المدفوع</div><div className="text-green-600 font-bold text-lg">{formatCurrency(order.paidAmount)} ر.س</div></div>
            <div className="text-center bg-orange-50 border border-orange-100 rounded-xl p-4"><div className="text-slate-500 text-xs mb-1">المتبقي</div><div className="text-orange-600 font-bold text-lg">{formatCurrency(order.remainingAmount)} ر.س</div></div>
          </div>
        </div>
        {order.notes && <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"><h3 className="text-slate-900 font-semibold mb-2">ملاحظات</h3><p className="text-slate-600 text-sm whitespace-pre-wrap">{order.notes}</p></div>}
      </div>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={async () => { setDeleting(true); await deleteOrder(id); router.push('/pcb'); }} loading={deleting} />
    </DashboardLayout>
  );
}
