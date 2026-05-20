'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onSnapshot, doc } from 'firebase/firestore';
import { Pencil, Trash2, ArrowRight, ArrowLeft, AlertCircle, Clock, Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { StatusBadge, PriorityBadge, BusinessBadge, LateBadge, MissingGramsBadge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import QuickActions from '@/components/order/QuickActions';
import OrderTimeline from '@/components/order/OrderTimeline';
import { db } from '@/lib/firebase';
import { deleteOrder } from '@/lib/firestore';
import { useOrderActivity } from '@/hooks/useOrderActivity';
import { useTranslation } from '@/hooks/useTranslation';
import { isLate, isMissingGrams, formatDate, formatDateTime } from '@/utils/dateUtils';
import { getEffectiveStage, stageColor } from '@/utils/stages';
import { formatCurrency } from '@/utils/formatters';
import type { Order } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

function Detail({ label, value, className = '' }: { label: string; value?: string | number | null; className?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-slate-900 font-medium ${className}`}>{value ?? '—'}</span>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, string> = {
  created: '✦', stageChanged: '→', statusChanged: '↻', started: '▶',
  finished: '■', markedReady: '✓', delivered: '★', onHold: '⏸',
  cancelled: '✕', noteAdded: '✎', fieldUpdated: '✐',
};

export default function PrintingOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { activities, loading: actLoading } = useOrderActivity(id);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', id), snap => {
      setOrder(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteOrder(id);
    router.push('/printing');
  };

  if (loading) return <DashboardLayout title={t('detail.printingTitle')}><LoadingSpinner /></DashboardLayout>;
  if (!order) return <DashboardLayout title={t('detail.printingTitle')}><p className="text-slate-500 p-6">{t('detail.notFound')}</p></DashboardLayout>;

  const totalGrams = order.splitGrams && order.gramAllocations?.length
    ? order.gramAllocations.reduce((s, a) => s + a.grams, 0)
    : order.grams || 0;

  const stage = getEffectiveStage(order);
  const BackArrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <DashboardLayout title={t('detail.printingTitle')}>
      <div className="max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/printing" className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors text-sm">
            <BackArrow className="w-4 h-4" />
            {t('common.back')}
          </Link>
          <div className="flex gap-2">
            <Link href={`/printing/${id}/edit`}>
              <Button variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>{t('common.edit')}</Button>
            </Link>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setConfirmDelete(true)}>{t('common.delete')}</Button>
          </div>
        </div>

        {/* Alerts */}
        {isLate(order) && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{t('detail.isLate')} {formatDate(order.deliveryDate)}</p>
          </div>
        )}
        {isMissingGrams(order) && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-sm">{t('detail.noGrams')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            {/* Main Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{order.orderName}</h2>
                  <p className="text-slate-500 text-sm mt-1">{order.clientName} — {order.clientPhone || '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <PriorityBadge priority={order.priority} />
                  <BusinessBadge label={order.businessLabel} />
                </div>
              </div>

              {/* Stage badge */}
              <div className="mb-5">
                <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full border font-medium ${stageColor(stage)}`}>
                  {t(`pstage.${stage}` as TranslationKey)}
                </span>
                {order.waitingReason && (
                  <span className="ms-2 text-xs text-amber-600">
                    — {t(`wait.${order.waitingReason}` as TranslationKey)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <Detail label={t('form.receivedDate')} value={formatDate(order.receivedDate)} />
                <Detail label={t('form.deliveryDate')} value={formatDate(order.deliveryDate)} className={isLate(order) ? 'text-red-500' : ''} />
                <Detail label={t('printing.machine')} value={order.machineName || order.machineId} />
                <Detail label={t('printing.material')} value={order.material} />
                <Detail label={t('printing.color')} value={order.color} />
                <Detail label={t('printing.quantity')} value={order.quantity} />
                <Detail label={t('printing.grams')} value={totalGrams ? `${totalGrams} ${t('common.grams')}` : undefined} />
                <Detail label={t('detail.orderReceived')} value={formatDate(order.createdAt)} />
              </div>
            </div>

            {/* Scheduling */}
            {(order.plannedStartDate || order.actualStartTime || order.deliveredDate) && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-4 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  {t('sched.title')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.plannedStartDate && <Detail label={t('sched.startDate')} value={`${formatDate(order.plannedStartDate)} ${order.printStartTime || ''}`} />}
                  {order.printEndDate && <Detail label={t('sched.endDate')} value={`${formatDate(order.printEndDate)} ${order.printEndTime || ''}`} />}
                  {order.printDurationHours != null && <Detail label={t('sched.duration')} value={`${order.printDurationHours}h`} />}
                  {order.actualStartTime && <Detail label={t('timeline.actualStart')} value={formatDateTime(order.actualStartTime)} className="text-green-600" />}
                  {order.actualFinishTime && <Detail label={t('timeline.actualFinish')} value={formatDateTime(order.actualFinishTime)} className="text-green-600" />}
                  {order.deliveredDate && <Detail label={t('timeline.delivered')} value={formatDateTime(order.deliveredDate)} className="text-purple-600" />}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <QuickActions order={order} />

            {/* Gram Allocations */}
            {order.splitGrams && order.gramAllocations && order.gramAllocations.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-4">{t('detail.gramSplit')}</h3>
                <div className="space-y-2">
                  {order.gramAllocations.map((alloc, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BusinessBadge label={alloc.businessLabel} />
                        <span className="text-slate-600 text-sm">{alloc.machineName || alloc.machineId}</span>
                      </div>
                      <span className="text-blue-600 font-mono font-medium">{alloc.grams} {t('common.grams')}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    <span className="text-slate-700 font-medium">{t('gram.total')}</span>
                    <span className="text-blue-700 font-mono font-bold">{totalGrams} {t('common.grams')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Financial */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-slate-900 font-semibold mb-4">{t('fin.finance')}</h3>
              <div className="grid grid-cols-3 gap-5">
                <div className="text-center bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">{t('fin.price')}</div>
                  <div className="text-slate-900 font-bold text-lg">{formatCurrency(order.price)} {t('common.sar')}</div>
                </div>
                <div className="text-center bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">{t('fin.paid')}</div>
                  <div className="text-green-600 font-bold text-lg">{formatCurrency(order.paidAmount)} {t('common.sar')}</div>
                </div>
                <div className="text-center bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">{t('fin.remaining')}</div>
                  <div className="text-orange-600 font-bold text-lg">{formatCurrency(order.remainingAmount)} {t('common.sar')}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-2">{t('common.notes')}</h3>
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Timeline */}
            <OrderTimeline order={order} />

            {/* Activity log */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-slate-800 font-semibold mb-3 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                {t('activity.title')}
              </h3>
              {actLoading ? (
                <div className="text-slate-400 text-xs text-center py-4">{t('common.loading')}</div>
              ) : activities.length === 0 ? (
                <div className="text-slate-400 text-xs text-center py-4">{t('activity.empty')}</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {activities.map(act => (
                    <div key={act.id} className="flex gap-2 text-xs">
                      <span className="text-slate-400 flex-shrink-0 font-mono w-4 text-center">
                        {ACTIVITY_ICONS[act.type] || '·'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700">
                          {t(`activity.${act.type}` as TranslationKey)}
                          {act.previousValue && act.newValue && (
                            <span className="text-slate-400"> {t('activity.from')} {act.previousValue} {t('activity.to')} {act.newValue}</span>
                          )}
                          {act.note && act.type === 'onHold' && (
                            <span className="text-amber-600"> — {t(`wait.${act.note}` as TranslationKey)}</span>
                          )}
                        </p>
                        <p className="text-slate-400">{formatDateTime(act.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} loading={deleting} />
    </DashboardLayout>
  );
}
