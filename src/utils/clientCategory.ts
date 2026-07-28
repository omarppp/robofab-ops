import type { Client, ClientCategory, OrderCategory } from '@/types';

export const CLIENT_CATEGORIES: ClientCategory[] = ['chandelier', 'holder', 'both', 'general'];

// Client.category is now a single value, but older documents may still store
// it as an array (the previous multi-select shape) or be missing entirely —
// never crash, always resolve to one of the four valid categories.
export function normalizeClientCategory(raw: unknown): ClientCategory {
  if (Array.isArray(raw)) {
    const has = (c: string) => raw.includes(c);
    if (has('chandelier') && has('holder')) return 'both';
    if (has('chandelier')) return 'chandelier';
    if (has('holder')) return 'holder';
    return 'general';
  }
  if (raw === 'chandelier' || raw === 'holder' || raw === 'both' || raw === 'general') return raw;
  return 'general';
}

// Is this client eligible to be picked for an order of the given category?
export function clientMatchesOrderCategory(client: Pick<Client, 'category'>, orderCategory: OrderCategory): boolean {
  const cat = normalizeClientCategory(client.category);
  if (cat === 'both' || cat === 'general') return true;
  return cat === orderCategory;
}
