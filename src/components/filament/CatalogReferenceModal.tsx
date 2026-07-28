'use client';
import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { groupCatalogByFilament, type CatalogEntry } from '@/lib/seedFilamentCatalog';
import { MATERIAL_TYPE_LABELS } from '@/utils/formatters';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (entry: CatalogEntry) => void;
}

export default function CatalogReferenceModal({ open, onClose, onPick }: Props) {
  const [search, setSearch] = useState('');
  const groups = useMemo(() => groupCatalogByFilament(), []);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return groups;
    const result: typeof groups = {};
    for (const [name, entries] of Object.entries(groups)) {
      const matches = entries.filter(e => e.colorName.toLowerCase().includes(q) || name.toLowerCase().includes(q));
      if (matches.length) result[name] = matches;
    }
    return result;
  }, [groups, search]);

  return (
    <Modal open={open} onClose={onClose} title="كتالوج FabriGate المرجعي" size="lg">
      <p className="text-slate-500 text-xs mb-4">
        هذا الكتالوج مرجعي فقط لمساعدتك في تنظيم المخزون — لا يتم حفظ أي شيء تلقائياً في قاعدة البيانات.
        اضغط &ldquo;إضافة&rdquo; بجانب أي لون لفتح نموذج إضافة فيلمنت جديد معبأ مسبقاً بهذه البيانات.
      </p>
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث في الكتالوج..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg ps-9 pe-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="space-y-5 max-h-[55vh] overflow-y-auto pe-1">
        {Object.entries(filteredGroups).map(([filamentName, entries]) => (
          <div key={filamentName}>
            <h4 className="text-slate-300 font-semibold text-sm mb-2 flex items-center gap-2">
              {filamentName}
              <span className="text-slate-600 text-xs font-normal">({MATERIAL_TYPE_LABELS[entries[0].materialType]})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {entries.map(entry => (
                <button
                  key={entry.colorName}
                  type="button"
                  onClick={() => onPick(entry)}
                  className="flex items-center justify-between gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 rounded-lg px-3 py-2 text-start transition-colors group"
                >
                  <span className="text-slate-300 text-xs">{entry.colorName}</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-600 group-hover:text-blue-400 transition-colors">
                    <Plus className="w-3 h-3" />إضافة
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(filteredGroups).length === 0 && (
          <p className="text-slate-600 text-sm text-center py-8">لا توجد نتائج</p>
        )}
      </div>
    </Modal>
  );
}
