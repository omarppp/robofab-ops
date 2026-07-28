'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Zap, Package, Clock, CheckCircle2,
  Cpu, ArrowRight, ArrowLeft, Calendar, Activity, TrendingUp,
  PenTool, Scissors, Printer, Search, Layers, Palette, Lightbulb, CircleDot,
  CalendarClock, ListChecks, Plus, BarChart3,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CategoryBadge } from '@/components/ui/Badge';
import { useAllOrders } from '@/hooks/useOrders';
import { useMachines } from '@/hooks/useMachines';
import { useFilamentStock } from '@/hooks/useFilamentStock';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useTranslation } from '@/hooks/useTranslation';
import { isLate, isToday, isDueTomorrow, isDueThisWeek, daysOverdue, daysUntil, formatFullDate, formatDateTime } from '@/utils/dateUtils';
import { isReadyStage, isTerminalStage, stageColor } from '@/utils/stages';
import { filamentStatus } from '@/utils/formatters';
import type { Order } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

const orderHref = (o: Order) => `/orders/${o.category}/${o.id}`;

const ACTIVITY_ICONS: Record<string, string> = {
  created: '✦', stageChanged: '→', started: '▶', finished: '■',
  markedReady: '✓', delivered: '★', cancelled: '✕', noteAdded: '✎',
  fieldUpdated: '✐', filamentReserved: '◆', filamentConsumed: '◇',
  filamentReleased: '↺', machineSelected: '⚙', deliveryDateChanged: '📅', paymentUpdated: '$',
};

