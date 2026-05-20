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
  sent:       'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  inProgress: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  received:   'bg-green-500/10 text-green-400 border border-green-500/20',
  delivered:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  cancelled:  'bg-slate-800 text-slate-500 border border-slate-700',
};

const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20';

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

  return (
    <DashboardLayout title="الطباعة عند الغير">
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
          </div>
          <Link href="/outsourced/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الحالات</option>
            {Object.entries(OUTSOURCED_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={labelFilter} onChange={e => setLabelFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الجهات</option>
            <option value="RoboFab">RoboFab</option>
            <option value="TechNova">Tech Nova</option>
          </select>
          <span className="text-slate-500 text-sm ms-auto self-center">{filtered.length} طلب</span>
        </div>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState title="لا توجد طلبات خارجية" icon={<Truck className="w-8 h-8 text-slate-600" />}
            action={<Link href="/outsourced/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>} />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide text-right">اسم الطلب</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell text-right">الشركة</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell text-right">الجهة</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide text-center">الحالة</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell text-right">التسليم المتوقع</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell text-right">التكلفة</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell text-right">سعر البيع</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3"><span className="text-slate-200 font-medium">{order.orderName}</span></td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{order.companyName || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><BusinessBadge label={order.businessLabel} /></td>
                      <td className="px-4 py-3 text-center">
                        <Badge label={OUTSOURCED_STATUS_LABELS[order.status as OutsourcedStatus] || order.status} className={statusColors[order.status as OutsourcedStatus] || ''} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatDate(order.expectedDeliveryDate)}</td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatCurrency(order.cost || 0)} ر.س</td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatCurrency(order.sellingPrice || 0)} ر.س</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
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
