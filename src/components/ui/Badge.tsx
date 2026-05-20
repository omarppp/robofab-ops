'use client';
import type { OrderStatus, OrderPriority, BusinessLabel, MachineStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface BadgeProps { label: string; className?: string; }

export function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const styles: Record<OrderStatus, string> = {
    new:        'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    inProgress: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    waiting:    'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    completed:  'bg-green-500/10 text-green-400 border border-green-500/20',
    delivered:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    cancelled:  'bg-slate-700/50 text-slate-500 border border-slate-700',
  };
  const keyMap: Record<OrderStatus, Parameters<typeof t>[0]> = {
    new: 'status.new', inProgress: 'status.inProgress', waiting: 'status.waiting',
    completed: 'status.completed', delivered: 'status.delivered', cancelled: 'status.cancelled',
  };
  return <Badge label={t(keyMap[status])} className={styles[status]} />;
}

export function PriorityBadge({ priority }: { priority: OrderPriority }) {
  const { t } = useTranslation();
  const styles: Record<OrderPriority, string> = {
    low:    'bg-slate-700/50 text-slate-400 border border-slate-700',
    normal: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    high:   'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const keyMap: Record<OrderPriority, Parameters<typeof t>[0]> = {
    low: 'priority.low', normal: 'priority.normal', high: 'priority.high', urgent: 'priority.urgent',
  };
  return <Badge label={t(keyMap[priority])} className={styles[priority]} />;
}

export function BusinessBadge({ label }: { label: BusinessLabel }) {
  const styles: Record<BusinessLabel, string> = {
    RoboFab:  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    TechNova: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  };
  return <Badge label={label === 'TechNova' ? 'Tech Nova' : 'RoboFab'} className={styles[label]} />;
}

export function MachineStatusBadge({ status }: { status: MachineStatus }) {
  const { t } = useTranslation();
  const styles: Record<MachineStatus, string> = {
    active:      'bg-green-500/10 text-green-400 border border-green-500/20',
    maintenance: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    offline:     'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const keyMap: Record<MachineStatus, Parameters<typeof t>[0]> = {
    active: 'mstatus.active', maintenance: 'mstatus.maintenance', offline: 'mstatus.offline',
  };
  return <Badge label={t(keyMap[status])} className={styles[status]} />;
}

export function LateBadge() {
  const { t } = useTranslation();
  return <Badge label={t('alert.late')} className="bg-red-500/10 text-red-400 border border-red-500/20" />;
}

export function MissingGramsBadge() {
  const { t } = useTranslation();
  return <Badge label={t('alert.missingGrams')} className="bg-amber-500/10 text-amber-400 border border-amber-500/20" />;
}
