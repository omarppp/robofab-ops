import type { Order, OrderCategory } from '@/types';

const VALID_CATEGORIES: OrderCategory[] = ['chandelier', 'holder'];

// Safe default used only when an order's category is missing/invalid
// (e.g. legacy data written before the category field existed). Chosen so
// links always resolve to a real, working route instead of "/orders/undefined/...".
const FALLBACK_CATEGORY: OrderCategory = 'chandelier';

export function hasValidCategory(order: Pick<Order, 'category'>): boolean {
  return VALID_CATEGORIES.includes(order.category);
}

// Never returns undefined — always "chandelier" or "holder".
export function getOrderCategoryPath(order: Pick<Order, 'category'>): OrderCategory {
  return VALID_CATEGORIES.includes(order.category) ? order.category : FALLBACK_CATEGORY;
}

export function orderHref(order: Pick<Order, 'id' | 'category'>): string {
  return `/orders/${getOrderCategoryPath(order)}/${order.id}`;
}

export function orderEditHref(order: Pick<Order, 'id' | 'category'>): string {
  return `${orderHref(order)}/edit`;
}
