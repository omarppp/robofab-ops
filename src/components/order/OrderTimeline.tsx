'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import type { Order } from '@/types';

interface TimelineEvent {
  label: string;
  value?: string;
  done: boolean;
  late?: boolean;
  accent?: 'cyan' | 'green' | 'amber' | 'red' | 'purple';
}

interface Props {
  order: Order;
}

export default function OrderTimeline({ order }: Props) {
  const { t } = useTranslation();

  const now = new Date();
  const deliveryPassed = order.deliveryDate ? new Date(order.deliveryDate) < now : false;
  const isDelivered = order.stage === 'delivered' || order.status === 'delivered';

  const events: TimelineEvent[] = [
    {
      label: t('timeline.created'),
      value: formatDateTime(order.createdAt),
      done: true,
      accent: 'cyan',
    },
    ...(order.plannedStartDate && order.printStartTime ? [{
      label: t('timeline.printStart'),
      value: `${formatDate(order.plannedStartDate)} ${order.printStartTime}`,
      done: !!order.actualStartTime,
      accent: 'amber' as const,
    }] : []),
    ...(order.actualStartTime ? [{
      label: t('timeline.actualStart'),
      value: formatDateTime(order.actualStartTime),
      done: true,
      accent: 'green' as const,
    }] : []),
    ...(order.printEndDate && order.printEndTime ? [{
      label: t('timeline.printEnd'),
      value: `${formatDate(order.printEndDate)} ${order.printEndTime}`,
      done: !!order.actualFinishTime,
      accent: 'amber' as const,
    }] : []),
    ...(order.actualFinishTime ? [{
      label: t('timeline.actualFinish'),
      value: formatDateTime(order.actualFinishTime),
      done: true,
      accent: 'green' as const,
    }] : []),
    {
      label: t('timeline.delivery'),
      value: formatDate(order.deliveryDate),
      done: isDelivered,
      late: deliveryPassed && !isDelivered,
      accent: deliveryPassed && !isDelivered ? 'red' : 'purple',
    },
    ...(order.deliveredDate ? [{
      label: t('timeline.delivered'),
      value: formatDateTime(order.deliveredDate),
      done: true,
      accent: 'green' as const,
    }] : []),
  ];

  const dotMap: Record<string, string> = {
    cyan:   'bg-cyan-500 border-cyan-500',
    green:  'bg-green-500 border-green-500',
    amber:  'bg-amber-500 border-amber-500',
    red:    'bg-red-500 border-red-500',
    purple: 'bg-violet-500 border-violet-500',
  };
  const textMap: Record<string, string> = {
    cyan:   'text-cyan-400',
    green:  'text-green-400',
    amber:  'text-amber-400',
    red:    'text-red-400',
    purple: 'text-violet-400',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-slate-200 font-semibold mb-4 text-sm">{t('timeline.title')}</h3>
      <div className="relative">
        {events.map((ev, i) => {
          const accent = ev.accent || 'cyan';
          const dotCls = ev.done ? dotMap[accent] : 'bg-slate-800 border-slate-600';
          const labelCls = ev.done ? textMap[accent] : 'text-slate-600';
          const isLast = i === events.length - 1;
          return (
            <div key={i} className="flex gap-4 relative">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5 ${dotCls}`} />
                {!isLast && <div className="w-0.5 bg-slate-800 flex-1 my-1" />}
              </div>
              <div className="pb-4 min-h-[28px]">
                <p className={`text-xs font-medium leading-tight ${labelCls}`}>{ev.label}</p>
                {ev.value && (
                  <p className="text-slate-600 text-xs mt-0.5">{ev.value}</p>
                )}
                {ev.late && <p className="text-red-400 text-xs mt-0.5">{t('alert.late')}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
