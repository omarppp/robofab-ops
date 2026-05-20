'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, CircuitBoard } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { StatusBadge, BusinessBadge, LateBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useOrders } from '@/hooks/useOrders';
import { isLate, formatDate } from '@/utils/dateUtils';
import { formatCurrency, STATUS_LABELS } from '@/utils/formatters';
import type { OrderStatus, BusinessLabel } from '@/types';

const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20';

export default function PCBPage() {
  const { orders, loading } = useOrders('pcbPrinting');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [labelFilter, setLabelFilter] = useState<BusinessLabel | ''>('');

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || o.orderName.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q))
      && (!statusFilter || o.status === statusFilter)
      && (!labelFilter || o.businessLabel === labelFilter);
  }), [orders, search, statusFilter, labelFilter]);

  return (
    <DashboardLayout title="طباعة PCB">
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
          </div>
          <Link href="/pcb/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={labelFilter} onChange={e => setLabelFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الجهات</option>
            <option value="RoboFab">RoboFab</option>
            <option value="TechNova">Tech Nova</option>
          </select>
          <span className="text-slate-500 text-sm ms-auto self-center">{filtered.length} طلب</span>
        </div>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState title="لا توجد طلبات PCB" icon={<CircuitBoard className="w-8 h-8 text-slate-600" />}
            action={<Link href="/pcb/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>} />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide text-right">اسم الطلب</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell text-right">العميل</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell text-right">نوع اللوحة</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell text-center">الطبقات</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell text-right">الجهة</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide text-center">الحالة</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell text-right">التسليم</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map(order => (
                    <tr key={order.id} className={`hover:bg-slate-800/40 transition-colors ${isLate(order) ? 'bg-red-500/3' : ''}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`font-medium ${isLate(order) ? 'text-red-300' : 'text-slate-200'}`}>{order.orderName}</span>{isLate(order) && <LateBadge />}</div></td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{order.clientName}</td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{order.boardType || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-center">{order.layers || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><BusinessBadge label={order.businessLabel} /></td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                      <td className={`px-4 py-3 hidden lg:table-cell ${isLate(order) ? 'text-red-400' : 'text-slate-500'}`}>{formatDate(order.deliveryDate)}</td>
                      <td className="px-4 py-3"><div className="flex gap-1.5"><Link href={`/pcb/${order.id}`}><Button variant="ghost" size="sm">عرض</Button></Link><Link href={`/pcb/${order.id}/edit`}><Button variant="outline" size="sm">تعديل</Button></Link></div></td>
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
