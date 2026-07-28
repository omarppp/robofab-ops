'use client';
import { useState } from 'react';
import { Play, CheckSquare, Package, Truck, XCircle, PenTool, Scissors, CalendarClock, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { updateOrder } from '@/lib/firestore';
import { finishPrintingAndConsume, cancelOrderWithStock } from '@/lib/orders';
import { logActivity } from '@/lib/activity';
import type { Order } from '@/types';

interface Props {
  order: Order;
  onUpdated?: () => void;
}

export default function QuickActions({ order, onUpdated }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [showFinishPrint, setShowFinishPrint] = useState(false);
  const [actualGrams, setActualGrams] = useState<string>('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const stage = order.stage;
  const isTerminal = stage === 'delivered' || stage === 'cancelled';

  const act = async (updates: Partial<Order>, activityType: Parameters<typeof logActivity>[1]['type']) => {
    setSaving(true);
    try {
      await updateOrder(order.id, updates);
      await logActivity(order.id, {
        type: activityType,
        timestamp: new Date().toISOString(),
        previousValue: stage,
        newValue: updates.stage as string | undefined,
      });
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const startDesign = () => act({ stage: 'design', designStartedAt: new Date().toISOString() }, 'started');
  const finishDesign = () => act({ designCompletedAt: new Date().toISOString() }, 'finished');
  const startSlicing = () => act({
    stage: 'slicing',
    slicingStartedAt: new Date().toISOString(),
    designCompletedAt: order.designCompletedAt || new Date().toISOString(),
  }, 'started');
  const finishSlicing = () => act({ slicingCompletedAt: new Date().toISOString() }, 'finished');
  const schedulePrinting = () => act({
    stage: 'scheduledPrinting',
    slicingCompletedAt: order.slicingCompletedAt || new Date().toISOString(),
  }, 'stageChanged');
  const startPrinting = () => act({ stage: 'printing', printingStartedAt: new Date().toISOString() }, 'started');

  const confirmFinishPrinting = async () => {
    setSaving(true);
    try {
      const grams = actualGrams.trim() ? Number(actualGrams) : undefined;
      await finishPrintingAndConsume(order.id, grams);
      await logActivity(order.id, {
        type: 'filamentConsumed',
        timestamp: new Date().toISOString(),
        previousValue: stage,
        newValue: 'postProcessing',
      });
      setShowFinishPrint(false);
      setActualGrams('');
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const startQC = () => act({ stage: 'qualityCheck', postProcessingDoneAt: new Date().toISOString() }, 'started');
  const markReady = () => {
    const now = new Date().toISOString();
    return act({ stage: 'readyDelivery', qualityCheckDoneAt: now, readyForDeliveryAt: now }, 'markedReady');
  };
  const markDelivered = () => act({ stage: 'delivered', deliveredDate: new Date().toISOString() }, 'delivered');

  const confirmCancel = async () => {
    setSaving(true);
    try {
      await cancelOrderWithStock(order.id);
      await logActivity(order.id, {
        type: 'cancelled',
        timestamp: new Date().toISOString(),
        previousValue: stage,
        newValue: 'cancelled',
      });
      setShowCancelConfirm(false);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  if (isTerminal) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-slate-200 font-semibold mb-3 text-sm">{t('qa.actions')}</h3>

      <div className="flex flex-wrap gap-2">
        {stage === 'new' && (
          <Button size="sm" icon={<PenTool className="w-3.5 h-3.5" />} onClick={startDesign} loading={saving}>{t('qa.startDesign')}</Button>
        )}
        {stage === 'design' && !order.designCompletedAt && (
          <Button size="sm" variant="outline" icon={<CheckSquare className="w-3.5 h-3.5" />} onClick={finishDesign} loading={saving}>{t('qa.finishDesign')}</Button>
        )}
        {stage === 'design' && (
          <Button size="sm" icon={<Scissors className="w-3.5 h-3.5" />} onClick={startSlicing} loading={saving}>{t('qa.startSlicing')}</Button>
        )}
        {stage === 'slicing' && !order.slicingCompletedAt && (
          <Button size="sm" variant="outline" icon={<CheckSquare className="w-3.5 h-3.5" />} onClick={finishSlicing} loading={saving}>{t('qa.finishSlicing')}</Button>
        )}
        {stage === 'slicing' && (
          <Button size="sm" icon={<CalendarClock className="w-3.5 h-3.5" />} onClick={schedulePrinting} loading={saving}>{t('qa.schedulePrinting')}</Button>
        )}
        {stage === 'scheduledPrinting' && (
          <Button size="sm" icon={<Play className="w-3.5 h-3.5" />} onClick={startPrinting} loading={saving}>{t('qa.startPrinting')}</Button>
        )}
        {stage === 'printing' && (
          <Button size="sm" icon={<CheckSquare className="w-3.5 h-3.5" />} onClick={() => setShowFinishPrint(true)} loading={saving}>{t('qa.finishPrinting')}</Button>
        )}
        {stage === 'postProcessing' && (
          <Button size="sm" icon={<Search className="w-3.5 h-3.5" />} onClick={startQC} loading={saving}>{t('qa.startQC')}</Button>
        )}
        {stage === 'qualityCheck' && (
          <Button size="sm" icon={<Package className="w-3.5 h-3.5" />} onClick={markReady} loading={saving}>{t('qa.markReady')}</Button>
        )}
        {stage === 'readyDelivery' && (
          <Button size="sm" icon={<Truck className="w-3.5 h-3.5" />} onClick={markDelivered} loading={saving}>{t('qa.markDelivered')}</Button>
        )}
        <Button size="sm" variant="ghost" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => setShowCancelConfirm(true)}>
          <span className="text-red-400">{t('qa.cancel')}</span>
        </Button>
      </div>

      {showFinishPrint && (
        <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
          <p className="text-cyan-400 text-xs font-medium mb-2">{t('qa.actualGramsPrompt')}</p>
          <input
            type="number"
            min="0"
            step="0.01"
            value={actualGrams}
            onChange={e => setActualGrams(e.target.value)}
            placeholder={order.estimatedGrams ? String(order.estimatedGrams) : '0'}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60 mb-2"
          />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={confirmFinishPrinting} loading={saving}>{t('qa.finishPrinting')}</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowFinishPrint(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-xs font-medium mb-2">{t('qa.cancelWarning')}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="danger" className="text-xs" onClick={confirmCancel} loading={saving}>{t('qa.confirmCancel')}</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowCancelConfirm(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
