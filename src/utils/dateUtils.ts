import type { Order } from '@/types';

export function isLate(order: Order): boolean {
  if (!order.deliveryDate) return false;
  if (order.status === 'delivered' || order.status === 'cancelled') return false;
  return new Date(order.deliveryDate) < new Date(new Date().toDateString());
}

export function isMissingGrams(order: Order): boolean {
  if (order.section !== 'printing3d') return false;
  if (order.splitGrams && order.gramAllocations && order.gramAllocations.length > 0) return false;
  return !order.grams || order.grams === 0;
}

export function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

export function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return d >= startOfWeek && d <= endOfWeek;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function toInputDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

export function daysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isDueTomorrow(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth() && d.getFullYear() === tomorrow.getFullYear();
}

export function isDueThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0,0,0,0);
  const in7 = new Date(today); in7.setDate(today.getDate() + 7);
  return d >= today && d < in7;
}

export function formatDateLocalized(dateStr?: string, lang: 'ar' | 'en' = 'ar'): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr?: string, lang: 'ar' | 'en' = 'ar'): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function daysOverdue(dateStr?: string): number {
  if (!dateStr) return 0;
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
