'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Zap, Package, Clock, CheckCircle2, AlertCircle,
  Cpu, ArrowRight, ArrowLeft, Calendar, Printer, Pen, CircuitBoard, Truck,
  Activity, TrendingUp,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAllOrders } from '@/hooks/useOrders';
import { useMachines } from '@/hooks/useMachines';
import { useTranslation } from '@/hooks/useTranslation';
import { isLate, isMissingGrams, isToday, isDueTomorrow, isDueThisWeek, daysOverdue, daysUntil, formatFullDate } from '@/utils/dateUtils';
import { getEffectiveStage, stageColor, priorityBorder, priorityDot, isReadyStage, isBlockedStage } from '@/utils/stages';
import { updateOrder } from '@/lib/firestore';
import type { Order, OrderSection } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

const ROBOFAB_COLOR = '#06B6D4';
const TECHNOVA_COLOR = '#8B5CF6';

const SECTION_HREF: Record<OrderSection, string> = {
  printing3d: '/printing', design: '/design',
  pcbPrinting: '/pcb', outsourcedPrinting: '/outsourced',
};

const SECTION_ICON: Record<OrderSection, React.ElementType> = {
  printing3d: Printer, design: Pen, pcbPrinting: CircuitBoard, outsourcedPrinting: Truck,
};

const SECTION_KEY: Record<OrderSection, TranslationKey> = {
  printing3d: 'daily.section3d', design: 'daily.sectionDesign',
  pcbPrinting: 'daily.sectionPcb', outsourcedPrinting: 'daily.sectionOut',
};

// ── Order card ─────────────────────────────────────────────────────────────────
function DailyCard({ order, t, isRTL }: { order: Order; t: (k: TranslationKey) => string; isRTL: boolean }) {
  const stage = getEffectiveStage(order);
  const SectionIcon = SECTION_ICON[order.section];
  const href = `${SECTION_HREF[order.section]}/${order.id}`;
  const overdue = isLate(order) ? daysOverdue(order.deliveryDate) : 0;
  const remaining = !isLate(order) && order.deliveryDate ? daysUntil(order.deliveryDate) : 0;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Link
      href={href}
      className={`block bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all duration-200 group ${
        isLate(order) ? 'border-l-2 border-l-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot(order.priority)}`} />
          <span className="text-slate-200 font-semibold text-xs truncate">{order.orderName}</span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${
          order.businessLabel === 'RoboFab'
            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
        }`}>
          <span className="w-1 h-1 rounded-full" style={{ background: order.businessLabel === 'RoboFab' ? ROBOFAB_COLOR : TECHNOVA_COLOR }} />
          {order.businessLabel === 'TechNova' ? 'TN' : 'RF'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2 flex-wrap">
        <span className="truncate">{order.clientName}</span>
        {order.machineName && (
          <>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-0.5">
              <Cpu className="w-2.5 h-2.5" />{order.machineName}
            </span>
          </>
        )}
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-0.5">
          <SectionIcon className="w-2.5 h-2.5" />{t(SECTION_KEY[order.section])}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${stageColor(stage)}`}>
          {stage}
        </span>
        <div className="flex items-center gap-1.5">
          {isLate(order) ? (
            <span className="text-red-400 text-[11px] font-medium">{overdue}d {t('daily.late')}</span>
          ) : order.deliveryDate ? (
            remaining === 0
              ? <span className="text-amber-400 text-[11px] font-semibold">{t('daily.today')}</span>
              : <span className="text-slate-600 text-[11px]">{remaining}d</span>
          ) : null}
          <ArrowIcon className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

