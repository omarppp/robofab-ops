'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, CircuitBoard } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { StatusBadge, PriorityBadge, BusinessBadge, LateBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useOrders } from '@/hooks/useOrders';
import { isLate, formatDate } from '@/utils/dateUtils';
import { formatCurrency, STATUS_LABELS } from '@/utils/formatters';
import type { OrderStatus, BusinessLabel } from '@/types';

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

  const selectCls = "bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

  return (
    <DashboardLayout title="طباعة PCB">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
              className="w-full bg-white border border-slate-300 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
          </div>
          <Link href="/pcb/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={labelFilter} onChange={e => setLabelFilter(e.target.value as any)} className={selectCls}>
            <option value="">كل الجهات</option>
            <option value="RoboFab">RoboFab</option>
            <option value="TechNova">Tech Nova</option>
          </select>
        </div>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState title="لا توجد طلبات PCB" icon={<CircuitBoard className="w-8 h-8 text-slate-400" />}
            action={<Link href="/pcb/new"><Button icon={<Plus className="w-4 h-4" />}>طلب جديد</Button></Link>} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-slate-500 font-medium">اسم الطلب</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden md:table-cell">العميل</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell">نوع اللوحة</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell">الطبقات</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden md:table-cell">الجهة</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">الحالة</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell">التسليم</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(order => (
                    <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${isLate(order) ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-slate-900 font-medium">{order.orderName}</span>{isLate(order) && <LateBadge />}</div></td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{order.clientName}</td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{order.boardType || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{order.layers || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><BusinessBadge label={order.businessLabel} /></td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className={`px-4 py-3 hidden lg:table-cell ${isLate(order) ? 'text-red-500' : 'text-slate-600'}`}>{formatDate(order.deliveryDate)}</td>
                      <td className="px-4 py-3"><div className="flex gap-2"><Link href={`/pcb/${order.id}`}><Button variant="ghost" size="sm">عرض</Button></Link><Link href={`/pcb/${order.id}/edit`}><Button variant="outline" size="sm">تعديل</Button></Link></div></td>
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
