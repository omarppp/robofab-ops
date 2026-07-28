'use client';
import { useState, useMemo } from 'react';
import { Plus, Search, Layers, BookOpen, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import FilamentCard from '@/components/filament/FilamentCard';
import FilamentForm from '@/components/forms/FilamentForm';
import CatalogReferenceModal from '@/components/filament/CatalogReferenceModal';
import { useFilamentStock } from '@/hooks/useFilamentStock';
import { useTranslation } from '@/hooks/useTranslation';
import { createFilament, updateFilament, deleteFilament } from '@/lib/filamentStock';
import type { CatalogEntry } from '@/lib/seedFilamentCatalog';
import { filamentStatus, MATERIAL_TYPE_LABELS } from '@/utils/formatters';
import type { FilamentStock, MaterialType, FilamentStatus } from '@/types';

const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20';
const MATERIALS: MaterialType[] = ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'Resin', 'Other'];

export default function FilamentStockPage() {
  const { filaments, loading } = useFilamentStock();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState<MaterialType | ''>('');
  const [colorFilter, setColorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilamentStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [catalogPrefill, setCatalogPrefill] = useState<CatalogEntry | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [editFilament, setEditFilament] = useState<FilamentStock | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openAddForm = () => { setCatalogPrefill(null); setShowForm(true); };

  const handlePickFromCatalog = (entry: CatalogEntry) => {
    setCatalogPrefill(entry);
    setShowCatalog(false);
    setShowForm(true);
  };

  const handleCreate = async (data: Partial<FilamentStock>) => {
    setSaving(true);
    try { await createFilament(data as Omit<FilamentStock, 'id' | 'createdAt' | 'updatedAt'>); setShowForm(false); setCatalogPrefill(null); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleUpdate = async (data: Partial<FilamentStock>) => {
    if (!editFilament) return; setSaving(true);
    try { await updateFilament(editFilament.id, data); setEditFilament(null); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    try { await deleteFilament(deleteId); setDeleteId(null); }
    catch (err) { console.error(err); } finally { setDeleting(false); }
  };

  const colorOptions = useMemo(() => Array.from(new Set(filaments.map(f => f.colorName))).sort(), [filaments]);

  const filtered = useMemo(() => filaments.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.filamentName.toLowerCase().includes(q) || f.colorName.toLowerCase().includes(q);
    const matchMaterial = !materialFilter || f.materialType === materialFilter;
    const matchColor = !colorFilter || f.colorName === colorFilter;
    const matchStatus = !statusFilter || filamentStatus(f.currentGrams, f.minStockLevel) === statusFilter;
    return matchSearch && matchMaterial && matchColor && matchStatus;
  }), [filaments, search, materialFilter, colorFilter, statusFilter]);

  const lowStock = useMemo(() => filaments.filter(f => filamentStatus(f.currentGrams, f.minStockLevel) === 'low'), [filaments]);
  const outStock = useMemo(() => filaments.filter(f => filamentStatus(f.currentGrams, f.minStockLevel) === 'out'), [filaments]);

  return (
    <DashboardLayout title={t('stock.title')}>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-slate-500 text-sm">{filaments.length} {t('stock.count')}</span>
          <div className="flex gap-2">
            <Button variant="outline" icon={<BookOpen className="w-4 h-4" />} onClick={() => setShowCatalog(true)}>
              كتالوج مرجعي
            </Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={openAddForm}>{t('stock.new')}</Button>
          </div>
        </div>

        {(outStock.length > 0 || lowStock.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outStock.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-red-300 font-semibold text-sm">{t('stock.outOfStockList')} ({outStock.length})</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {outStock.map(f => (
                    <span key={f.id} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 rounded-md px-2 py-0.5">{f.filamentName} — {f.colorName}</span>
                  ))}
                </div>
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-amber-300 font-semibold text-sm">{t('stock.lowStockList')} ({lowStock.length})</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lowStock.map(f => (
                    <span key={f.id} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md px-2 py-0.5">{f.filamentName} — {f.colorName} ({f.currentGrams}g)</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 relative min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('stock.search')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
          </div>
          <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value as MaterialType | '')} className={selectCls}>
            <option value="">{t('stock.filterMaterial')}: {t('common.all')}</option>
            {MATERIALS.map(m => <option key={m} value={m}>{MATERIAL_TYPE_LABELS[m]}</option>)}
          </select>
          <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} className={selectCls}>
            <option value="">{t('common.all')} — {t('stock.colorName')}</option>
            {colorOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FilamentStatus | '')} className={selectCls}>
            <option value="">{t('stock.filterStatus')}: {t('common.all')}</option>
            <option value="available">{t('stock.available')}</option>
            <option value="low">{t('stock.low')}</option>
            <option value="out">{t('stock.out')}</option>
          </select>
          <span className="text-slate-500 text-sm ms-auto">{filtered.length} {t('common.total')}</span>
        </div>

        {loading ? (
          <LoadingSpinner text={t('common.loading')} />
        ) : filaments.length === 0 ? (
          <EmptyState
            title={t('stock.empty')}
            description="ابدأ بإضافة أول لون فيلمنت — يمكنك استخدام الكتالوج المرجعي للمساعدة."
            icon={<Layers className="w-8 h-8 text-slate-600" />}
            action={
              <div className="flex gap-2">
                <Button icon={<Plus className="w-4 h-4" />} onClick={openAddForm}>{t('stock.new')}</Button>
                <Button variant="outline" icon={<BookOpen className="w-4 h-4" />} onClick={() => setShowCatalog(true)}>كتالوج مرجعي</Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title={t('common.noResults')} icon={<Search className="w-8 h-8 text-slate-600" />} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((f, i) => (
              <FilamentCard key={f.id} filament={f} index={i} onEdit={() => setEditFilament(f)} onDelete={() => setDeleteId(f.id)} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal open={showForm} onClose={() => { setShowForm(false); setCatalogPrefill(null); }} title={t('stock.new')} size="lg">
          <FilamentForm key={catalogPrefill ? `${catalogPrefill.filamentName}-${catalogPrefill.colorName}` : 'blank'} prefill={catalogPrefill} onSubmit={handleCreate} loading={saving} />
        </Modal>
      )}
      <Modal open={!!editFilament} onClose={() => setEditFilament(null)} title={t('stock.edit')} size="lg">
        {editFilament && <FilamentForm initial={editFilament} onSubmit={handleUpdate} loading={saving} />}
      </Modal>
      <CatalogReferenceModal open={showCatalog} onClose={() => setShowCatalog(false)} onPick={handlePickFromCatalog} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </DashboardLayout>
  );
}
