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

// Stage color utilities for UI
export function stageColor(stage: OrderStage): string {
  switch (stage) {
    case 'new':                  return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'reviewingFile':
    case 'fileReview':           return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'waitingClientConfirm':
    case 'waitingClientReview':  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'waitingMaterial':      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'scheduledPrinting':    return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'printing':             return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'postProcessing':
    case 'finishing':            return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'readyDelivery':        return 'bg-green-50 text-green-700 border-green-200';
    case 'delivered':            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'cancelled':            return 'bg-slate-100 text-slate-500 border-slate-200';
    case 'requirementsReceived': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'inDesign':             return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'revision':             return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'finalFilesReady':      return 'bg-green-50 text-green-700 border-green-200';
    case 'preparingBoard':       return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'sentExternal':         return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'inProgressOutside':    return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'receivedCompany':      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'checked':              return 'bg-green-50 text-green-700 border-green-200';
    default:                     return 'bg-slate-100 text-slate-500 border-slate-200';
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
