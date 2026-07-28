'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Package, LayoutList, LayoutGrid } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { PriorityBadge, CategoryBadge, StageBadge, LateBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { useOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { isLate, formatDate } from '@/utils/dateUtils';
import { ORDER_STAGES } from '@/utils/stages';
import { orderHref, orderEditHref } from '@/utils/orderLinks';
import type { OrderPriority, OrderCategory, OrderStage } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

type ViewMode = 'list' | 'board';

const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all';

interface Props {
  category?: OrderCategory;
  title: string;
  newHref?: string;
  showCategoryFilter?: boolean;
}

export default function OrderListPage({ category, title, newHref, showCategoryFilter }: Props) {
  const { orders, loading } = useOrders(category);
  const { t, isRTL } = useTranslation();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<OrderStage | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<OrderCategory | ''>('');
  const [view, setView] = useState<ViewMode>('list');

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderName.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q) || (o.machineName || '').toLowerCase().includes(q);
    const matchStage = !stageFilter || o.stage === stageFilter;
    const matchPriority = !priorityFilter || o.priority === priorityFilter;
    const matchCategory = !categoryFilter || o.category === categoryFilter;
    return matchSearch && matchStage && matchPriority && matchCategory;
  }), [orders, search, stageFilter, priorityFilter, categoryFilter]);

  const hasFilters = !!(search || stageFilter || priorityFilter || categoryFilter);
  const clearFilters = () => { setSearch(''); setStageFilter(''); setPriorityFilter(''); setCategoryFilter(''); };

  return (
    <DashboardLayout title={title}>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('order.searchPlaceholder')}
              className={`w-full bg-slate-800 border border-slate-700 rounded-lg ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`}
            />
          </div>

          <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutList className="w-4 h-4" />{t('kanban.list')}
            </button>
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === 'board' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-4 h-4" />{t('kanban.board')}
            </button>
          </div>

          {newHref && (
            <Link href={newHref}>
              <Button icon={<Plus className="w-4 h-4" />}>{t('order.new')}</Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value as OrderStage | '')} className={selectCls}>
            <option value="">{t('kanban.stage')}: {t('common.all')}</option>
            {ORDER_STAGES.map(s => <option key={s} value={s}>{t(`stage.${s}` as TranslationKey)}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as OrderPriority | '')} className={selectCls}>
            <option value="">{t('form.priority')}: {t('common.all')}</option>
            <option value="low">{t('priority.low')}</option>
            <option value="normal">{t('priority.normal')}</option>
            <option value="high">{t('priority.high')}</option>
            <option value="urgent">{t('priority.urgent')}</option>
          </select>
          {showCategoryFilter && (
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as OrderCategory | '')} className={selectCls}>
              <option value="">{t('form.category')}: {t('common.all')}</option>
              <option value="chandelier">{t('cat.chandelier')}</option>
              <option value="holder">{t('cat.holder')}</option>
            </select>
          )}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>{t('common.clearFilters')}</Button>
          )}
          <span className="text-slate-500 text-sm ms-auto">{filtered.length} {t('common.total')}</span>
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState
            title={t('empty.orders')}
            description={t('empty.desc')}
            icon={<Package className="w-8 h-8 text-slate-600" />}
            action={newHref ? <Link href={newHref}><Button icon={<Plus className="w-4 h-4" />}>{t('order.new')}</Button></Link> : undefined}
          />
        ) : view === 'board' ? (
          <KanbanBoard orders={filtered} orderHref={orderHref} />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    <th className={`px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>{t('form.orderName')}</th>
                    <th className={`px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{t('form.clientName')}</th>
                    {showCategoryFilter && <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell text-center">{t('form.category')}</th>}
                    <th className={`px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{t('order.machine')}</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide text-center">{t('kanban.stage')}</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell text-center">{t('form.priority')}</th>
                    <th className={`px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell ${isRTL ? 'text-left' : 'text-right'}`}>{t('form.deliveryDate')}</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map(order => {
                    const late = isLate(order);
                    const href = orderHref(order);
                    return (
                      <tr key={order.id} className={`transition-colors hover:bg-slate-800/40 ${late ? 'bg-red-500/3' : ''}`}>
                        <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="flex flex-col gap-1">
                            <span className={`font-medium text-sm ${late ? 'text-red-300' : 'text-slate-200'}`}>{order.orderName}</span>
                            {late && <div><LateBadge /></div>}
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-slate-400 text-sm hidden md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{order.clientName}</td>
                        {showCategoryFilter && <td className="px-4 py-3 hidden md:table-cell text-center"><CategoryBadge category={order.category} /></td>}
                        <td className={`px-4 py-3 text-slate-500 text-sm hidden lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{order.machineName || '—'}</td>
                        <td className="px-4 py-3 text-center"><StageBadge stage={order.stage} /></td>
                        <td className="px-4 py-3 hidden md:table-cell text-center"><PriorityBadge priority={order.priority} /></td>
                        <td className={`px-4 py-3 hidden lg:table-cell text-sm ${late ? 'text-red-400' : 'text-slate-500'} ${isRTL ? 'text-left' : 'text-right'}`}>
                          {formatDate(order.deliveryDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Link href={href}>
                              <Button variant="ghost" size="sm">{t('common.view')}</Button>
                            </Link>
                            <Link href={orderEditHref(order)}>
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
