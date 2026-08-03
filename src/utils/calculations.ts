import type { Order, MonthlyReport, DashboardStats, CategoryStats, OrderCategory } from '@/types';
import { isLate, isToday, isThisWeek } from './dateUtils';
import { isTerminalStage } from './stages';

export function calcRemaining(price: number, paid: number): number {
  return Math.max(0, price - paid);
}

export function getEffectiveGrams(order: Order): number {
  return order.actualGrams ?? order.estimatedGrams ?? 0;
}

export function getGramsByMachine(orders: Order[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const order of orders) {
    if (order.stage === 'cancelled') continue;
    const grams = getEffectiveGrams(order);
    if (!grams) continue;
    const key = order.machineName || order.machineId || 'Unknown';
    result[key] = (result[key] || 0) + grams;
  }
  return result;
}

export function getGramsByColor(orders: Order[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const order of orders) {
    if (order.stage === 'cancelled') continue;
    const grams = getEffectiveGrams(order);
    if (!grams || !order.filamentColorName) continue;
    const key = order.filamentColorName;
    result[key] = (result[key] || 0) + grams;
  }
  return result;
}

export function getGramsByMaterial(orders: Order[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const order of orders) {
    if (order.stage === 'cancelled') continue;
    const grams = getEffectiveGrams(order);
    if (!grams || !order.materialType) continue;
    const key = order.materialType;
    result[key] = (result[key] || 0) + grams;
  }
  return result;
}

export function getGramsByCategory(orders: Order[]): { chandelier: number; holder: number; general: number } {
  const result = { chandelier: 0, holder: 0, general: 0 };
  for (const order of orders) {
    if (order.stage === 'cancelled') continue;
    const grams = getEffectiveGrams(order);
    if (!grams) continue;
    result[order.category] += grams;
  }
  return result;
}

export function calcMonthlyReport(orders: Order[], year: number, month: number): MonthlyReport {
  const filtered = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const gramsByMachine = getGramsByMachine(filtered);
  const totalGrams = Object.values(gramsByMachine).reduce((s, v) => s + v, 0);

  return {
    month, year,
    totalOrders: filtered.length,
    chandelierOrders: filtered.filter(o => o.category === 'chandelier').length,
    holderOrders: filtered.filter(o => o.category === 'holder').length,
    totalRevenue: filtered.reduce((s, o) => s + (o.price || 0), 0),
    totalPaid: filtered.reduce((s, o) => s + (o.paidAmount || 0), 0),
    totalRemaining: filtered.reduce((s, o) => s + (o.remainingAmount || 0), 0),
    totalGrams,
    gramsByMachine,
    gramsByCategory: getGramsByCategory(filtered),
    gramsByColor: getGramsByColor(filtered),
    gramsByMaterial: getGramsByMaterial(filtered),
    lateOrders: filtered.filter(o => isLate(o)).length,
    completedOrders: filtered.filter(o => o.stage === 'readyDelivery').length,
    deliveredOrders: filtered.filter(o => o.stage === 'delivered').length,
  };
}

function calcCategoryStats(orders: Order[], category: OrderCategory, monthOrders: Order[]): CategoryStats {
  const all = orders.filter(o => o.category === category);
  const month = monthOrders.filter(o => o.category === category);
  const active = (o: Order) => !isTerminalStage(o.stage);

  return {
    ordersThisMonth: month.length,
    gramsThisMonth: month.reduce((sum, o) => sum + getEffectiveGrams(o), 0),
    revenue: month.reduce((s, o) => s + (o.price || 0), 0),
    paid: month.reduce((s, o) => s + (o.paidAmount || 0), 0),
    remaining: month.reduce((s, o) => s + (o.remainingAmount || 0), 0),
    lateOrders: all.filter(o => isLate(o)).length,
    urgentOrders: all.filter(o => o.priority === 'urgent' && active(o)).length,
    activeOrders: all.filter(active).length,
  };
}

export function calcDashboardStats(orders: Order[]): DashboardStats {
  const now = new Date();
  const thisMonthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const gramsByMachine = getGramsByMachine(thisMonthOrders);
  const totalGrams = Object.values(gramsByMachine).reduce((s, v) => s + v, 0);
  const active = (o: Order) => !isTerminalStage(o.stage);

  return {
    totalOrdersThisMonth: thisMonthOrders.length,
    totalGramsThisMonth: totalGrams,
    gramsByMachine,
    lateOrdersCount: orders.filter(o => isLate(o)).length,
    ordersDueToday: orders.filter(o => isToday(o.deliveryDate) && active(o)).length,
    ordersDueThisWeek: orders.filter(o => isThisWeek(o.deliveryDate) && active(o)).length,
    urgentOrdersCount: orders.filter(o => o.priority === 'urgent' && active(o)).length,
    recentOrders: [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    chandelier: calcCategoryStats(orders, 'chandelier', thisMonthOrders),
    holder: calcCategoryStats(orders, 'holder', thisMonthOrders),
  };
}
