'use client';
import type { OrderPriority, MachineStatus, OrderCategory, OrderStage, FilamentStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { stageColor } from '@/utils/stages';
import type { TranslationKey } from '@/i18n/translations';

interface BadgeProps { label: string; className?: string; }

export function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: OrderPriority }) {
  const { t } = useTranslation();
  const styles: Record<OrderPriority, string> = {
    low:    'bg-slate-700/50 text-slate-400 border border-slate-700',
    normal: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    high:   'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const keyMap: Record<OrderPriority, TranslationKey> = {
    low: 'priority.low', normal: 'priority.normal', high: 'priority.high', urgent: 'priority.urgent',
  };
  return <Badge label={t(keyMap[priority])} className={styles[priority]} />;
}

export function CategoryBadge({ category }: { category: OrderCategory }) {
  const { t } = useTranslation();
  const styles: Record<OrderCategory, string> = {
    chandelier: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    holder:     'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    general:    'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  };
  const keyMap: Record<OrderCategory, TranslationKey> = {
    chandelier: 'cat.chandelier', holder: 'cat.holder', general: 'cat.general',
  };
  // Defensive: legacy/corrupted data may have a missing or invalid category —
  // never crash on an unmapped value, show a clear "not specified" badge instead.
  if (category !== 'chandelier' && category !== 'holder' && category !== 'general') {
    return <Badge label={t('cat.unspecified')} className="bg-slate-700/50 text-slate-400 border border-slate-700" />;
  }
  return <Badge label={t(keyMap[category])} className={styles[category]} />;
}

export function StageBadge({ stage }: { stage: OrderStage }) {
  const { t } = useTranslation();
  return <Badge label={t(`stage.${stage}` as TranslationKey)} className={`border ${stageColor(stage)}`} />;
}

export function MachineStatusBadge({ status }: { status: MachineStatus }) {
  const { t } = useTranslation();
  const styles: Record<MachineStatus, string> = {
    active:      'bg-green-500/10 text-green-400 border border-green-500/20',
    maintenance: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    offline:     'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const keyMap: Record<MachineStatus, TranslationKey> = {
    active: 'mstatus.active', maintenance: 'mstatus.maintenance', offline: 'mstatus.offline',
  };
  return <Badge label={t(keyMap[status])} className={styles[status]} />;
}

export function StockStatusBadge({ status }: { status: FilamentStatus }) {
  const { t } = useTranslation();
  const styles: Record<FilamentStatus, string> = {
    available: 'bg-green-500/10 text-green-400 border border-green-500/20',
    low:       'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    out:       'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const keyMap: Record<FilamentStatus, TranslationKey> = {
    available: 'stock.available', low: 'stock.low', out: 'stock.out',
  };
  return <Badge label={t(keyMap[status])} className={styles[status]} />;
}

export function LateBadge() {
  const { t } = useTranslation();
  return <Badge label={t('alert.late')} className="bg-red-500/10 text-red-400 border border-red-500/20" />;
}
