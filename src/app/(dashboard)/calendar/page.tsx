'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Printer, Pen, CircuitBoard, Truck } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAllOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import type { Order, OrderSection } from '@/types';

const SECTION_CONFIG: Record<OrderSection, { color: string; icon: typeof Printer }> = {
  printing3d:        { color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Printer },
  design:            { color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Pen },
  pcbPrinting:       { color: 'bg-green-50 border-green-200 text-green-700', icon: CircuitBoard },
  outsourcedPrinting:{ color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Truck },
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

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

interface DayOrders {
  deliveries: Order[];
  printStart: Order[];
}

export default function CalendarPage() {
  const { t, isRTL } = useTranslation();
  const { orders, loading } = useAllOrders();
  const [weekOffset, setWeekOffset] = useState(0);

  const days = useMemo(() => {
    const start = getWeekStart(weekOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const dayOrders = useMemo((): DayOrders[] => {
    return days.map(day => ({
      deliveries: orders.filter(o =>
        isSameDay(day, o.deliveryDate) &&
        o.status !== 'cancelled'
      ),
      printStart: orders.filter(o =>
        o.section === 'printing3d' &&
        isSameDay(day, o.plannedStartDate) &&
        o.status !== 'cancelled'
      ),
    }));
  }, [orders, days]);

  const todayIdx = days.findIndex(d => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;

  return (
    <DashboardLayout title={t('cal.title')}>
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm"
          >
            <Prev className="w-4 h-4" /> {t('cal.prevWeek')}
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-slate-900 font-semibold">
              {days[0].toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}
              {' — '}
              {days[6].toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h2>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-lg transition-colors"
              >
                {t('cal.today')}
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm"
          >
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
                <div
                  key={i}
                  className={`rounded-xl border flex flex-col ${
                    isToday
                      ? 'border-blue-300 bg-blue-50'
                      : hasOrders
                      ? 'border-slate-200 bg-white shadow-sm'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  {/* Day header */}
                  <div className={`px-2 py-2 border-b text-center ${isToday ? 'border-blue-200' : 'border-slate-100'}`}>
                    <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                      {dayNames[day.getDay()]}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-700' : 'text-slate-800'}`}>
                      {day.getDate()}
                    </div>
                    <div className="text-xs text-slate-400">{formatDayHeader(day)}</div>
                  </div>

                  {/* Orders */}
                  <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                    {deliveries.map(o => {
                      const cfg = SECTION_CONFIG[o.section];
                      const Icon = cfg.icon;
                      return (
                        <Link key={`d-${o.id}`} href={`/${o.section === 'printing3d' ? 'printing' : o.section === 'pcbPrinting' ? 'pcb' : o.section === 'outsourcedPrinting' ? 'outsourced' : 'design'}/${o.id}`}>
                          <div className={`text-xs rounded-lg px-1.5 py-1 border truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${cfg.color}`}>
                            <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{o.orderName}</span>
                          </div>
                        </Link>
                      );
                    })}

                    {printStart.map(o => (
                      <Link key={`p-${o.id}`} href={`/printing/${o.id}`}>
                        <div className="text-xs rounded-lg px-1.5 py-1 border border-slate-200 bg-slate-100 text-slate-500 truncate flex items-center gap-1 hover:opacity-80 transition-opacity">
                          <Printer className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">▶ {o.orderName}</span>
                        </div>
                      </Link>
                    ))}

                    {!hasOrders && (
                      <p className="text-slate-300 text-xs text-center pt-4">{t('cal.noOrders')}</p>
                    )}
                  </div>

                  {/* Count badge */}
                  {hasOrders && (
                    <div className="px-2 pb-1.5 text-center">
                      <span className="text-xs text-slate-400">
                        {deliveries.length + printStart.length}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2">
          {(Object.entries(SECTION_CONFIG) as [OrderSection, typeof SECTION_CONFIG[OrderSection]][]).map(([section, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={section} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${cfg.color}`}>
                <Icon className="w-3 h-3" />
                <span>{t(`section.${section}` as Parameters<typeof t>[0])}</span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
