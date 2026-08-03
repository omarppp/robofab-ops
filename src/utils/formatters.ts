import type { OrderPriority, MachineStatus, ClientCategory, OrderCategory, MaterialType, FilamentStatus } from '@/types';

export const PRIORITY_LABELS: Record<OrderPriority, string> = {
  low: 'منخفض',
  normal: 'عادي',
  high: 'مرتفع',
  urgent: 'عاجل',
};

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  active: 'نشط',
  maintenance: 'صيانة',
  offline: 'غير متاح',
};

export const CATEGORY_LABELS: Record<OrderCategory, string> = {
  chandelier: 'أوردرات النجف',
  holder: 'أوردرات الهولدرات',
  general: 'أوردرات عادية',
};

export const CLIENT_CATEGORY_LABELS: Record<ClientCategory, string> = {
  chandelier: 'نجف',
  holder: 'هولدرات',
  both: 'الاتنين',
  general: 'عام',
};

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  PLA: 'PLA',
  PETG: 'PETG',
  TPU: 'TPU',
  ABS: 'ABS',
  ASA: 'ASA',
  Resin: 'Resin',
  Other: 'أخرى',
};

export const FILAMENT_STATUS_LABELS: Record<FilamentStatus, string> = {
  available: 'متوفر',
  low: 'منخفض',
  out: 'نفذ',
};

export function filamentStatus(currentGrams: number, minStockLevel: number): FilamentStatus {
  if (currentGrams <= 0) return 'out';
  if (currentGrams <= minStockLevel) return 'low';
  return 'available';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function formatGrams(grams: number): string {
  return `${grams.toLocaleString('ar-SA')} جم`;
}
