'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onSnapshot, doc } from 'firebase/firestore';
import { Pencil, Trash2, ArrowRight, ArrowLeft, AlertCircle, Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { PriorityBadge, CategoryBadge, StageBadge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import QuickActions from '@/components/order/QuickActions';
import OrderTimeline from '@/components/order/OrderTimeline';
import { db } from '@/lib/firebase';
import { deleteOrderWithStock } from '@/lib/orders';
import { useOrderActivity } from '@/hooks/useOrderActivity';
import { useTranslation } from '@/hooks/useTranslation';
import { isLate, formatDate, formatDateTime } from '@/utils/dateUtils';
import { formatCurrency, MATERIAL_TYPE_LABELS } from '@/utils/formatters';
import type { Order } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

function Detail({ label, value, className = '' }: { label: string; value?: string | number | null; className?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-600 uppercase tracking-wider">{label}</span>
      <span className={`text-slate-200 font-medium ${className}`}>{value ?? '—'}</span>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, string> = {
  created: '✦', stageChanged: '→', started: '▶', finished: '■',
  markedReady: '✓', delivered: '★', cancelled: '✕', noteAdded: '✎',
  fieldUpdated: '✐', filamentReserved: '◆', filamentConsumed: '◇',
  filamentReleased: '↺', machineSelected: '⚙', deliveryDateChanged: '📅', paymentUpdated: '$',
};

interface Props {
  id: string;
  backHref: string;
}

export default function OrderDetailPage({ id, backHref }: Props) {
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
    await deleteOrderWithStock(id);
    router.push(backHref);
  };

  if (loading) return <DashboardLayout title={t('detail.title')}><LoadingSpinner /></DashboardLayout>;
  if (!order) return <DashboardLayout title={t('detail.title')}><p className="text-slate-500 p-6">{t('detail.notFound')}</p></DashboardLayout>;

  const BackArrow = isRTL ? ArrowLeft : ArrowRight;
  const editHref = `${backHref}/${id}/edit`;

  return (
    <DashboardLayout title={t('detail.title')}>
      <div className="max-w-5xl space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <Link href={backHref} className="flex items-center gap-1 text-slate-500 hover:text-slate-200 transition-colors text-sm">
            <BackArrow className="w-4 h-4" />
            {t('common.back')}
          </Link>
          <div className="flex gap-2">
            <Link href={editHref}>
              <Button variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>{t('common.edit')}</Button>
            </Link>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setConfirmDelete(true)}>{t('common.delete')}</Button>
          </div>
        </div>

        {isLate(order) && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{t('detail.isLate')} {formatDate(order.deliveryDate)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            {/* Main Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{order.orderName}</h2>
                  <p className="text-slate-500 text-sm mt-1">{order.clientName} — {order.clientPhone || '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <CategoryBadge category={order.category} />
                  <PriorityBadge priority={order.priority} />
                </div>
              </div>

              <div className="mb-5">
                <StageBadge stage={order.stage} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <Detail label={t('form.receivedDate')} value={formatDate(order.receivedDate)} />
                <Detail label={t('form.deliveryDate')} value={formatDate(order.deliveryDate)} className={isLate(order) ? 'text-red-400' : ''} />
                <Detail label={t('order.machine')} value={order.machineName || order.machineId} />
                <Detail label={t('form.productType')} value={order.productType} />
                <Detail label={t('order.quantity')} value={order.quantity} />
                <Detail label={t('detail.orderReceived')} value={formatDate(order.createdAt)} />
              </div>
            </div>

            {/* Client info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-slate-200 font-semibold mb-4">{t('form.sectionClient')}</h3>
              {!order.clientId && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mb-4">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-300 text-xs">{t('clients.linkedWarning')}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <Detail label={t('form.clientName')} value={order.clientName} />
                <Detail label={t('form.clientPhone')} value={order.clientPhone} />
                <Detail label={t('form.clientEmail')} value={order.clientEmail} />
                <Detail label={t('form.clientAddress')} value={order.clientAddress} />
              </div>
            </div>

            <QuickActions order={order} />

            {/* Filament usage */}
            {(order.filamentColorName || order.estimatedGrams) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-slate-200 font-semibold mb-4">{t('detail.filamentUsage')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <Detail label={t('order.filament')} value={order.filamentName ? `${order.filamentName} — ${order.filamentColorName}` : order.filamentColorName} />
                  <Detail label={t('order.materialType')} value={order.materialType ? MATERIAL_TYPE_LABELS[order.materialType] : undefined} />
                  <Detail label={t('order.estimatedGrams')} value={order.estimatedGrams ? `${order.estimatedGrams} ${t('common.grams')}` : undefined} />
                  <Detail label={t('order.actualGrams')} value={order.actualGrams ? `${order.actualGrams} ${t('common.grams')}` : undefined} />
                </div>
              </div>
            )}

            {/* Financial */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-slate-200 font-semibold mb-4">{t('fin.finance')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">{t('fin.price')}</div>
                  <div className="text-slate-100 font-bold text-lg">{order.price != null ? `${formatCurrency(order.price)} ${t('common.sar')}` : '—'}</div>
                </div>
                <div className="text-center bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">{t('fin.paid')}</div>
                  <div className="text-green-400 font-bold text-lg">{formatCurrency(order.paidAmount)} {t('common.sar')}</div>
                </div>
                <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">{t('fin.remaining')}</div>
                  <div className="text-amber-400 font-bold text-lg">{order.remainingAmount != null ? `${formatCurrency(order.remainingAmount)} ${t('common.sar')}` : '—'}</div>
                </div>
              </div>
              {(order.paymentMethod || order.paymentStatus || order.paymentNotes) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-5 pt-5 border-t border-slate-800">
                  {order.paymentMethod && <Detail label={t('form.paymentMethod')} value={t(`pmethod.${order.paymentMethod}` as TranslationKey)} />}
                  {order.paymentStatus && <Detail label={t('form.paymentStatus')} value={t(`pstatus.${order.paymentStatus}` as TranslationKey)} />}
                  {order.paymentNotes && <Detail label={t('form.paymentNotes')} value={order.paymentNotes} />}
                </div>
              )}
            </div>

            {/* Files & model links */}
            {(order.makerWorldLink || order.driveLink || order.otherLink) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-slate-200 font-semibold mb-4">{t('form.sectionLinks')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {order.makerWorldLink && (
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs text-slate-600 uppercase tracking-wider">{t('form.makerWorldLink')}</span>
                      <a href={order.makerWorldLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm truncate transition-colors">
                        {order.makerWorldLink}
                      </a>
                    </div>
                  )}
                  {order.driveLink && (
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs text-slate-600 uppercase tracking-wider">{t('form.driveLink')}</span>
                      <a href={order.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm truncate transition-colors">
                        {order.driveLink}
                      </a>
                    </div>
                  )}
                  {order.otherLink && (
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs text-slate-600 uppercase tracking-wider">{t('form.otherLink')}</span>
                      <a href={order.otherLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm truncate transition-colors">
                        {order.otherLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.notes && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-slate-200 font-semibold mb-2">{t('common.notes')}</h3>
                <p className="text-slate-400 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            {order.attachments && order.attachments.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-slate-200 font-semibold mb-3">{t('form.attachments')}</h3>
                <div className="flex flex-wrap gap-2">
                  {order.attachments.map(url => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate-700 hover:border-slate-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <OrderTimeline order={order} />

            {/* Activity log */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-slate-300 font-semibold mb-3 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                {t('activity.title')}
              </h3>
              {actLoading ? (
                <div className="text-slate-600 text-xs text-center py-4">{t('common.loading')}</div>
              ) : activities.length === 0 ? (
                <div className="text-slate-600 text-xs text-center py-4">{t('activity.empty')}</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {activities.map(act => (
                    <div key={act.id} className="flex gap-2 text-xs">
                      <span className="text-slate-600 flex-shrink-0 font-mono w-4 text-center">
                        {ACTIVITY_ICONS[act.type] || '·'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-400">
                          {t(`activity.${act.type}` as TranslationKey)}
                          {act.previousValue && act.newValue && (
                            <span className="text-slate-600"> {t('activity.from')} {act.previousValue} {t('activity.to')} {act.newValue}</span>
                          )}
                        </p>
                        <p className="text-slate-600">{formatDateTime(act.timestamp)}</p>
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
