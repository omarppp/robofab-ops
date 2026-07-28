'use client';
import { Pencil, Trash2, Layers } from 'lucide-react';
import { StockStatusBadge } from '@/components/ui/Badge';
import { filamentStatus, MATERIAL_TYPE_LABELS } from '@/utils/formatters';
import { useTranslation } from '@/hooks/useTranslation';
import type { FilamentStock } from '@/types';

interface Props {
  filament: FilamentStock;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
}

export default function FilamentCard({ filament, onEdit, onDelete, index = 0 }: Props) {
  const { t } = useTranslation();
  const status = filamentStatus(filament.currentGrams, filament.minStockLevel);
  const available = Math.max(0, filament.currentGrams - (filament.reservedGrams || 0));

  return (
    <div
      className={`group bg-slate-900 border rounded-xl p-4 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 animate-fade-in-up ${
        status === 'out' ? 'border-red-500/30' : status === 'low' ? 'border-amber-500/30' : 'border-slate-800'
      }`}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {filament.colorImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filament.colorImageUrl} alt={filament.colorName} className="w-9 h-9 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
          ) : (
            <span
              className="w-9 h-9 rounded-lg border border-slate-700 flex-shrink-0"
              style={{ backgroundColor: filament.colorHex || '#334155' }}
            />
          )}
          <div className="min-w-0">
            <h3 className="text-slate-200 font-semibold text-sm truncate">{filament.filamentName}</h3>
            <p className="text-slate-500 text-xs truncate">{filament.colorName}</p>
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="text-slate-600 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 rounded-md px-2 py-0.5 flex items-center gap-1">
          <Layers className="w-3 h-3" />{MATERIAL_TYPE_LABELS[filament.materialType]}
        </span>
        <StockStatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-800/50 rounded-lg px-2.5 py-2">
          <div className="text-slate-600">{t('stock.currentGrams')}</div>
          <div className="text-slate-200 font-mono font-semibold">{filament.currentGrams.toLocaleString()} {t('common.grams')}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg px-2.5 py-2">
          <div className="text-slate-600">{t('stock.available_grams')}</div>
          <div className="text-cyan-400 font-mono font-semibold">{available.toLocaleString()} {t('common.grams')}</div>
        </div>
        {filament.reservedGrams > 0 && (
          <div className="bg-slate-800/50 rounded-lg px-2.5 py-2">
            <div className="text-slate-600">{t('stock.reservedGrams')}</div>
            <div className="text-amber-400 font-mono font-semibold">{filament.reservedGrams.toLocaleString()} {t('common.grams')}</div>
          </div>
        )}
        {filament.usedGrams > 0 && (
          <div className="bg-slate-800/50 rounded-lg px-2.5 py-2">
            <div className="text-slate-600">{t('stock.usedGrams')}</div>
            <div className="text-slate-400 font-mono font-semibold">{filament.usedGrams.toLocaleString()} {t('common.grams')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
