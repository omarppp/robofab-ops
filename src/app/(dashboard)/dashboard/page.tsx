'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Zap, Package, Clock, CheckCircle2, AlertCircle,
  Cpu, ArrowRight, ArrowLeft, Calendar, Printer, Pen, CircuitBoard, Truck,
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

const ROBOFAB_COLOR = '#0284c7';
const TECHNOVA_COLOR = '#9333ea';

const SECTION_HREF: Record<OrderSection, string> = {
  printing3d: '/printing',
  design: '/design',
  pcbPrinting: '/pcb',
  outsourcedPrinting: '/outsourced',
};

const SECTION_ICON: Record<OrderSection, React.ElementType> = {
  printing3d: Printer,
  design: Pen,
  pcbPrinting: CircuitBoard,
  outsourcedPrinting: Truck,
};

const SECTION_KEY: Record<OrderSection, TranslationKey> = {
  printing3d: 'daily.section3d',
  design: 'daily.sectionDesign',
  pcbPrinting: 'daily.sectionPcb',
  outsourcedPrinting: 'daily.sectionOut',
};

// ── Order card for the daily board ────────────────────────────────────────────
function DailyCard({ order, t, isRTL }: { order: Order; t: (k: TranslationKey) => string; isRTL: boolean }) {
  const stage = getEffectiveStage(order);
  const SectionIcon = SECTION_ICON[order.section];
  const href = `${SECTION_HREF[order.section]}/${order.id}`;
  const overdue = isLate(order) ? daysOverdue(order.deliveryDate) : 0;
  const remaining = !isLate(order) && order.deliveryDate ? daysUntil(order.deliveryDate) : 0;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Link href={href} className={`block bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all group shadow-sm hover:shadow-md ${priorityBorder(order.priority)}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot(order.priority)}`} />
          <span className="text-slate-900 font-semibold text-sm truncate">{order.orderName}</span>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${
          order.businessLabel === 'RoboFab'
            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
            : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}>
          <span className="w-1 h-1 rounded-full" style={{ background: order.businessLabel === 'RoboFab' ? ROBOFAB_COLOR : TECHNOVA_COLOR }} />
          {order.businessLabel === 'TechNova' ? 'Tech Nova' : 'RoboFab'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 flex-wrap">
        <span>{order.clientName}</span>
        {order.machineName && (
          <>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />{order.machineName}
            </span>
          </>
        )}
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1">
          <SectionIcon className="w-3 h-3" />{t(SECTION_KEY[order.section])}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${stageColor(stage)}`}>
          {stage}
        </span>
        <div className="flex items-center gap-2">
          {isLate(order) ? (
            <span className="text-red-500 text-xs font-medium">{overdue} {t('daily.daysLate')}</span>
          ) : order.deliveryDate ? (
            remaining === 0
              ? <span className="text-amber-600 text-xs font-semibold">{t('daily.today')}</span>
              : <span className="text-slate-400 text-xs">{remaining} {t('daily.days')}</span>
          ) : null}
          <ArrowIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

// ── Section panel ─────────────────────────────────────────────────────────────
function Section({
  title, orders, emptyText, icon: Icon, accentClass, t, isRTL, maxShow = 6,
}: {
  title: string; orders: Order[]; emptyText: string; icon: React.ElementType;
  accentClass: string; t: (k: TranslationKey) => string; isRTL: boolean; maxShow?: number;
}) {
  if (orders.length === 0 && emptyText === '') return null;

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm ${accentClass}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <h2 className="text-slate-800 font-semibold text-sm">{title}</h2>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs py-3">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, maxShow).map(o => (
            <DailyCard key={o.id} order={o} t={t} isRTL={isRTL} />
          ))}
          {orders.length > maxShow && (
            <div className="text-xs text-slate-400 text-center pt-1">
              +{orders.length - maxShow} {t('daily.noOrders') === 'لا توجد طلبات' ? 'أكثر' : 'more'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Machine tile ──────────────────────────────────────────────────────────────
function MachineTile({
  name, activeOrders, scheduledOrders, t,
}: {
  name: string;
  activeOrders: Order[];
  scheduledOrders: Order[];
  t: (k: TranslationKey) => string;
}) {
  const total = activeOrders.length + scheduledOrders.length;
  const isPrinting = activeOrders.length > 0;

  return (
    <div className={`rounded-xl p-4 border ${isPrinting ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <Cpu className={`w-4 h-4 flex-shrink-0 ${isPrinting ? 'text-blue-500' : 'text-slate-400'}`} />
        <span className="text-slate-800 text-sm font-medium truncate">{name}</span>
        {isPrinting && (
          <span className="ms-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex-shrink-0">
            {t('daily.printing')}
          </span>
        )}
        {!isPrinting && total === 0 && (
          <span className="ms-auto text-xs text-slate-400 flex-shrink-0">{t('daily.idle')}</span>
        )}
      </div>
      {activeOrders.map(o => (
        <div key={o.id} className="text-xs text-blue-600 truncate ps-6">{o.orderName} · {o.clientName}</div>
      ))}
      {scheduledOrders.map(o => (
        <div key={o.id} className="text-xs text-slate-500 truncate ps-6">{o.orderName} · {o.clientName}</div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { orders, loading } = useAllOrders();
  const { machines } = useMachines();
  const { t, language, isRTL } = useTranslation();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const active = (o: Order) => o.status !== 'delivered' && o.status !== 'cancelled';

  const lateOrders = useMemo(() => orders.filter(o => isLate(o) && active(o)), [orders]);
  const urgentOrders = useMemo(() => orders.filter(o => o.priority === 'urgent' && active(o) && !isLate(o)), [orders]);
  const dueTodayOrders = useMemo(() => orders.filter(o => isToday(o.deliveryDate) && active(o) && !isLate(o)), [orders]);
  const dueTomorrowOrders = useMemo(() => orders.filter(o => isDueTomorrow(o.deliveryDate) && active(o)), [orders]);
  const dueThisWeekOrders = useMemo(() => orders.filter(o => {
    if (!o.deliveryDate || !active(o) || isToday(o.deliveryDate) || isDueTomorrow(o.deliveryDate) || isLate(o)) return false;
    return isDueThisWeek(o.deliveryDate);
  }), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => isReadyStage(getEffectiveStage(o)) && active(o)), [orders]);
  const blockedOrders = useMemo(() => orders.filter(o => isBlockedStage(getEffectiveStage(o)) && active(o)), [orders]);
  const missingGramsOrders = useMemo(() => orders.filter(isMissingGrams), [orders]);
  const noDateOrders = useMemo(() => orders.filter(o => !o.deliveryDate && active(o)), [orders]);
  const activeOrders = useMemo(() => orders.filter(active), [orders]);

  // Machine status: printing3d orders that are actively printing or scheduled
  const machineMap = useMemo(() => {
    const map: Record<string, { active: Order[]; scheduled: Order[] }> = {};
    for (const m of machines) {
      map[m.name] = { active: [], scheduled: [] };
    }
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
      <div className="space-y-5">

        {/* ── Header: date + overview strip ──────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-slate-900 font-bold text-lg">{t('daily.title')}</h1>
              <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />{todayStr}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: t('daily.lateCount'), value: lateOrders.length, cls: lateOrders.length > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200' },
                { label: t('daily.urgentCount'), value: urgentOrders.length, cls: urgentOrders.length > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200' },
                { label: t('daily.dueToday'), value: dueTodayOrders.length, cls: dueTodayOrders.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200' },
                { label: t('daily.readyCount'), value: readyOrders.length, cls: readyOrders.length > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200' },
                { label: t('daily.activeMachines'), value: activeMachineCount, cls: activeMachineCount > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200' },
                { label: t('daily.ordersActive'), value: activeOrders.length, cls: 'bg-slate-50 text-slate-700 border-slate-200' },
              ].map(({ label, value, cls }) => (
                <div key={label} className={`flex flex-col items-center rounded-xl px-4 py-2 border ${cls}`}>
                  <span className="font-bold text-xl leading-tight">{value}</span>
                  <span className="text-xs opacity-80 mt-0.5 whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All-clear banner */}
          {criticalCount === 0 && dueTodayOrders.length === 0 && (
            <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-green-700 text-sm">{t('daily.allClear')}</span>
            </div>
          )}
        </div>

        {/* ── Critical: Late + Urgent (prominently at the top) ───────────────── */}
        {(lateOrders.length > 0 || urgentOrders.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section
              title={`⚠ ${t('daily.late')}`}
              orders={lateOrders}
              emptyText={t('daily.noLate')}
              icon={AlertTriangle}
              accentClass={lateOrders.length > 0 ? 'border-red-300' : 'border-slate-200'}
              t={t} isRTL={isRTL} maxShow={5}
            />
            <Section
              title={`⚡ ${t('daily.urgent')}`}
              orders={urgentOrders}
              emptyText={t('daily.noUrgent')}
              icon={Zap}
              accentClass={urgentOrders.length > 0 ? 'border-orange-300' : 'border-slate-200'}
              t={t} isRTL={isRTL} maxShow={5}
            />
          </div>
        )}

        {/* ── Due Today ──────────────────────────────────────────────────────── */}
        <Section
          title={`📅 ${t('daily.dueToday')}`}
          orders={dueTodayOrders}
          emptyText={t('daily.noDueToday')}
          icon={Clock}
          accentClass={dueTodayOrders.length > 0 ? 'border-amber-300' : 'border-slate-200'}
          t={t} isRTL={isRTL} maxShow={8}
        />

        {/* ── Machine status ──────────────────────────────────────────────────── */}
        {machines.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-blue-500" />
              <h2 className="text-slate-800 font-semibold text-sm">{t('daily.machineStatus')}</h2>
              {activeMachineCount > 0 && (
                <span className="ms-auto text-xs text-blue-600 font-medium">{activeMachineCount} {t('daily.activeMachines')}</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Object.entries(machineMap).map(([name, { active, scheduled }]) => (
                <MachineTile key={name} name={name} activeOrders={active} scheduledOrders={scheduled} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* ── Ready for delivery ──────────────────────────────────────────────── */}
        {readyOrders.length > 0 && (
          <Section
            title={`📦 ${t('daily.readyDelivery')}`}
            orders={readyOrders}
            emptyText=""
            icon={Package}
            accentClass="border-green-300"
            t={t} isRTL={isRTL} maxShow={6}
          />
        )}

        {/* ── Due tomorrow + this week (side by side) ────────────────────────── */}
        {(dueTomorrowOrders.length > 0 || dueThisWeekOrders.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dueTomorrowOrders.length > 0 && (
              <Section
                title={`📅 ${t('daily.dueTomorrow')}`}
                orders={dueTomorrowOrders}
                emptyText=""
                icon={Clock}
                accentClass="border-blue-200"
                t={t} isRTL={isRTL} maxShow={5}
              />
            )}
            {dueThisWeekOrders.length > 0 && (
              <Section
                title={`📅 ${t('daily.dueThisWeek')}`}
                orders={dueThisWeekOrders}
                emptyText=""
                icon={Calendar}
                accentClass="border-indigo-200"
                t={t} isRTL={isRTL} maxShow={5}
              />
            )}
          </div>
        )}

        {/* ── Blocked + Alerts ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blockedOrders.length > 0 && (
            <Section
              title={`⏸ ${t('daily.blocked')}`}
              orders={blockedOrders}
              emptyText=""
              icon={AlertCircle}
              accentClass="border-yellow-300"
              t={t} isRTL={isRTL} maxShow={5}
            />
          )}

          {/* Alerts panel */}
          {(missingGramsOrders.length > 0 || noDateOrders.length > 0) && (
            <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h2 className="text-slate-800 font-semibold text-sm">{t('daily.alerts')}</h2>
              </div>
              <div className="space-y-2">
                {noDateOrders.length > 0 && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-slate-600 text-xs flex-1">{t('daily.noDate')}</span>
                    <span className="font-bold text-amber-600 text-sm">{noDateOrders.length}</span>
                  </div>
                )}
                {missingGramsOrders.length > 0 && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                    <span className="text-slate-600 text-xs flex-1">{t('daily.missingGrams')}</span>
                    <span className="font-bold text-orange-600 text-sm">{missingGramsOrders.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────────── */}
        {activeOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">{t('daily.noOrders')}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
