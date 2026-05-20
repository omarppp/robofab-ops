'use client';
import { useState } from 'react';
import { Play, CheckSquare, Package, Truck, PauseCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { updateOrder } from '@/lib/firestore';
import { logActivity } from '@/lib/activity';
import { getEffectiveStage, stageToStatus } from '@/utils/stages';
import type { Order, OrderSection, OrderStage, WaitingReason } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

const WAITING_REASONS: WaitingReason[] = [
  'clientConfirmation', 'material', 'payment', 'file', 'machineAvailability', 'externalCompany', 'other',
];

function getWorkStage(section: OrderSection): OrderStage {
  switch (section) {
    case 'printing3d': return 'printing';
    case 'design': return 'inDesign';
    case 'pcbPrinting': return 'printing';
    case 'outsourcedPrinting': return 'inProgressOutside';
  }
}

function getFinishStage(section: OrderSection): OrderStage {
  switch (section) {
    case 'printing3d': return 'postProcessing';
    case 'design': return 'waitingClientReview';
    case 'pcbPrinting': return 'finishing';
    case 'outsourcedPrinting': return 'receivedCompany';
  }
}

const START_ELIGIBLE: OrderStage[] = [
  'new', 'reviewingFile', 'waitingClientConfirm', 'waitingMaterial',
  'scheduledPrinting', 'requirementsReceived', 'fileReview', 'sentExternal',
  'preparingBoard', 'checked',
];
const FINISH_ELIGIBLE: OrderStage[] = ['printing', 'inDesign', 'inProgressOutside'];
const READY_ELIGIBLE: OrderStage[] = ['postProcessing', 'revision', 'finalFilesReady', 'finishing', 'receivedCompany', 'checked', 'waitingClientReview'];

interface Props {
  order: Order;
  onUpdated?: () => void;
}

export default function QuickActions({ order, onUpdated }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [holdReason, setHoldReason] = useState<WaitingReason>('clientConfirmation');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const stage = getEffectiveStage(order);
  const isTerminal = stage === 'delivered' || stage === 'cancelled';
  const canStart = START_ELIGIBLE.includes(stage);
  const canFinish = FINISH_ELIGIBLE.includes(stage);
  const canMarkReady = READY_ELIGIBLE.includes(stage);
  const canDeliver = stage === 'readyDelivery';

  const act = async (
    updates: Partial<Order>,
    actType: Parameters<typeof logActivity>[1]['type'],
    extra?: Partial<Parameters<typeof logActivity>[1]>
  ) => {
    setSaving(true);
    try {
      await updateOrder(order.id, updates);
      await logActivity(order.id, {
        type: actType,
        timestamp: new Date().toISOString(),
        previousValue: stage,
        newValue: updates.stage as string | undefined,
        ...extra,
      });
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleStart = () => {
    const newStage = getWorkStage(order.section);
    act({ stage: newStage, status: stageToStatus(newStage), actualStartTime: new Date().toISOString() }, 'started');
  };

  const handleFinish = () => {
    const newStage = getFinishStage(order.section);
    act({ stage: newStage, status: stageToStatus(newStage), actualFinishTime: new Date().toISOString() }, 'finished');
  };

  const handleReady = () => {
    act({ stage: 'readyDelivery', status: 'completed' }, 'markedReady');
  };

  const handleDeliver = () => {
    act({ stage: 'delivered', status: 'delivered', deliveredDate: new Date().toISOString() }, 'delivered');
  };

  const handleHold = () => {
    setShowHold(false);
    act({ status: 'waiting', waitingReason: holdReason }, 'onHold', { note: holdReason });
  };

  const handleCancel = () => {
    setShowCancelConfirm(false);
    act({ stage: 'cancelled', status: 'cancelled' }, 'cancelled');
  };

  if (isTerminal) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-slate-200 font-semibold mb-3 text-sm">{t('qa.actions')}</h3>

      <div className="flex flex-wrap gap-2">
        {canStart && (
          <Button size="sm" icon={<Play className="w-3.5 h-3.5" />} onClick={handleStart} loading={saving}>
            {t('qa.startWork')}
          </Button>
        )}
        {canFinish && (
          <Button size="sm" variant="outline" icon={<CheckSquare className="w-3.5 h-3.5" />} onClick={handleFinish} loading={saving}>
            {t('qa.finishWork')}
          </Button>
        )}
        {canMarkReady && (
          <Button size="sm" variant="outline" icon={<Package className="w-3.5 h-3.5" />} onClick={handleReady} loading={saving}>
            {t('qa.markReady')}
          </Button>
        )}
        {canDeliver && (
          <Button size="sm" icon={<Truck className="w-3.5 h-3.5" />} onClick={handleDeliver} loading={saving}>
            {t('qa.deliver')}
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={<PauseCircle className="w-3.5 h-3.5" />} onClick={() => setShowHold(true)}>
          <span className="text-amber-400">{t('qa.hold')}</span>
        </Button>
        <Button size="sm" variant="ghost" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => setShowCancelConfirm(true)}>
          <span className="text-red-400">{t('qa.cancel')}</span>
        </Button>
      </div>

      {showHold && (
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-amber-400 text-xs font-medium mb-2">{t('qa.holdReason')}</p>
          <select
            value={holdReason}
            onChange={e => setHoldReason(e.target.value as WaitingReason)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 mb-2"
          >
            {WAITING_REASONS.map(r => (
              <option key={r} value={r}>{t(`wait.${r}` as TranslationKey)}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-xs" onClick={handleHold} loading={saving}>{t('qa.confirmHold')}</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowHold(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-xs font-medium mb-2">{t('qa.cancelWarning')}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="danger" className="text-xs" onClick={handleCancel} loading={saving}>{t('qa.confirmCancel')}</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowCancelConfirm(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
