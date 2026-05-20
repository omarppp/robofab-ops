'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Truck } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { BusinessBadge, LateBadge, Badge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useOrders } from '@/hooks/useOrders';
import { isLate, formatDate } from '@/utils/dateUtils';
import { formatCurrency, OUTSOURCED_STATUS_LABELS } from '@/utils/formatters';
import type { OutsourcedStatus, BusinessLabel } from '@/types';

const statusColors: Record<OutsourcedStatus, string> = {
  sent: 'bg-blue-50 text-blue-700 border border-blue-200',
  inProgress: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  received: 'bg-green-50 text-green-700 border border-green-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
};

export default function OutsourcedPage() {
  const { orders, loading } = useOrders('outsourcedPrinting');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OutsourcedStatus | ''>('');
  const [labelFilter, setLabelFilter] = useState<BusinessLabel | ''>('');

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || o.orderName.toLowerCase().includes(q) || (o.companyName || '').toLowerCase().includes(q))
      && (!statusFilter || o.status === statusFilter)
      && (!labelFilter || o.businessLabel === labelFilter);
  }), [orders, search, statusFilter, labelFilter]);

  const selectCls = "bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

  return (
    <DashboardLayout title="الطباعة عند الغير">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
              className="w-full bg-white border border-slate-300 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
          </div>
          <Link href="/outsourced/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الحالات</option>
            {Object.entries(OUTSOURCED_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={labelFilter} onChange={e => setLabelFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الجهات</option>
            <option value="RoboFab">RoboFab</option>
            <option value="TechNova">Tech Nova</option>
          </select>
        </div>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState title="لا توجد طلبات خارجية" icon={<Truck className="w-8 h-8 text-slate-400" />}
            action={<Link href="/outsourced/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-slate-500 font-medium">اسم الطلب</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden md:table-cell">الشركة</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden md:table-cell">الجهة</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">الحالة</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell">التسليم المتوقع</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell">التكلفة</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell">سعر البيع</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><span className="text-slate-900 font-medium">{order.orderName}</span></td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{order.companyName || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><BusinessBadge label={order.businessLabel} /></td>
                      <td className="px-4 py-3">
                        <Badge label={OUTSOURCED_STATUS_LABELS[order.status as OutsourcedStatus] || order.status} className={statusColors[order.status as OutsourcedStatus] || ''} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{formatDate(order.expectedDeliveryDate)}</td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{formatCurrency(order.cost || 0)} ر.س</td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{formatCurrency(order.sellingPrice || 0)} ر.س</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/outsourced/${order.id}`}><Button variant="ghost" size="sm">عرض</Button></Link>
                          <Link href={`/outsourced/${order.id}/edit`}><Button variant="outline" size="sm">تعديل</Button></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
