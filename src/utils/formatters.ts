import type { OrderStatus, OrderPriority, BusinessLabel, MachineStatus, OutsourcedStatus, DesignType, ClientCategory } from '@/types';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  inProgress: 'قيد التنفيذ',
  waiting: 'في الانتظار',
  completed: 'مكتمل',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const OUTSOURCED_STATUS_LABELS: Record<OutsourcedStatus, string> = {
  sent: 'تم الإرسال',
  inProgress: 'قيد التنفيذ',
  received: 'تم الاستلام',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const PRIORITY_LABELS: Record<OrderPriority, string> = {
  low: 'منخفض',
  normal: 'عادي',
  high: 'مرتفع',
  urgent: 'عاجل',
};

export const BUSINESS_LABELS: Record<BusinessLabel, string> = {
  RoboFab: 'RoboFab',
  TechNova: 'Tech Nova',
};

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  active: 'نشط',
  maintenance: 'صيانة',
  offline: 'غير متاح',
};

export const DESIGN_TYPE_LABELS: Record<DesignType, string> = {
  '3dDesign': 'تصميم ثلاثي الأبعاد',
  pcbDesign: 'تصميم PCB',
};

export const CLIENT_CATEGORY_LABELS: Record<ClientCategory, string> = {
  printing3d: 'طباعة ثلاثية الأبعاد',
  '3dDesign': 'تصميم ثلاثي الأبعاد',
  pcbDesign: 'تصميم PCB',
  pcbPrinting: 'طباعة PCB',
  externalPrinting: 'طباعة خارجية',
};

export const SECTION_LABELS: Record<string, string> = {
  printing3d: 'الطباعة ثلاثية الأبعاد',
  design: 'التصميم',
  pcbPrinting: 'طباعة PCB',
  outsourcedPrinting: 'الطباعة عند الغير',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function formatGrams(grams: number): string {
  return `${grams.toLocaleString('ar-SA')} جم`;
}
