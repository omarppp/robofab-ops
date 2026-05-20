'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Printer, LayoutList, LayoutGrid } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { StatusBadge, PriorityBadge, BusinessBadge, LateBadge, MissingGramsBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { useOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { isLate, isMissingGrams, formatDate } from '@/utils/dateUtils';
import { getEffectiveStage, stageColor, PRINTING_STAGES } from '@/utils/stages';
import { formatCurrency } from '@/utils/formatters';
import type { OrderStatus, OrderPriority, BusinessLabel, PrintingStage } from '@/types';

type ViewMode = 'list' | 'board';

export default function PrintingPage() {
  const { orders, loading } = useOrders('printing3d');
  const { t, isRTL } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [stageFilter, setStageFilter] = useState<PrintingStage | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority | ''>('');
  const [labelFilter, setLabelFilter] = useState<BusinessLabel | ''>('');
  const [view, setView] = useState<ViewMode>('list');

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderName.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q) || (o.machineName || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchStage = !stageFilter || getEffectiveStage(o) === stageFilter;
    const matchPriority = !priorityFilter || o.priority === priorityFilter;
    const matchLabel = !labelFilter || o.businessLabel === labelFilter;
    return matchSearch && matchStatus && matchStage && matchPriority && matchLabel;
  }), [orders, search, statusFilter, stageFilter, priorityFilter, labelFilter]);

  const hasFilters = !!(search || statusFilter || stageFilter || priorityFilter || labelFilter);
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setStageFilter(''); setPriorityFilter(''); setLabelFilter(''); };

  const selectCls = "bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

  const PRIORITY_LABELS: Record<string, string> = {
    low: t('priority.low'), normal: t('priority.normal'),
    high: t('priority.high'), urgent: t('priority.urgent'),
  };
  const STATUS_LABELS_MAP: Record<string, string> = {
    new: t('status.new'), inProgress: t('status.inProgress'),
    waiting: t('status.waiting'), completed: t('status.completed'),
    delivered: t('status.delivered'), cancelled: t('status.cancelled'),
  };
  const PSTAGE_LABELS: Record<string, string> = {
    new: t('pstage.new'), reviewingFile: t('pstage.reviewingFile'),
    waitingClientConfirm: t('pstage.waitingClientConfirm'), waitingMaterial: t('pstage.waitingMaterial'),
    scheduledPrinting: t('pstage.scheduledPrinting'), printing: t('pstage.printing'),
    postProcessing: t('pstage.postProcessing'), readyDelivery: t('pstage.readyDelivery'),
    delivered: t('pstage.delivered'), cancelled: t('pstage.cancelled'),
  };

  return (
    <DashboardLayout title={t('printing.title')}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('printing.searchPlaceholder')}
              className={`w-full bg-white border border-slate-300 rounded-lg ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`}
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutList className="w-4 h-4" />{t('kanban.list')}
            </button>
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === 'board' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutGrid className="w-4 h-4" />{t('kanban.board')}
            </button>
          </div>

          <Link href="/printing/new">
            <Button icon={<Plus className="w-4 h-4" />}>{t('printing.new')}</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value as any)} className={selectCls}>
            <option value="">{t('kanban.stage')}: {t('common.all')}</option>
            {PRINTING_STAGES.map(s => <option key={s} value={s}>{PSTAGE_LABELS[s]}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={selectCls}>
            <option value="">{t('form.status')}: {t('common.all')}</option>
            {Object.entries(STATUS_LABELS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} className={selectCls}>
            <option value="">{t('form.priority')}: {t('common.all')}</option>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={labelFilter} onChange={e => setLabelFilter(e.target.value as any)} className={selectCls}>
            <option value="">{t('common.all')}</option>
            <option value="RoboFab">RoboFab</option>
            <option value="TechNova">Tech Nova</option>
          </select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>{t('common.clearFilters')}</Button>
          )}
          <span className="text-slate-500 text-sm ms-auto">{filtered.length} {t('common.total')}</span>
        </div>

        {/* Content */}
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState
            title={t('empty.printing')}
            description={t('empty.desc')}
            icon={<Printer className="w-8 h-8 text-slate-400" />}
            action={<Link href="/printing/new"><Button icon={<Plus className="w-4 h-4" />}>{t('printing.new')}</Button></Link>}
          />
        ) : view === 'board' ? (
          <KanbanBoard
            orders={filtered}
            section="printing3d"
            orderHref={(id) => `/printing/${id}`}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className={`px-4 py-3 text-slate-500 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('form.orderName')}</th>
                    <th className={`px-4 py-3 text-slate-500 font-medium hidden md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{t('form.clientName')}</th>
                    <th className={`px-4 py-3 text-slate-500 font-medium hidden lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{t('printing.machine')}</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell text-center">{t('kanban.stage')}</th>
                    <th className="px-4 py-3 text-slate-500 font-medium text-center">{t('form.status')}</th>
                    <th className="px-4 py-3 text-slate-500 font-medium hidden md:table-cell text-center">{t('form.priority')}</th>
                    <th className={`px-4 py-3 text-slate-500 font-medium hidden lg:table-cell ${isRTL ? 'text-left' : 'text-right'}`}>{t('form.deliveryDate')}</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(order => {
                    const stage = getEffectiveStage(order);
                    return (
                      <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${isLate(order) ? 'bg-red-50/50' : ''}`}>
                        <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-900 font-medium">{order.orderName}</span>
                            <div className="flex gap-1 flex-wrap">
                              {isLate(order) && <LateBadge />}
                              {isMissingGrams(order) && <MissingGramsBadge />}
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-slate-600 hidden md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{order.clientName}</td>
                        <td className={`px-4 py-3 text-slate-600 hidden lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{order.machineName || '—'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-center">
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${stageColor(stage)}`}>
                            {PSTAGE_LABELS[stage] || stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 hidden md:table-cell text-center"><PriorityBadge priority={order.priority} /></td>
                        <td className={`px-4 py-3 hidden lg:table-cell text-sm ${isLate(order) ? 'text-red-500' : 'text-slate-600'} ${isRTL ? 'text-left' : 'text-right'}`}>
                          {formatDate(order.deliveryDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/printing/${order.id}`}>
                              <Button variant="ghost" size="sm">{t('common.view')}</Button>
                            </Link>
                            <Link href={`/printing/${order.id}/edit`}>
                              <Button variant="outline" size="sm">{t('common.edit')}</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
