'use client';
import type { OrderStatus, OrderPriority, BusinessLabel, MachineStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface BadgeProps { label: string; className?: string; }

export function Badge({ label, className = '' }: BadgeProps) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const styles: Record<OrderStatus, string> = {
    new: 'bg-blue-50 text-blue-700 border border-blue-200',
    inProgress: 'bg-amber-50 text-amber-700 border border-amber-200',
    waiting: 'bg-orange-50 text-orange-700 border border-orange-200',
    completed: 'bg-green-50 text-green-700 border border-green-200',
    delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
  };
  const keyMap: Record<OrderStatus, Parameters<typeof t>[0]> = {
    new: 'status.new',
    inProgress: 'status.inProgress',
    waiting: 'status.waiting',
    completed: 'status.completed',
    delivered: 'status.delivered',
    cancelled: 'status.cancelled',
  };
  return <Badge label={t(keyMap[status])} className={styles[status]} />;
}

export function PriorityBadge({ priority }: { priority: OrderPriority }) {
  const { t } = useTranslation();
  const styles: Record<OrderPriority, string> = {
    low: 'bg-slate-100 text-slate-500 border border-slate-200',
    normal: 'bg-blue-50 text-blue-700 border border-blue-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    urgent: 'bg-red-50 text-red-700 border border-red-200',
  };
  const keyMap: Record<OrderPriority, Parameters<typeof t>[0]> = {
    low: 'priority.low',
    normal: 'priority.normal',
    high: 'priority.high',
    urgent: 'priority.urgent',
  };
  return <Badge label={t(keyMap[priority])} className={styles[priority]} />;
}

export function BusinessBadge({ label }: { label: BusinessLabel }) {
  const styles: Record<BusinessLabel, string> = {
    RoboFab: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    TechNova: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return <Badge label={label === 'TechNova' ? 'Tech Nova' : 'RoboFab'} className={styles[label]} />;
}

export function MachineStatusBadge({ status }: { status: MachineStatus }) {
  const { t } = useTranslation();
  const styles: Record<MachineStatus, string> = {
    active: 'bg-green-50 text-green-700 border border-green-200',
    maintenance: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    offline: 'bg-red-50 text-red-700 border border-red-200',
  };
  const keyMap: Record<MachineStatus, Parameters<typeof t>[0]> = {
    active: 'mstatus.active',
    maintenance: 'mstatus.maintenance',
    offline: 'mstatus.offline',
  };
  return <Badge label={t(keyMap[status])} className={styles[status]} />;
}

export function LateBadge() {
  const { t } = useTranslation();
  return <Badge label={t('alert.late')} className="bg-red-50 text-red-700 border border-red-200" />;
}

export function MissingGramsBadge() {
  const { t } = useTranslation();
  return <Badge label={t('alert.missingGrams')} className="bg-amber-50 text-amber-700 border border-amber-200" />;
}
