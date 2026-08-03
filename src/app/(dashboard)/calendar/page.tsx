'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Lightbulb, CircleDot, Package, Printer } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAllOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { orderHref, getOrderCategoryPath } from '@/utils/orderLinks';
import type { OrderCategory } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

const CATEGORY_CONFIG: Record<OrderCategory, { color: string; icon: typeof Lightbulb }> = {
  chandelier: { color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',   icon: Lightbulb },
  holder:     { color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',      icon: CircleDot },
  general:    { color: 'bg-violet-500/10 border-violet-500/20 text-violet-400', icon: Package },
};

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekStart(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(date: Date, dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
}

export default function CalendarPage() {
  const { t, isRTL } = useTranslation();
  const { orders, loading } = useAllOrders();
  const [weekOffset, setWeekOffset] = useState(0);

  const days = useMemo(() => {
    const start = getWeekStart(weekOffset);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [weekOffset]);

  const dayOrders = useMemo(() => days.map(day => ({
    deliveries: orders.filter(o => isSameDay(day, o.deliveryDate) && o.stage !== 'cancelled'),
    printStart: orders.filter(o => isSameDay(day, o.plannedStartDate) && o.stage !== 'cancelled'),
  })), [orders, days]);

  const todayIdx = days.findIndex(d => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;

  return (
    <DashboardLayout title={t('cal.title')}>
      <div className="space-y-4 animate-fade-in">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setWeekOffset(w => w - 1)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors text-sm">
            <Prev className="w-4 h-4" /> {t('cal.prevWeek')}
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-slate-300 font-semibold text-sm">
              {days[0].toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}
              {' — '}
              {days[6].toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h2>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded-lg transition-colors">
                {t('cal.today')}
              </button>
            )}
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors text-sm">
            {t('cal.nextWeek')} <Next className="w-4 h-4" />
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-7 gap-2 min-h-[500px]">
            {days.map((day, i) => {
              const { deliveries, printStart } = dayOrders[i];
              const isToday = i === todayIdx;
              const dayNames = isRTL ? DAY_NAMES_AR : DAY_NAMES_EN;
              const hasOrders = deliveries.length > 0 || printStart.length > 0;

              return (
                <div key={i} className={`rounded-xl border flex flex-col transition-all ${
                  isToday
                    ? 'border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/5'
                    : hasOrders
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-slate-800 bg-slate-900/60'
                }`}>
                  <div className={`px-2 py-2 border-b text-center ${isToday ? 'border-blue-500/20' : 'border-slate-800'}`}>
                    <div className={`text-xs font-medium ${isToday ? 'text-blue-400' : 'text-slate-600'}`}>
                      {dayNames[day.getDay()]}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-300' : 'text-slate-300'}`}>
                      {day.getDate()}
                    </div>
                    <div className="text-xs text-slate-600">
                      {day.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short' })}
                    </div>
                  </div>

                  <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                    {deliveries.map(o => {
                      const cfg = CATEGORY_CONFIG[getOrderCategoryPath(o)];
                      const Icon = cfg.icon;
                      return (
                        <Link key={`d-${o.id}`} href={orderHref(o)}>
                          <div className={`text-xs rounded-lg px-1.5 py-1 border truncate flex items-center gap-1 hover:opacity-70 transition-opacity ${cfg.color}`}>
                            <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{o.orderName}</span>
                          </div>
                        </Link>
                      );
                    })}
                    {printStart.map(o => (
                      <Link key={`p-${o.id}`} href={orderHref(o)}>
                        <div className="text-xs rounded-lg px-1.5 py-1 border border-slate-700 bg-slate-800 text-slate-500 truncate flex items-center gap-1 hover:opacity-70 transition-opacity">
                          <Printer className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">▶ {o.orderName}</span>
                        </div>
                      </Link>
                    ))}
                    {!hasOrders && (
                      <p className="text-slate-800 text-xs text-center pt-4">{t('cal.noOrders')}</p>
                    )}
                  </div>

                  {hasOrders && (
                    <div className="px-2 pb-1.5 text-center">
                      <span className="text-xs text-slate-600">{deliveries.length + printStart.length}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2">
          {(Object.entries(CATEGORY_CONFIG) as [OrderCategory, typeof CATEGORY_CONFIG['chandelier']][]).map(([cat, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={cat} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${cfg.color}`}>
                <Icon className="w-3 h-3" />
                <span>{t(`cat.${cat}` as TranslationKey)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
