'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, Cpu, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { changeStageSafely } from '@/lib/orders';
import { ORDER_STAGES, stageColor, priorityBorder, priorityDot } from '@/utils/stages';
import { isLate, daysOverdue, formatDate } from '@/utils/dateUtils';
import { CategoryBadge } from '@/components/ui/Badge';
import type { Order, OrderStage } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

interface KanbanCardProps {
  order: Order;
  href: string;
}

function KanbanCard({ order, href }: KanbanCardProps) {
  const { t, isRTL } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const late = isLate(order);
  const overdue = late ? daysOverdue(order.deliveryDate) : 0;

  const handleStageChange = async (newStage: OrderStage, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setMenuOpen(false); setSaving(true);
    try { await changeStageSafely(order, newStage); }
    finally { setSaving(false); }
  };

  return (
    <div className={`relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-200 ${priorityBorder(order.priority)} ${saving ? 'opacity-50' : ''}`}>
      <Link href={href} className="block p-3 hover:bg-slate-800/40 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot(order.priority)}`} />
            <span className="text-slate-200 text-xs font-semibold truncate">{order.orderName}</span>
          </div>
          <CategoryBadge category={order.category} />
        </div>

        <p className="text-slate-500 text-xs truncate mb-1.5">{order.clientName}</p>

        {order.machineName && (
          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1.5">
            <Cpu className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{order.machineName}</span>
          </div>
        )}

        {order.deliveryDate && (
          <div className={`flex items-center gap-1 text-xs ${late ? 'text-red-400' : 'text-slate-600'}`}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            {late ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{overdue}d {t('daily.late')}
              </span>
            ) : (
              <span>{formatDate(order.deliveryDate)}</span>
            )}
          </div>
        )}
      </Link>

      <div className="border-t border-slate-800 px-3 py-1.5 relative">
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-300 transition-colors w-full"
        >
          <span className="flex-1 truncate text-start">{t(`stage.${order.stage}` as TranslationKey)}</span>
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setMenuOpen(false); }} />
            <div className={`absolute bottom-full ${isRTL ? 'right-0' : 'left-0'} mb-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-20 overflow-hidden py-1 animate-scale-in`}>
              {ORDER_STAGES.map(st => {
                const current = order.stage === st;
                return (
                  <button
                    key={st}
                    onClick={(e) => handleStageChange(st, e)}
                    className={`w-full text-start px-3 py-2 text-xs transition-colors ${current ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    {current && '✓ '}{t(`stage.${st}` as TranslationKey)}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  orders: Order[];
  orderHref: (order: Order) => string;
}

export default function KanbanBoard({ orders, orderHref }: KanbanBoardProps) {
  const { t } = useTranslation();

  const columnMap = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const s of ORDER_STAGES) map[s] = [];
    for (const o of orders) {
      if (map[o.stage]) map[o.stage].push(o);
      else map[ORDER_STAGES[0]] = [...(map[ORDER_STAGES[0]] || []), o];
    }
    return map;
  }, [orders]);

  const visibleStages = ORDER_STAGES.filter(s =>
    columnMap[s]?.length > 0 || !['delivered', 'cancelled'].includes(s)
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[400px]">
      {visibleStages.map(stage => {
        const colOrders = columnMap[stage] || [];
        return (
          <div key={stage} className="flex-shrink-0 w-56 flex flex-col">
            <div className={`rounded-xl px-3 py-2 mb-2 flex items-center justify-between border ${stageColor(stage)}`}>
              <span className="text-xs font-semibold truncate">{t(`stage.${stage}` as TranslationKey)}</span>
              <span className="text-xs font-bold ms-2 flex-shrink-0 bg-black/20 px-1.5 py-0.5 rounded-full">
                {colOrders.length}
              </span>
            </div>

            <div className="flex-1 space-y-2">
              {colOrders.length === 0 ? (
                <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-slate-800">
                  <span className="text-slate-700 text-xs">{t('kanban.noOrders')}</span>
                </div>
              ) : (
                colOrders.map(o => (
                  <KanbanCard key={o.id} order={o} href={orderHref(o)} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