// ── Order card ─────────────────────────────────────────────────────────────────
function DailyCard({ order, t, isRTL }: { order: Order; t: (k: TranslationKey) => string; isRTL: boolean }) {
  const href = orderHref(order);
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
        <span className="text-slate-200 font-semibold text-xs truncate flex-1">{order.orderName}</span>
        <CategoryBadge category={order.category} />
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
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${stageColor(order.stage)}`}>
          {t(`stage.${order.stage}` as TranslationKey)}
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
        <div className="relative flex-shrink-0">
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
function StatChip({ label, value, variant }: { label: string; value: number; variant: 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'slate' | 'purple' | 'cyan' }) {
  const v: Record<string, string> = {
    red:    value > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    orange: value > 0 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    amber:  value > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    green:  value > 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    blue:   value > 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    purple: value > 0 ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-slate-800 border-slate-700 text-slate-500',
    cyan:   value > 0 ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500',
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
  const { filaments } = useFilamentStock();
  const { activities: recentActivity, loading: activityLoading } = useRecentActivity(12);
  const { t, language, isRTL } = useTranslation();

  const active = (o: Order) => !isTerminalStage(o.stage);

  const lateOrders        = useMemo(() => orders.filter(o => isLate(o) && active(o)), [orders]);
  const urgentOrders      = useMemo(() => orders.filter(o => o.priority === 'urgent' && active(o) && !isLate(o)), [orders]);
  const dueTodayOrders    = useMemo(() => orders.filter(o => isToday(o.deliveryDate) && active(o) && !isLate(o)), [orders]);
  const dueTomorrowOrders = useMemo(() => orders.filter(o => isDueTomorrow(o.deliveryDate) && active(o)), [orders]);
  const dueThisWeekOrders = useMemo(() => orders.filter(o => {
    if (!o.deliveryDate || !active(o) || isToday(o.deliveryDate) || isDueTomorrow(o.deliveryDate) || isLate(o)) return false;
    return isDueThisWeek(o.deliveryDate);
  }), [orders]);
  const readyOrders       = useMemo(() => orders.filter(o => isReadyStage(o.stage)), [orders]);
  const activeOrders      = useMemo(() => orders.filter(active), [orders]);

  const designOrders   = useMemo(() => orders.filter(o => o.stage === 'design'), [orders]);
  const slicingOrders  = useMemo(() => orders.filter(o => o.stage === 'slicing'), [orders]);
  const printingOrders = useMemo(() => orders.filter(o => o.stage === 'printing'), [orders]);
  const qcOrders        = useMemo(() => orders.filter(o => o.stage === 'qualityCheck'), [orders]);

  const chandelierTodayCount = useMemo(() => dueTodayOrders.filter(o => o.category === 'chandelier').length + lateOrders.filter(o => o.category === 'chandelier').length, [dueTodayOrders, lateOrders]);
  const holderTodayCount     = useMemo(() => dueTodayOrders.filter(o => o.category === 'holder').length + lateOrders.filter(o => o.category === 'holder').length, [dueTodayOrders, lateOrders]);

  const machineMap = useMemo(() => {
    const map: Record<string, { active: Order[]; scheduled: Order[] }> = {};
    for (const m of machines) map[m.name] = { active: [], scheduled: [] };
    for (const o of orders) {
      if (!o.machineName || !active(o)) continue;
      const entry = map[o.machineName] || (map[o.machineName] = { active: [], scheduled: [] });
      if (o.stage === 'printing') entry.active.push(o);
      else if (o.stage === 'scheduledPrinting') entry.scheduled.push(o);
    }
    return map;
  }, [orders, machines]);

  const activeMachineCount = useMemo(() =>
    Object.values(machineMap).filter(m => m.active.length > 0).length, [machineMap]);

  const todaysScheduleOrders = useMemo(() =>
    [...orders]
      .filter(o => isToday(o.plannedStartDate) && active(o))
      .sort((a, b) => (a.printStartTime || '').localeCompare(b.printStartTime || '')),
    [orders]
  );

  const nextJobs = useMemo(() =>
    [...orders]
      .filter(o => o.stage === 'scheduledPrinting' && o.plannedStartDate)
      .sort((a, b) =>
        new Date(`${a.plannedStartDate}T${a.printStartTime || '00:00'}`).getTime() -
        new Date(`${b.plannedStartDate}T${b.printStartTime || '00:00'}`).getTime())
      .slice(0, 6),
    [orders]
  );

  const chandelierActive = useMemo(() =>
    [...orders].filter(o => o.category === 'chandelier' && active(o))
      .sort((a, b) => (a.deliveryDate || '9999').localeCompare(b.deliveryDate || '9999')),
    [orders]
  );
  const holderActive = useMemo(() =>
    [...orders].filter(o => o.category === 'holder' && active(o))
      .sort((a, b) => (a.deliveryDate || '9999').localeCompare(b.deliveryDate || '9999')),
    [orders]
  );

  const lowStockFilaments = useMemo(() => filaments.filter(f => filamentStatus(f.currentGrams, f.minStockLevel) === 'low'), [filaments]);
  const outStockFilaments = useMemo(() => filaments.filter(f => filamentStatus(f.currentGrams, f.minStockLevel) === 'out'), [filaments]);
  const mostUsedColors = useMemo(() =>
    [...filaments].filter(f => f.usedGrams > 0).sort((a, b) => b.usedGrams - a.usedGrams).slice(0, 5),
    [filaments]
  );

  const orderById = useMemo(() => {
    const map: Record<string, Order> = {};
    for (const o of orders) map[o.id] = o;
    return map;
  }, [orders]);

  const criticalCount = lateOrders.length + urgentOrders.length;
  const todayStr = formatFullDate(new Date().toISOString(), language as 'ar' | 'en');
  const isAr = language === 'ar';

  const lowStockMessage = (name: string, material: string, grams: number) => isAr
    ? `الفيلمنت ${name} ${material} قرب يخلص — المتاح ${grams}g فقط`
    : `${name} ${material} filament is running low — only ${grams}g available`;
  const outStockMessage = (name: string, material: string) => isAr
    ? `الفيلمنت ${name} ${material} نفذ من المخزون`
    : `${name} ${material} filament is out of stock`;

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
              <StatChip label={t('daily.lateCount')}      value={lateOrders.length}         variant="red" />
              <StatChip label={t('daily.urgentCount')}    value={urgentOrders.length}       variant="orange" />
              <StatChip label={t('daily.dueToday')}       value={dueTodayOrders.length}     variant="amber" />
              <StatChip label={t('daily.readyCount')}     value={readyOrders.length}        variant="green" />
              <StatChip label={t('daily.activeMachines')} value={activeMachineCount}        variant="blue" />
              <StatChip label={t('cat.chandelier')}       value={chandelierTodayCount}       variant="cyan" />
              <StatChip label={t('cat.holder')}           value={holderTodayCount}            variant="purple" />
              <StatChip label={t('daily.ordersActive')}  value={activeOrders.length}       variant="slate" />
            </div>
          </div>

          {criticalCount === 0 && dueTodayOrders.length === 0 && activeOrders.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5 bg-green-500/8 border border-green-500/15 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm">{t('daily.allClear')}</span>
            </div>
          )}
        </div>

        {/* ── Quick actions ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/orders/chandelier/new" className="flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl px-3.5 py-2 transition-colors">
            <Plus className="w-3.5 h-3.5" />{t('cat.chandelier')}
          </Link>
          <Link href="/orders/holder/new" className="flex items-center gap-1.5 text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl px-3.5 py-2 transition-colors">
            <Plus className="w-3.5 h-3.5" />{t('cat.holder')}
          </Link>
          <Link href="/filament-stock" className="flex items-center gap-1.5 text-xs font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl px-3.5 py-2 transition-colors">
            <Layers className="w-3.5 h-3.5" />{t('nav.filamentStock')}
          </Link>
          <Link href="/machines/schedule" className="flex items-center gap-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl px-3.5 py-2 transition-colors">
            <CalendarClock className="w-3.5 h-3.5" />{t('nav.schedule')}
          </Link>
          <Link href="/reports" className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3.5 py-2 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" />{t('nav.reports')}
          </Link>
        </div>

        {/* ── Filament stock alerts ───────────────────────────────────────────── */}
        {(outStockFilaments.length > 0 || lowStockFilaments.length > 0) && (
          <div className="bg-slate-900 border border-amber-500/20 rounded-xl overflow-hidden panel-amber">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <h2 className="text-slate-300 font-semibold text-xs tracking-wide">{t('dash.stockAlerts')}</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {outStockFilaments.map(f => (
                <Link key={f.id} href="/filament-stock" className="flex items-center gap-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 rounded-lg px-3 py-2 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.colorHex || '#334155' }} />
                  <span className="text-red-300 text-xs flex-1">{outStockMessage(f.colorName, f.materialType)}</span>
                </Link>
              ))}
              {lowStockFilaments.map(f => (
                <Link key={f.id} href="/filament-stock" className="flex items-center gap-2.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 rounded-lg px-3 py-2 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.colorHex || '#334155' }} />
                  <span className="text-amber-300 text-xs flex-1">{lowStockMessage(f.colorName, f.materialType, f.currentGrams)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Critical: Late + Urgent ─────────────────────────────────────────── */}
        {(lateOrders.length > 0 || urgentOrders.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Panel title={t('daily.late')} count={lateOrders.length} orders={lateOrders} emptyText={t('daily.noLate')} accent="panel-red" icon={AlertTriangle} t={t} isRTL={isRTL} maxShow={5} />
            <Panel title={t('daily.urgent')} count={urgentOrders.length} orders={urgentOrders} emptyText={t('daily.noUrgent')} accent="panel-orange" icon={Zap} t={t} isRTL={isRTL} maxShow={5} />
          </div>
        )}

        {/* ── Due Today ───────────────────────────────────────────────────────── */}
        {dueTodayOrders.length > 0 && (
          <Panel title={t('daily.dueToday')} count={dueTodayOrders.length} orders={dueTodayOrders} emptyText={t('daily.noDueToday')} accent="panel-amber" icon={Clock} t={t} isRTL={isRTL} maxShow={8} />
        )}

        {/* ── Production pipeline: Design / Slicing / Printing / QC ───────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Panel title={t('dash.inDesign')} count={designOrders.length} orders={designOrders} emptyText="" accent="panel-purple" icon={PenTool} t={t} isRTL={isRTL} maxShow={4} />
          <Panel title={t('dash.inSlicing')} count={slicingOrders.length} orders={slicingOrders} emptyText="" accent="panel-cyan" icon={Scissors} t={t} isRTL={isRTL} maxShow={4} />
          <Panel title={t('dash.inPrinting')} count={printingOrders.length} orders={printingOrders} emptyText="" accent="panel-blue" icon={Printer} t={t} isRTL={isRTL} maxShow={4} />
          <Panel title={t('dash.inQC')} count={qcOrders.length} orders={qcOrders} emptyText="" accent="panel-green" icon={Search} t={t} isRTL={isRTL} maxShow={4} />
        </div>

        {/* ── Chandelier / Holder orders ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Panel title={t('cat.chandelier')} count={chandelierActive.length} orders={chandelierActive} emptyText={t('daily.noOrders')} accent="panel-amber" icon={Lightbulb} t={t} isRTL={isRTL} maxShow={5} />
          <Panel title={t('cat.holder')} count={holderActive.length} orders={holderActive} emptyText={t('daily.noOrders')} accent="panel-cyan" icon={CircleDot} t={t} isRTL={isRTL} maxShow={5} />
        </div>

        {/* ── Machine fleet status ────────────────────────────────────────────── */}
        {machines.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                <h2 className="text-slate-300 font-semibold text-xs tracking-wide">{t('daily.machineStatus')}</h2>
              </div>
              {activeMachineCount > 0 && (
                <span className="text-xs text-cyan-400 font-medium">{activeMachineCount} {t('daily.activeMachines')}</span>
              )}
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {Object.entries(machineMap).map(([name, { active, scheduled }]) => (
                <MachineTile key={name} name={name} activeOrders={active} scheduledOrders={scheduled} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* ── Today's schedule + Next jobs to print ────────────────────────────── */}
        {(todaysScheduleOrders.length > 0 || nextJobs.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {todaysScheduleOrders.length > 0 && (
              <Panel title={t('sched.title')} count={todaysScheduleOrders.length} orders={todaysScheduleOrders} emptyText="" accent="panel-blue" icon={CalendarClock} t={t} isRTL={isRTL} maxShow={5} />
            )}
            {nextJobs.length > 0 && (
              <Panel title={t('mschedule.upcoming')} count={nextJobs.length} orders={nextJobs} emptyText="" accent="panel-purple" icon={ListChecks} t={t} isRTL={isRTL} maxShow={5} />
            )}
          </div>
        )}

        {/* ── Ready + Due tomorrow + This week ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {readyOrders.length > 0 && (
            <Panel title={t('daily.readyDelivery')} count={readyOrders.length} orders={readyOrders} emptyText="" accent="panel-green" icon={Package} t={t} isRTL={isRTL} maxShow={5} />
          )}
          {dueTomorrowOrders.length > 0 && (
            <Panel title={t('daily.dueTomorrow')} count={dueTomorrowOrders.length} orders={dueTomorrowOrders} emptyText="" accent="panel-blue" icon={Clock} t={t} isRTL={isRTL} maxShow={4} />
          )}
          {dueThisWeekOrders.length > 0 && (
            <Panel title={t('daily.dueThisWeek')} count={dueThisWeekOrders.length} orders={dueThisWeekOrders} emptyText="" accent="panel-cyan" icon={Calendar} t={t} isRTL={isRTL} maxShow={4} />
          )}
        </div>

        {/* ── Most used colors + Recent activity ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {mostUsedColors.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80">
                <Palette className="w-3.5 h-3.5 text-violet-400" />
                <h2 className="text-slate-300 font-semibold text-xs tracking-wide">{t('dash.mostUsedColors')}</h2>
              </div>
              <div className="p-3 space-y-2">
                {mostUsedColors.map(f => {
                  const max = mostUsedColors[0].usedGrams || 1;
                  return (
                    <div key={f.id} className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-700" style={{ backgroundColor: f.colorHex || '#334155' }} />
                      <span className="text-slate-400 text-xs flex-1 truncate">{f.filamentName} — {f.colorName}</span>
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.max(6, (f.usedGrams / max) * 100)}%` }} />
                      </div>
                      <span className="text-slate-500 text-xs font-mono w-14 text-end flex-shrink-0">{f.usedGrams.toLocaleString()}g</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <h2 className="text-slate-300 font-semibold text-xs tracking-wide">{t('dash.recentActivity')}</h2>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto space-y-1.5">
              {activityLoading ? (
                <div className="text-slate-600 text-xs text-center py-4">{t('common.loading')}</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-slate-600 text-xs text-center py-4">{t('activity.empty')}</div>
              ) : (
                recentActivity.map(act => {
                  const relatedOrder = orderById[act.orderId];
                  return (
                    <Link
                      key={act.id}
                      href={relatedOrder ? orderHref(relatedOrder) : '#'}
                      className="flex items-start gap-2 text-xs hover:bg-slate-800/50 rounded-lg px-1.5 py-1 transition-colors"
                    >
                      <span className="text-slate-600 flex-shrink-0 font-mono w-4 text-center pt-0.5">{ACTIVITY_ICONS[act.type] || '·'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-400 truncate">
                          {t(`activity.${act.type}` as TranslationKey)}
                          {relatedOrder && <span className="text-slate-600"> — {relatedOrder.orderName}</span>}
                        </p>
                        <p className="text-slate-700">{formatDateTime(act.timestamp)}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────────── */}
        {activeOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-slate-600" />
            </div>
            <div className="text-center flex flex-col items-center gap-2">
              <p className="text-slate-400 font-medium text-sm">{t('daily.noOrders')}</p>
              <div className="flex gap-2">
                <Link href="/orders/chandelier/new" className="flex items-center gap-1.5 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 hover:bg-amber-500/20 transition-colors">
                  <Lightbulb className="w-3.5 h-3.5" />{t('cat.chandelier')}
                </Link>
                <Link href="/orders/holder/new" className="flex items-center gap-1.5 text-cyan-400 text-xs bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5 hover:bg-cyan-500/20 transition-colors">
                  <CircleDot className="w-3.5 h-3.5" />{t('cat.holder')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
