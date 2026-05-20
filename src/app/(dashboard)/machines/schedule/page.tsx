'use client';
import Link from 'next/link';
import { Cpu, Play, Clock, Calendar, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useMachines } from '@/hooks/useMachines';
import { useOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { getEffectiveStage } from '@/utils/stages';
import { formatDate } from '@/utils/dateUtils';
import type { Order } from '@/types';

function jobTimeRange(o: Order): string {
  if (!o.plannedStartDate) return '';
  const start = `${formatDate(o.plannedStartDate)} ${o.printStartTime || ''}`;
  const end = o.printEndDate ? `— ${formatDate(o.printEndDate)} ${o.printEndTime || ''}` : '';
  return `${start} ${end}`.trim();
}

export default function MachineSchedulePage() {
  const { t } = useTranslation();
  const { machines, loading: mLoading } = useMachines();
  const { orders, loading: oLoading } = useOrders('printing3d');

  const loading = mLoading || oLoading;

  const activeOrders = orders.filter(o => {
    const s = getEffectiveStage(o);
    return s !== 'delivered' && s !== 'cancelled';
  });

  const getMachineJobs = (machineId: string) => {
    const jobs = activeOrders.filter(o => o.machineId === machineId);
    const printing = jobs.filter(o => getEffectiveStage(o) === 'printing');
    const scheduled = jobs.filter(o => getEffectiveStage(o) === 'scheduledPrinting');
    const other = jobs.filter(o => !['printing', 'scheduledPrinting'].includes(getEffectiveStage(o)));
    return { printing, scheduled, other };
  };

  const busyMachines = machines.filter(m => {
    const { printing } = getMachineJobs(m.id);
    return printing.length > 0;
  });

  return (
    <DashboardLayout title={t('mschedule.title')}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/machines" className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-slate-900 font-bold text-lg">{t('mschedule.title')}</h1>
            <p className="text-slate-500 text-sm">{t('mschedule.allMachines')}</p>
          </div>
        </div>

        {/* Overview strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{machines.length}</div>
            <div className="text-slate-500 text-xs mt-1">{t('mschedule.allMachines')}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{busyMachines.length}</div>
            <div className="text-slate-500 text-xs mt-1">{t('mschedule.busy')}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-500">{machines.length - busyMachines.length}</div>
            <div className="text-slate-500 text-xs mt-1">{t('mschedule.free')}</div>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {machines.map(machine => {
              const { printing, scheduled, other } = getMachineJobs(machine.id);
              const isBusy = printing.length > 0;
              const isScheduled = scheduled.length > 0;

              return (
                <div
                  key={machine.id}
                  className={`bg-white border rounded-xl p-4 shadow-sm ${
                    isBusy ? 'border-green-300' : isScheduled ? 'border-blue-200' : 'border-slate-200'
                  }`}
                >
                  {/* Machine header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-green-500 animate-pulse' : isScheduled ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900 font-semibold text-sm">{machine.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isBusy ? 'bg-green-50 text-green-700 border border-green-200' : isScheduled ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {isBusy ? t('mschedule.busy') : isScheduled ? t('mschedule.scheduled') : t('mschedule.free')}
                    </span>
                  </div>

                  {/* Printing now */}
                  {printing.map(o => (
                    <Link key={o.id} href={`/printing/${o.id}`} className="block mb-2">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 hover:border-green-300 transition-colors">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Play className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="text-green-700 text-xs font-medium truncate">{o.orderName}</span>
                        </div>
                        <p className="text-slate-500 text-xs truncate">{o.clientName}</p>
                        {o.plannedStartDate && (
                          <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {jobTimeRange(o)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}

                  {/* Scheduled */}
                  {scheduled.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400 mb-1.5">{t('mschedule.upcoming')}</p>
                      {scheduled.map(o => (
                        <Link key={o.id} href={`/printing/${o.id}`} className="block mb-1.5">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 hover:border-blue-300 transition-colors">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              <span className="text-slate-700 text-xs truncate">{o.orderName}</span>
                            </div>
                            {o.plannedStartDate && (
                              <p className="text-slate-400 text-xs">{jobTimeRange(o)}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Other active orders on this machine */}
                  {other.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">{other.length} {t('mschedule.upcoming')} orders</p>
                    </div>
                  )}

                  {printing.length === 0 && scheduled.length === 0 && other.length === 0 && (
                    <p className="text-slate-400 text-xs text-center py-3">{t('mschedule.noJobs')}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
