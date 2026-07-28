'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useFilamentStock } from '@/hooks/useFilamentStock';
import { StockStatusBadge } from '@/components/ui/Badge';
import { filamentStatus, MATERIAL_TYPE_LABELS } from '@/utils/formatters';
import { useTranslation } from '@/hooks/useTranslation';
import type { FilamentStock } from '@/types';

interface Props {
  value?: string;
  onChange: (filament: FilamentStock | null) => void;
}

export default function FilamentSelect({ value, onChange }: Props) {
  const { filaments, loading } = useFilamentStock();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = filaments.find(f => f.id === value) || null;

  const filtered = useMemo(() => filaments.filter(f => {
    const q = search.toLowerCase();
    return !q || f.filamentName.toLowerCase().includes(q) || f.colorName.toLowerCase().includes(q);
  }), [filaments, search]);

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
            <span
              className="w-5 h-5 rounded-md border border-slate-600 flex-shrink-0"
              style={{ backgroundColor: selected.colorHex || '#334155' }}
            />
            <span className="text-slate-200 flex-1 truncate">{selected.filamentName} — {selected.colorName}</span>
            <span className="text-slate-500 text-xs flex-shrink-0">{Math.max(0, selected.currentGrams - (selected.reservedGrams || 0)).toLocaleString()} {t('common.grams')}</span>
          </>
        ) : (
          <span className="text-slate-500 flex-1">{t('order.filament')}...</span>
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
                placeholder={t('stock.search')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg ps-8 pe-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
              className="w-full text-start px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 transition-colors"
            >
              {t('common.all')} — {t('common.close')}
            </button>
            {loading && <div className="px-3 py-4 text-center text-slate-600 text-xs">{t('common.loading')}</div>}
            {!loading && filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-slate-600 text-xs">{t('common.noResults')}</div>
            )}
            {filtered.map(f => {
              const status = filamentStatus(f.currentGrams, f.minStockLevel);
              const available = Math.max(0, f.currentGrams - (f.reservedGrams || 0));
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { onChange(f); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-start transition-colors ${
                    f.id === value ? 'bg-blue-500/10' : 'hover:bg-slate-800'
                  }`}
                >
                  <span className="w-5 h-5 rounded-md border border-slate-700 flex-shrink-0" style={{ backgroundColor: f.colorHex || '#334155' }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-slate-200 text-xs font-medium truncate">{f.filamentName} — {f.colorName}</span>
                    <span className="block text-slate-600 text-[10px]">{MATERIAL_TYPE_LABELS[f.materialType]} · {available.toLocaleString()} {t('common.grams')}</span>
                  </span>
                  <StockStatusBadge status={status} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
