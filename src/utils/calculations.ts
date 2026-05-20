import type { Order, MonthlyReport, DashboardStats, BusinessLabelStats, GramAllocation } from '@/types';
import { isLate, isMissingGrams, isToday, isThisWeek } from './dateUtils';

export function calcRemaining(price: number, paid: number): number {
  return Math.max(0, price - paid);
}

export function getEffectiveGrams(order: Order): number {
  if (order.section !== 'printing3d') return 0;
  if (order.splitGrams && order.gramAllocations && order.gramAllocations.length > 0) {
    return order.gramAllocations.reduce((sum, a) => sum + a.grams, 0);
  }
  return order.grams || 0;
}

export function getGramsByMachineAndLabel(orders: Order[]): Record<string, { robofab: number; techNova: number; total: number }> {
  const result: Record<string, { robofab: number; techNova: number; total: number }> = {};

  for (const order of orders) {
    if (order.section !== 'printing3d') continue;
    if (order.status === 'cancelled') continue;

    if (order.splitGrams && order.gramAllocations && order.gramAllocations.length > 0) {
      for (const alloc of order.gramAllocations) {
        const key = alloc.machineName || alloc.machineId || 'Unknown';
        if (!result[key]) result[key] = { robofab: 0, techNova: 0, total: 0 };
        if (alloc.businessLabel === 'RoboFab') result[key].robofab += alloc.grams;
        else result[key].techNova += alloc.grams;
        result[key].total += alloc.grams;
      }
    } else if (order.grams && order.grams > 0) {
      const key = order.machineName || order.machineId || 'Unknown';
      if (!result[key]) result[key] = { robofab: 0, techNova: 0, total: 0 };
      if (order.businessLabel === 'RoboFab') result[key].robofab += order.grams;
      else result[key].techNova += order.grams;
      result[key].total += order.grams;
    }
  }

  return result;
}

export function calcMonthlyReport(orders: Order[], year: number, month: number): MonthlyReport {
  const filtered = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const gramsByMachine = getGramsByMachineAndLabel(filtered);
  const totalGrams = Object.values(gramsByMachine).reduce((s, v) => s + v.total, 0);
  const gramsByLabel = Object.values(gramsByMachine).reduce(
    (acc, v) => ({ robofab: acc.robofab + v.robofab, techNova: acc.techNova + v.techNova }),
    { robofab: 0, techNova: 0 }
  );

  return {
    month, year,
    totalOrders: filtered.length,
    totalRevenue: filtered.reduce((s, o) => s + (o.price || 0), 0),
    totalPaid: filtered.reduce((s, o) => s + (o.paidAmount || 0), 0),
    totalRemaining: filtered.reduce((s, o) => s + (o.remainingAmount || 0), 0),
    totalGrams,
    gramsByMachine,
    gramsByLabel,
    lateOrders: filtered.filter(o => isLate(o)).length,
    completedOrders: filtered.filter(o => o.status === 'completed').length,
    deliveredOrders: filtered.filter(o => o.status === 'delivered').length,
    missingGramsOrders: filtered.filter(o => isMissingGrams(o)).length,
  };
}

function calcLabelStats(orders: Order[], label: 'RoboFab' | 'TechNova', monthOrders: Order[]): BusinessLabelStats {
  const all = orders.filter(o => o.businessLabel === label);
  const month = monthOrders.filter(o => o.businessLabel === label);
  const active = (s: Order) => s.status !== 'delivered' && s.status !== 'cancelled';

  const gramsMonth = month
    .filter(o => o.section === 'printing3d')
    .reduce((sum, o) => {
      if (o.splitGrams && o.gramAllocations?.length) {
        return sum + o.gramAllocations.filter(a => a.businessLabel === label).reduce((s, a) => s + a.grams, 0);
      }
      return sum + (o.grams || 0);
    }, 0);

  return {
    ordersThisMonth: month.length,
    gramsThisMonth: gramsMonth,
    revenue: month.reduce((s, o) => s + (o.price || 0), 0),
    paid: month.reduce((s, o) => s + (o.paidAmount || 0), 0),
    remaining: month.reduce((s, o) => s + (o.remainingAmount || 0), 0),
    lateOrders: all.filter(o => isLate(o)).length,
    urgentOrders: all.filter(o => o.priority === 'urgent' && active(o)).length,
    completedOrders: all.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    activeOrders: all.filter(o => active(o)).length,
  };
}

export function calcDashboardStats(orders: Order[]): DashboardStats {
  const now = new Date();
  const thisMonthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const gramsByMachineRaw = getGramsByMachineAndLabel(thisMonthOrders);
  const gramsByMachine: Record<string, number> = {};
  let gramsByRoboFab = 0, gramsByTechNova = 0, totalGrams = 0;
  for (const [machine, vals] of Object.entries(gramsByMachineRaw)) {
    gramsByMachine[machine] = vals.total;
    gramsByRoboFab += vals.robofab;
    gramsByTechNova += vals.techNova;
    totalGrams += vals.total;
  }

  return {
    totalOrdersThisMonth: thisMonthOrders.length,
    totalGramsThisMonth: totalGrams,
    gramsByMachine,
    gramsByRoboFab,
    gramsByTechNova,
    lateOrdersCount: orders.filter(o => isLate(o)).length,
    ordersDueToday: orders.filter(o => isToday(o.deliveryDate) && o.status !== 'delivered' && o.status !== 'cancelled').length,
    ordersDueThisWeek: orders.filter(o => isThisWeek(o.deliveryDate) && o.status !== 'delivered' && o.status !== 'cancelled').length,
    missingGramsCount: orders.filter(o => isMissingGrams(o)).length,
    urgentOrdersCount: orders.filter(o => o.priority === 'urgent' && o.status !== 'delivered' && o.status !== 'cancelled').length,
    recentOrders: [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    robofab: calcLabelStats(orders, 'RoboFab', thisMonthOrders),
    techNova: calcLabelStats(orders, 'TechNova', thisMonthOrders),
  };
}
