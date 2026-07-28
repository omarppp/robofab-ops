'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, UserPlus, X, Phone } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useTranslation } from '@/hooks/useTranslation';
import { clientMatchesOrderCategory, normalizeClientCategory } from '@/utils/clientCategory';
import { CLIENT_CATEGORY_LABELS } from '@/utils/formatters';
import type { Client, OrderCategory } from '@/types';

interface Props {
  category: OrderCategory;
  value?: string;
  onChange: (client: Client | null) => void;
  onRequestNewClient: () => void;
}

export default function ClientSelect({ category, value, onChange, onRequestNewClient }: Props) {
  const { clients, loading } = useClients();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = clients.find(c => c.id === value) || null;

  const eligible = useMemo(() => clients.filter(c => clientMatchesOrderCategory(c, category)), [clients, category]);

  const filtered = useMemo(() => eligible.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  }), [eligible, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-start focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
      >
        {selected ? (
          <>
            <span className="text-slate-200 flex-1 truncate">{selected.name}</span>
            <span dir="ltr" className="text-slate-500 text-xs flex-shrink-0">{selected.phone}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
              title={t('clients.clearSelection')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <span className="text-slate-500 flex-1">{t('clients.select')}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-scale-in">
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('clients.selectHint')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg ps-8 pe-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {loading && <div className="px-3 py-4 text-center text-slate-600 text-xs">{t('common.loading')}</div>}
            {!loading && filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-slate-600 text-xs">{t('clients.noneForCategory')}</div>
            )}
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-start transition-colors ${
                  c.id === value ? 'bg-blue-500/10' : 'hover:bg-slate-800'
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-slate-200 text-xs font-medium truncate">{c.name}</span>
                  <span className="flex items-center gap-1 text-slate-600 text-[10px]">
                    <Phone className="w-2.5 h-2.5" /><span dir="ltr">{c.phone}</span>
                  </span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-500 border border-slate-700 rounded-full px-2 py-0.5 flex-shrink-0">
                  {CLIENT_CATEGORY_LABELS[normalizeClientCategory(c.category)]}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); onRequestNewClient(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 border-t border-slate-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t('clients.addFromOrder')}
          </button>
        </div>
      )}
    </div>
  );
}
