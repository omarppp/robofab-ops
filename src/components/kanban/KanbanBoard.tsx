'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, Cpu, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { updateOrder } from '@/lib/firestore';
import { getEffectiveStage, getSectionStages, stageColor, stageToStatus, priorityBorder, priorityDot } from '@/utils/stages';
import { isLate, daysOverdue, daysUntil, formatDate } from '@/utils/dateUtils';
import type { Order, OrderSection, OrderStage } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

// Map stage key to translation key prefix
function stageTranslationKey(section: OrderSection, stage: OrderStage): TranslationKey {
  const prefix = section === 'printing3d' ? 'pstage'
    : section === 'design' ? 'dstage'
    : section === 'pcbPrinting' ? 'bstage'
    : 'estage';
  return `${prefix}.${stage}` as TranslationKey;
}

interface KanbanCardProps {
  order: Order;
  section: OrderSection;
  stages: OrderStage[];
  href: string;
}

function KanbanCard({ order, section, stages, href }: KanbanCardProps) {
  const { t, isRTL } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const late = isLate(order);
  const overdue = late ? daysOverdue(order.deliveryDate) : 0;
  const remaining = !late && order.deliveryDate ? daysUntil(order.deliveryDate) : null;

  const handleStageChange = async (newStage: OrderStage, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    setSaving(true);
    try {
      await updateOrder(order.id, { stage: newStage, status: stageToStatus(newStage) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${priorityBorder(order.priority)} ${saving ? 'opacity-60' : ''}`}>
      {/* Card body — clickable to view order */}
      <Link href={href} className="block p-3 hover:bg-slate-50 transition-colors">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot(order.priority)}`} />
            <span className="text-slate-900 text-xs font-semibold truncate">{order.orderName}</span>
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
            order.businessLabel === 'RoboFab' ? 'text-cyan-600 bg-cyan-50' : 'text-purple-600 bg-purple-50'
          }`}>
            {order.businessLabel === 'TechNova' ? 'TN' : 'RF'}
          </span>
        </div>

        {/* Client */}
        <p className="text-slate-500 text-xs truncate mb-1.5">{order.clientName}</p>

        {/* Machine (3D only) */}
        {order.machineName && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1.5">
            <Cpu className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{order.machineName}</span>
          </div>
        )}

        {/* Delivery date */}
        {order.deliveryDate && (
          <div className={`flex items-center gap-1 text-xs ${late ? 'text-red-500' : remaining === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            {late ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {overdue}d {t('daily.late')}
              </span>
            ) : (
              <span>{formatDate(order.deliveryDate)}</span>
            )}
          </div>
        )}
      </Link>

      {/* Stage change button — footer */}
      <div className="border-t border-slate-100 px-3 py-1.5 relative">
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors w-full"
        >
          <span className="flex-1 truncate text-start">{t(stageTranslationKey(section, getEffectiveStage(order)))}</span>
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setMenuOpen(false); }} />
            <div className={`absolute bottom-full ${isRTL ? 'right-0' : 'left-0'} mb-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden py-1`}>
              {stages.map(st => {
                const current = getEffectiveStage(order) === st;
                return (
                  <button
                    key={st}
                    onClick={(e) => handleStageChange(st, e)}
                    className={`w-full text-start px-3 py-2 text-xs transition-colors ${current ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {current && '✓ '}{t(stageTranslationKey(section, st))}
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
  section: OrderSection;
  orderHref: (id: string) => string;
}

export default function KanbanBoard({ orders, section, orderHref }: KanbanBoardProps) {
  const { t } = useTranslation();
  const stages = getSectionStages(section);

  const columnMap = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const s of stages) map[s] = [];
    for (const o of orders) {
      const s = getEffectiveStage(o);
      if (map[s]) map[s].push(o);
      else map[stages[0]] = [...(map[stages[0]] || []), o];
    }
    return map;
  }, [orders, stages]);

  // Hide empty terminal columns (delivered, cancelled) unless they have orders
  const visibleStages = stages.filter(s =>
    columnMap[s]?.length > 0 || !['delivered', 'cancelled'].includes(s)
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {visibleStages.map(stage => {
        const colOrders = columnMap[stage] || [];
        const key = stageTranslationKey(section, stage);
        return (
          <div key={stage} className="flex-shrink-0 w-60 flex flex-col">
            {/* Column header */}
            <div className={`rounded-xl px-3 py-2 mb-2 flex items-center justify-between border ${stageColor(stage)}`}>
              <span className="text-xs font-semibold truncate">{t(key)}</span>
              <span className="text-xs font-bold ms-2 flex-shrink-0 bg-white/70 px-1.5 py-0.5 rounded-full">{colOrders.length}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2">
              {colOrders.length === 0 ? (
                <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-slate-200">
                  <span className="text-slate-400 text-xs">{t('kanban.noOrders')}</span>
                </div>
              ) : (
                colOrders.map(o => (
                  <KanbanCard
                    key={o.id}
                    order={o}
                    section={section}
                    stages={stages}
                    href={orderHref(o.id)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
