import type { OrderStage } from '@/types';

export const ORDER_STAGES: OrderStage[] = [
  'new', 'design', 'slicing', 'scheduledPrinting', 'printing',
  'postProcessing', 'qualityCheck', 'readyDelivery', 'delivered', 'cancelled',
];

// Stage color utilities for UI (dark theme)
export function stageColor(stage: OrderStage): string {
  switch (stage) {
    case 'new':               return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'design':             return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'slicing':            return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'scheduledPrinting':  return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'printing':           return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'postProcessing':     return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    case 'qualityCheck':       return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'readyDelivery':      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'delivered':          return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'cancelled':          return 'bg-slate-800 text-slate-500 border-slate-700';
    default:                   return 'bg-slate-800 text-slate-500 border-slate-700';
  }
}

// Is this stage "ready for delivery"?
export function isReadyStage(stage: OrderStage): boolean {
  return stage === 'readyDelivery';
}

// Is this stage "actively being worked on"?
export function isActiveStage(stage: OrderStage): boolean {
  return ['design', 'slicing', 'printing', 'postProcessing', 'qualityCheck'].includes(stage);
}

export function isTerminalStage(stage: OrderStage): boolean {
  return stage === 'delivered' || stage === 'cancelled';
}

// Priority border class
export function priorityBorder(priority: string): string {
  switch (priority) {
    case 'urgent': return 'border-l-4 border-red-500';
    case 'high':   return 'border-l-4 border-orange-400';
    case 'normal': return 'border-l-4 border-blue-400';
    default:       return 'border-l-4 border-slate-300';
  }
}

// Priority dot class
export function priorityDot(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high':   return 'bg-orange-500';
    case 'normal': return 'bg-blue-500';
    default:       return 'bg-slate-500';
  }
}
