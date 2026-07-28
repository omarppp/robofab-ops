'use client';
import Link from 'next/link';
import { Cpu, Play, Clock, Calendar, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useMachines } from '@/hooks/useMachines';
import { useAllOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { isTerminalStage } from '@/utils/stages';
import { formatDate } from '@/utils/dateUtils';
import type { Order } from '@/types';

function jobTimeRange(o: Order): string {
  if (!o.plannedStartDate) return '';
  const start = `${formatDate(o.plannedStartDate)} ${o.printStartTime || ''}`;
  const end = o.printEndDate ? `— ${formatDate(o.printEndDate)} ${o.printEndTime || ''}` : '';
  return `${start} ${end}`.trim();
}

function orderHref(o: Order): string {
  return `/orders/${o.category}/${o.id}`;
}

export default function MachineSchedulePage() {
  const { t } = useTranslation();
  const { machines, loading: mLoading } = useMachines();
  const { orders, loading: oLoading } = useAllOrders();

  const loading = mLoading || oLoading;

  const activeOrders = orders.filter(o => !isTerminalStage(o.stage));

  const getMachineJobs = (machineId: string) => {
    const jobs = activeOrders.filter(o => o.machineId === machineId);
    const printing = jobs.filter(o => o.stage === 'printing');
    const scheduled = jobs.filter(o => o.stage === 'scheduledPrinting');
    const other = jobs.filter(o => !['printing', 'scheduledPrinting'].includes(o.stage));
    return { printing, scheduled, other };
  };

  const busyMachines = machines.filter(m => getMachineJobs(m.id).printing.length > 0);

  return (
    <DashboardLayout title={t('mschedule.title')}>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/machines" className="text-slate-500 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-slate-200 font-bold text-lg">{t('mschedule.title')}</h1>
            <p className="text-slate-500 text-sm">{t('mschedule.allMachines')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-100">{machines.length}</div>
            <div className="text-slate-500 text-xs mt-1">{t('mschedule.allMachines')}</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{busyMachines.length}</div>
            <div className="text-slate-500 text-xs mt-1">{t('mschedule.busy')}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-400">{machines.length - busyMachines.length}</div>
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
                  className={`bg-slate-900 border rounded-xl p-4 transition-all ${
                    isBusy ? 'border-green-500/30' : isScheduled ? 'border-blue-500/30' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-green-500 animate-pulse' : isScheduled ? 'bg-blue-500' : 'bg-slate-700'}`} />
                      <Cpu className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-200 font-semibold text-sm">{machine.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      isBusy ? 'bg-green-500/10 text-green-400 border-green-500/20' : isScheduled ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      {isBusy ? t('mschedule.busy') : isScheduled ? t('mschedule.scheduled') : t('mschedule.free')}
                    </span>
                  </div>

                  {printing.map(o => (
                    <Link key={o.id} href={orderHref(o)} className="block mb-2">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 hover:border-green-500/40 transition-colors">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Play className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span className="text-green-300 text-xs font-medium truncate">{o.orderName}</span>
                        </div>
                        <p className="text-slate-500 text-xs truncate">{o.clientName}</p>
                        {o.plannedStartDate && (
                          <p className="text-slate-600 text-xs mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {jobTimeRange(o)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}

                  {scheduled.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-600 mb-1.5">{t('mschedule.upcoming')}</p>
                      {scheduled.map(o => (
                        <Link key={o.id} href={orderHref(o)} className="block mb-1.5">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 hover:border-blue-500/40 transition-colors">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Calendar className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <span className="text-slate-300 text-xs truncate">{o.orderName}</span>
                            </div>
                            {o.plannedStartDate && (
                              <p className="text-slate-600 text-xs">{jobTimeRange(o)}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {other.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <p className="text-xs text-slate-600 mb-1">{other.length} {t('mschedule.upcoming')} orders</p>
                    </div>
                  )}

                  {printing.length === 0 && scheduled.length === 0 && other.length === 0 && (
                    <p className="text-slate-700 text-xs text-center py-3">{t('mschedule.noJobs')}</p>
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
