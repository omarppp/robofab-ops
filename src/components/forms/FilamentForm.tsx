'use client';
import { useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UploadCloud, Loader2, BookOpen } from 'lucide-react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { storage } from '@/lib/firebase';
import { FILAMENT_CATALOG, type CatalogEntry } from '@/lib/seedFilamentCatalog';
import type { FilamentStock, MaterialType } from '@/types';
import { MATERIAL_TYPE_LABELS } from '@/utils/formatters';

const MATERIALS: MaterialType[] = ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'Resin', 'Other'];

interface Props {
  initial?: Partial<FilamentStock>;
  prefill?: CatalogEntry | null;
  onSubmit: (data: Partial<FilamentStock>) => Promise<void>;
  loading?: boolean;
}

export default function FilamentForm({ initial, prefill, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    filamentName: initial?.filamentName || prefill?.filamentName || '',
    materialType: (initial?.materialType || prefill?.materialType || 'PLA') as MaterialType,
    colorName: initial?.colorName || prefill?.colorName || '',
    colorHex: initial?.colorHex || '',
    colorImageUrl: initial?.colorImageUrl || '',
    brand: initial?.brand || (prefill ? 'FabriGate' : ''),
    supplier: initial?.supplier || '',
    spoolWeight: initial?.spoolWeight ?? 1000,
    currentGrams: initial?.currentGrams ?? 0,
    minStockLevel: initial?.minStockLevel ?? 200,
    costPerKg: initial?.costPerKg ?? prefill?.costPerKg ?? 0,
    purchaseDate: initial?.purchaseDate?.split('T')[0] || '',
    storageLocation: initial?.storageLocation || '',
    notes: initial?.notes || '',
  });
  const [catalogPick, setCatalogPick] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const applyCatalogEntry = (key: string) => {
    setCatalogPick(key);
    if (!key) return;
    const [filamentName, colorName] = key.split('␟');
    const entry = FILAMENT_CATALOG.find(e => e.filamentName === filamentName && e.colorName === colorName);
    if (!entry) return;
    setForm(f => ({
      ...f,
      filamentName: entry.filamentName,
      materialType: entry.materialType,
      colorName: entry.colorName,
      brand: f.brand || 'FabriGate',
      costPerKg: entry.costPerKg,
    }));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `uploads/filament-colors/${Date.now()}-${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      set('colorImageUrl', url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.filamentName.trim()) e.filamentName = 'اسم الفيلمنت مطلوب';
    if (!form.colorName.trim()) e.colorName = 'اسم اللون مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...form,
      spoolWeight: Number(form.spoolWeight),
      currentGrams: Number(form.currentGrams),
      minStockLevel: Number(form.minStockLevel),
      costPerKg: Number(form.costPerKg),
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!initial && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            تعبئة سريعة من كتالوج FabriGate المرجعي (اختياري)
          </label>
          <select
            value={catalogPick}
            onChange={e => applyCatalogEntry(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">اختر من الكتالوج...</option>
            {FILAMENT_CATALOG.map(entry => {
              const key = `${entry.filamentName}␟${entry.colorName}`;
              return <option key={key} value={key}>{entry.filamentName} — {entry.colorName}</option>;
            })}
          </select>
          <p className="text-slate-600 text-[11px] mt-1.5">مرجع فقط — لن يُحفظ شيء تلقائياً. يمكنك تعديل أي حقل بعد التعبئة.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="اسم الفيلمنت *" value={form.filamentName} onChange={e => set('filamentName', e.target.value)} error={errors.filamentName} placeholder="مثال: PLA+" />
        <Select label="نوع الخامة" value={form.materialType} onChange={e => set('materialType', e.target.value as MaterialType)}>
          {MATERIALS.map(m => <option key={m} value={m}>{MATERIAL_TYPE_LABELS[m]}</option>)}
        </Select>
        <Input label="اسم اللون *" value={form.colorName} onChange={e => set('colorName', e.target.value)} error={errors.colorName} />
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input label="كود اللون (HEX)" value={form.colorHex} onChange={e => set('colorHex', e.target.value)} placeholder="#FFFFFF" />
          </div>
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(form.colorHex) ? form.colorHex : '#64748b'}
            onChange={e => set('colorHex', e.target.value)}
            className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer flex-shrink-0"
          />
        </div>
        <Input label="الماركة" value={form.brand} onChange={e => set('brand', e.target.value)} />
        <Input label="المورّد" value={form.supplier} onChange={e => set('supplier', e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">صورة اللون</label>
        <div className="flex items-center gap-3">
          {form.colorImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.colorImageUrl} alt={form.colorName} className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
          )}
          <label className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 cursor-pointer transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            رفع صورة
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="وزن البكرة (جم)" type="number" min="0" value={form.spoolWeight} onChange={e => set('spoolWeight', Number(e.target.value))} />
        <Input label="الكمية المتاحة (جم)" type="number" min="0" value={form.currentGrams} onChange={e => set('currentGrams', Number(e.target.value))} />
        <Input label="الحد الأدنى للتنبيه (جم)" type="number" min="0" value={form.minStockLevel} onChange={e => set('minStockLevel', Number(e.target.value))} />
        <Input label="التكلفة لكل كجم" type="number" min="0" value={form.costPerKg} onChange={e => set('costPerKg', Number(e.target.value))} />
        <Input label="تاريخ الشراء" type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
        <Input label="مكان التخزين" value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} />
      </div>

      <Textarea label="ملاحظات" value={form.notes} onChange={e => set('notes', e.target.value)} />

      <Button type="submit" loading={loading} className="w-full justify-center">
        {initial?.filamentName ? 'حفظ التغييرات' : 'إضافة الفيلمنت'}
      </Button>
    </form>
  );
}