// ── Command panel ───────────────────────────────────────────────────────────────
function Panel({
  title, count, orders, emptyText, accent, t, isRTL, maxShow = 6, icon: Icon,
}: {
  title: string; count: number; orders: Order[]; emptyText: string;
  accent: string; t: (k: TranslationKey) => string; isRTL: boolean;
  maxShow?: number; icon: React.ElementType;
}) {
  if (orders.length === 0 && emptyText === '') return null;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${accent}`}>
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <h2 className="text-slate-300 font-semibold text-xs tracking-wide">{title}</h2>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          count > 0 ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-600'
        }`}>{count}</span>
      </div>

      <div className="p-3">
        {orders.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-600 text-xs py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500/60" />
            {emptyText}
          </div>
        ) : (
          <div className="space-y-1.5">
            {orders.slice(0, maxShow).map(o => (
              <DailyCard key={o.id} order={o} t={t} isRTL={isRTL} />
            ))}
            {orders.length > maxShow && (
              <div className="text-center text-slate-600 text-xs pt-1">
                +{orders.length - maxShow} {isRTL ? 'أكثر' : 'more'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Machine status tile ────────────────────────────────────────────────────────
function MachineTile({ name, activeOrders, scheduledOrders, t }: {
  name: string; activeOrders: Order[]; scheduledOrders: Order[]; t: (k: TranslationKey) => string;
}) {
  const isPrinting = activeOrders.length > 0;
  const total = activeOrders.length + scheduledOrders.length;

  return (
    <div className={`relative rounded-xl p-4 border transition-all duration-200 ${
      isPrinting
        ? 'bg-cyan-500/5 border-cyan-500/20 shadow-lg shadow-cyan-500/5'
        : total > 0
          ? 'bg-blue-500/5 border-blue-500/15'
          : 'bg-slate-900 border-slate-800'
    }`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`relative flex-shrink-0`}>
          <Cpu className={`w-4 h-4 ${isPrinting ? 'text-cyan-400' : 'text-slate-600'}`} />
          {isPrinting && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse-soft" />
          )}
        </div>
        <span className={`text-sm font-medium truncate ${isPrinting ? 'text-slate-200' : 'text-slate-400'}`}>{name}</span>
        <div className="ms-auto flex-shrink-0">
          {isPrinting ? (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              {t('daily.printing')}
            </span>
          ) : total === 0 ? (
            <span className="text-[10px] text-slate-700">{t('daily.idle')}</span>
          ) : null}
        </div>
      </div>
      {activeOrders.slice(0, 2).map(o => (
        <div key={o.id} className="text-[11px] text-cyan-400/70 truncate ps-6.5">{o.orderName}</div>
      ))}
      {scheduledOrders.slice(0, 1).map(o => (
        <div key={o.id} className="text-[11px] text-slate-600 truncate ps-6.5">{o.orderName}</div>
      ))}
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ label, value, variant }: { label: string; value: number; variant: 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'slate' }) {
  const v: Record<string, string> = {
    red:    value > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    orange: value > 0 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    amber:  value > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    green:  value > 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    blue:   value > 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    slate:  'bg-slate-800 border-slate-700 text-slate-400',
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl px-4 py-2.5 border min-w-[80px] ${v[variant]}`}>
      <span className="font-bold text-xl leading-none mb-0.5">{value}</span>
      <span className="text-[10px] opacity-70 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { orders, loading } = useAllOrders();
  const { machines } = useMachines();
  const { t, language, isRTL } = useTranslation();

  const active = (o: Order) => o.status !== 'delivered' && o.status !== 'cancelled';

  const lateOrders       = useMemo(() => orders.filter(o => isLate(o) && active(o)), [orders]);
  const urgentOrders     = useMemo(() => orders.filter(o => o.priority === 'urgent' && active(o) && !isLate(o)), [orders]);
  const dueTodayOrders   = useMemo(() => orders.filter(o => isToday(o.deliveryDate) && active(o) && !isLate(o)), [orders]);
  const dueTomorrowOrders = useMemo(() => orders.filter(o => isDueTomorrow(o.deliveryDate) && active(o)), [orders]);
  const dueThisWeekOrders = useMemo(() => orders.filter(o => {
    if (!o.deliveryDate || !active(o) || isToday(o.deliveryDate) || isDueTomorrow(o.deliveryDate) || isLate(o)) return false;
    return isDueThisWeek(o.deliveryDate);
  }), [orders]);
  const readyOrders      = useMemo(() => orders.filter(o => isReadyStage(getEffectiveStage(o)) && active(o)), [orders]);
  const blockedOrders    = useMemo(() => orders.filter(o => isBlockedStage(getEffectiveStage(o)) && active(o)), [orders]);
  const missingGramsOrders = useMemo(() => orders.filter(isMissingGrams), [orders]);
  const noDateOrders     = useMemo(() => orders.filter(o => !o.deliveryDate && active(o)), [orders]);
  const activeOrders     = useMemo(() => orders.filter(active), [orders]);

  const machineMap = useMemo(() => {
    const map: Record<string, { active: Order[]; scheduled: Order[] }> = {};
    for (const m of machines) map[m.name] = { active: [], scheduled: [] };
    for (const o of orders) {
      if (o.section !== 'printing3d' || !o.machineName || !active(o)) continue;
      const stage = getEffectiveStage(o);
      const entry = map[o.machineName] || (map[o.machineName] = { active: [], scheduled: [] });
      if (stage === 'printing') entry.active.push(o);
      else if (stage === 'scheduledPrinting') entry.scheduled.push(o);
    }
    return map;
  }, [orders, machines]);

  const activeMachineCount = useMemo(() =>
    Object.values(machineMap).filter(m => m.active.length > 0).length, [machineMap]);

  const criticalCount = lateOrders.length + urgentOrders.length;
  const todayStr = formatFullDate(new Date().toISOString(), language as 'ar' | 'en');

  if (loading) return (
    <DashboardLayout title={t('daily.title')}>
      <LoadingSpinner text={t('common.loading')} />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={t('daily.title')}>
      <div className="space-y-4 animate-fade-in">

        {/* ── Command header ─────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-400" />
                <h1 className="text-slate-200 font-bold text-base">{t('daily.title')}</h1>
              </div>
              <p className="text-slate-500 text-xs flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {todayStr}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatChip label={t('daily.lateCount')}     value={lateOrders.length}        variant="red" />
              <StatChip label={t('daily.urgentCount')}   value={urgentOrders.length}      variant="orange" />
              <StatChip label={t('daily.dueToday')}      value={dueTodayOrders.length}    variant="amber" />
              <StatChip label={t('daily.readyCount')}    value={readyOrders.length}       variant="green" />
              <StatChip label={t('daily.activeMachines')} value={activeMachineCount}      variant="blue" />
              <StatChip label={t('daily.ordersActive')}  value={activeOrders.length}      variant="slate" />
            </div>
          </div>

          {/* All-clear banner */}
          {criticalCount === 0 && dueTodayOrders.length === 0 && activeOrders.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5 bg-green-500/8 border border-green-500/15 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm">{t('daily.allClear')}</span>
            </div>
          )}
        </div>

        {/* ── Critical: Late + Urgent ─────────────────────────────────────────── */}
        {(lateOrders.length > 0 || urgentOrders.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Panel
              title={t('daily.late')}
              count={lateOrders.length}
              orders={lateOrders}
              emptyText={t('daily.noLate')}
              accent="panel-red"
              icon={AlertTriangle}
              t={t} isRTL={isRTL} maxShow={5}
            />
            <Panel
              title={t('daily.urgent')}
              count={urgentOrders.length}
              orders={urgentOrders}
              emptyText={t('daily.noUrgent')}
              accent="panel-orange"
              icon={Zap}
              t={t} isRTL={isRTL} maxShow={5}
            />
          </div>
        )}

        {/* ── Due Today ───────────────────────────────────────────────────────── */}
        {dueTodayOrders.length > 0 && (
          <Panel
            title={t('daily.dueToday')}
            count={dueTodayOrders.length}
            orders={dueTodayOrders}
            emptyText={t('daily.noDueToday')}
            accent="panel-amber"
            icon={Clock}
            t={t} isRTL={isRTL} maxShow={8}
          />
        )}

        {/* ── Machine fleet status ────────────────────────────────────────────── */}
        {machines.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                <h2 className="text-slate-300 font-semibold text-xs tracking-wide">{t('daily.machineStatus')}</h2>
              </div>
              {activeMachineCount > 0 && (
                <span className="text-xs text-cyan-400 font-medium">
                  {activeMachineCount} {t('daily.activeMachines')}
                </span>
              )}
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {Object.entries(machineMap).map(([name, { active, scheduled }]) => (
                <MachineTile key={name} name={name} activeOrders={active} scheduledOrders={scheduled} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* ── Ready + Due tomorrow + This week ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {readyOrders.length > 0 && (
            <Panel
              title={t('daily.readyDelivery')}
              count={readyOrders.length}
              orders={readyOrders}
              emptyText=""
              accent="panel-green"
              icon={Package}
              t={t} isRTL={isRTL} maxShow={5}
            />
          )}
          {dueTomorrowOrders.length > 0 && (
            <Panel
              title={t('daily.dueTomorrow')}
              count={dueTomorrowOrders.length}
              orders={dueTomorrowOrders}
              emptyText=""
              accent="panel-blue"
              icon={Clock}
              t={t} isRTL={isRTL} maxShow={4}
            />
          )}
          {dueThisWeekOrders.length > 0 && (
            <Panel
              title={t('daily.dueThisWeek')}
              count={dueThisWeekOrders.length}
              orders={dueThisWeekOrders}
              emptyText=""
              accent="panel-cyan"
              icon={Calendar}
              t={t} isRTL={isRTL} maxShow={4}
            />
          )}
        </div>

        {/* ── Blocked + Alerts ────────────────────────────────────────────────── */}
        {(blockedOrders.length > 0 || missingGramsOrders.length > 0 || noDateOrders.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blockedOrders.length > 0 && (
              <Panel
                title={t('daily.blocked')}
                count={blockedOrders.length}
                orders={blockedOrders}
                emptyText=""
                accent="panel-purple"
                icon={AlertCircle}
                t={t} isRTL={isRTL} maxShow={5}
              />
            )}
            {(missingGramsOrders.length > 0 || noDateOrders.length > 0) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden panel-amber">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <h2 className="text-slate-300 font-semibold text-xs tracking-wide">{t('daily.alerts')}</h2>
                </div>
                <div className="p-3 space-y-2">
                  {noDateOrders.length > 0 && (
                    <div className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs flex-1">{t('daily.noDate')}</span>
                      <span className="font-bold text-amber-400 text-sm">{noDateOrders.length}</span>
                    </div>
                  )}
                  {missingGramsOrders.length > 0 && (
                    <div className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs flex-1">{t('daily.missingGrams')}</span>
                      <span className="font-bold text-orange-400 text-sm">{missingGramsOrders.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────────── */}
        {activeOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-slate-400 font-medium text-sm">{t('daily.noOrders')}</p>
              <p className="text-slate-600 text-xs mt-1">النظام جاهز لاستقبال الطلبات</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
