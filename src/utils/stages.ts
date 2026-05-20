import type {
  OrderSection, OrderStatus, OrderStage,
  PrintingStage, DesignStage, PcbStage, OutsourcedStage, Order,
} from '@/types';

// ── Stage definitions per section ─────────────────────────────────────────────

export const PRINTING_STAGES: PrintingStage[] = [
  'new', 'reviewingFile', 'waitingClientConfirm', 'waitingMaterial',
  'scheduledPrinting', 'printing', 'postProcessing', 'readyDelivery',
  'delivered', 'cancelled',
];

export const DESIGN_STAGES: DesignStage[] = [
  'new', 'requirementsReceived', 'inDesign', 'waitingClientReview',
  'revision', 'finalFilesReady', 'delivered', 'cancelled',
];

export const PCB_STAGES: PcbStage[] = [
  'new', 'fileReview', 'preparingBoard', 'printing', 'finishing',
  'readyDelivery', 'delivered', 'cancelled',
];

export const OUTSOURCED_STAGES: OutsourcedStage[] = [
  'new', 'sentExternal', 'inProgressOutside', 'receivedCompany',
  'checked', 'readyDelivery', 'delivered', 'cancelled',
];

export function getSectionStages(section: OrderSection): OrderStage[] {
  switch (section) {
    case 'printing3d':        return PRINTING_STAGES;
    case 'design':            return DESIGN_STAGES;
    case 'pcbPrinting':       return PCB_STAGES;
    case 'outsourcedPrinting':return OUTSOURCED_STAGES;
  }
}

// Stage → high-level status mapping
export function stageToStatus(stage: OrderStage): OrderStatus {
  switch (stage) {
    case 'new':                   return 'new';
    case 'readyDelivery':         return 'completed';
    case 'delivered':             return 'delivered';
    case 'cancelled':             return 'cancelled';
    case 'waitingClientConfirm':
    case 'waitingClientReview':
    case 'waitingMaterial':
    case 'receivedCompany':       return 'waiting';
    default:                      return 'inProgress';
  }
}

// Derive effective stage from status when order has no explicit stage set
function defaultStageForSection(status: OrderStatus, section: OrderSection): OrderStage {
  switch (section) {
    case 'printing3d':
      return { new:'new', inProgress:'printing', waiting:'waitingClientConfirm', completed:'readyDelivery', delivered:'delivered', cancelled:'cancelled' }[status] as PrintingStage;
    case 'design':
      return { new:'new', inProgress:'inDesign', waiting:'waitingClientReview', completed:'finalFilesReady', delivered:'delivered', cancelled:'cancelled' }[status] as DesignStage;
    case 'pcbPrinting':
      return { new:'new', inProgress:'printing', waiting:'fileReview', completed:'readyDelivery', delivered:'delivered', cancelled:'cancelled' }[status] as PcbStage;
    case 'outsourcedPrinting':
      return { new:'new', inProgress:'inProgressOutside', waiting:'receivedCompany', completed:'readyDelivery', delivered:'delivered', cancelled:'cancelled' }[status] as OutsourcedStage;
  }
}

export function getEffectiveStage(order: Order): OrderStage {
  if (order.stage) return order.stage;
  return defaultStageForSection(order.status, order.section);
}

// Stage color utilities for UI (dark theme)
export function stageColor(stage: OrderStage): string {
  switch (stage) {
    case 'new':                  return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'reviewingFile':
    case 'fileReview':           return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'waitingClientConfirm':
    case 'waitingClientReview':  return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'waitingMaterial':      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'scheduledPrinting':    return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'printing':             return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'postProcessing':
    case 'finishing':            return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    case 'readyDelivery':        return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'delivered':            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'cancelled':            return 'bg-slate-800 text-slate-500 border-slate-700';
    case 'requirementsReceived': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'inDesign':             return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'revision':             return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'finalFilesReady':      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'preparingBoard':       return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'sentExternal':         return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'inProgressOutside':    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'receivedCompany':      return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    case 'checked':              return 'bg-green-500/10 text-green-400 border-green-500/20';
    default:                     return 'bg-slate-800 text-slate-500 border-slate-700';
  }
}

// Is this stage a "waiting / blocked" state?
export function isBlockedStage(stage: OrderStage): boolean {
  return ['waitingClientConfirm', 'waitingClientReview', 'waitingMaterial', 'receivedCompany', 'checked'].includes(stage);
}

// Is this stage "ready for delivery"?
export function isReadyStage(stage: OrderStage): boolean {
  return stage === 'readyDelivery';
}

// Is this stage "actively being worked on"?
export function isActiveStage(stage: OrderStage): boolean {
  return ['printing', 'inDesign', 'postProcessing', 'finishing', 'inProgressOutside'].includes(stage);
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
