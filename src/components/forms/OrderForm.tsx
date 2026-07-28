'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, Clock, ShieldAlert, UploadCloud, X, Loader2 } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FilamentSelect from '@/components/filament/FilamentSelect';
import { useMachines } from '@/hooks/useMachines';
import { useFilamentStock } from '@/hooks/useFilamentStock';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getOrders } from '@/lib/firestore';
import { storage } from '@/lib/firebase';
import { toInputDate } from '@/utils/dateUtils';
import { MATERIAL_TYPE_LABELS } from '@/utils/formatters';
import type { Order, OrderCategory, FilamentStock } from '@/types';

interface Props {
  category: OrderCategory;
  initial?: Partial<Order>;
  onSubmit: (data: Partial<Order>) => Promise<{ insufficientStock?: boolean } | void>;
  loading?: boolean;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-slate-300 font-semibold mb-4 text-sm">{children}</h3>;
}

export default function OrderForm({ category, initial, onSubmit, loading }: Props) {
  const { machines } = useMachines();
  const { filaments } = useFilamentStock();
  const { appUser } = useAuth();
  const { t } = useTranslation();
  const canOverride = appUser?.role === 'owner' || appUser?.role === 'admin';

  const [form, setForm] = useState({
    orderName: initial?.orderName || '',
    clientName: initial?.clientName || '',
    clientPhone: initial?.clientPhone || '',
    productType: initial?.productType || '',
    receivedDate: toInputDate(initial?.receivedDate) || new Date().toISOString().split('T')[0],
    deliveryDate: toInputDate(initial?.deliveryDate) || '',
    priority: initial?.priority || 'normal',
    machineId: initial?.machineId || '',
    machineName: initial?.machineName || '',
    quantity: initial?.quantity || 1,
    estimatedGrams: initial?.estimatedGrams || 0,
    actualGrams: initial?.actualGrams,
    price: initial?.price || 0,
    paidAmount: initial?.paidAmount || 0,
    notes: initial?.notes || '',
    attachments: initial?.attachments || [] as string[],
  });

  const [selectedFilament, setSelectedFilament] = useState<FilamentStock | null>(null);
  const [stockOverride, setStockOverride] = useState(false);
  const [sched, setSched] = useState({
    plannedStartDate: initial?.plannedStartDate || '',
    printStartTime: initial?.printStartTime || '',
    printDurationHours: initial?.printDurationHours || 0,
  });
  const [conflictOrder, setConflictOrder] = useState<Order | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(f => ({ ...f, [key]: value }));

  const handleMachineChange = (id: string) => {
    const m = machines.find(m => m.id === id);
    set('machineId', id);
    set('machineName', m?.name || id);
  };

  const handleFilamentChange = (filament: FilamentStock | null) => {
    setSelectedFilament(filament);
    setStockOverride(false);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `uploads/order-attachments/${Date.now()}-${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      set('attachments', [...form.attachments, url]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (url: string) => set('attachments', form.attachments.filter(a => a !== url));

  const availableGrams = selectedFilament ? Math.max(0, selectedFilament.currentGrams - (selectedFilament.reservedGrams || 0)) : null;
  const insufficientStock = !!selectedFilament && form.estimatedGrams > (availableGrams ?? 0);
  const blockedBySubmit = insufficientStock && !(canOverride && stockOverride);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.orderName.trim()) e.orderName = 'اسم الطلب مطلوب';
    if (!form.clientName.trim()) e.clientName = 'اسم العميل مطلوب';
    if (!form.deliveryDate) e.deliveryDate = 'تاريخ التسليم مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const calcEnd = (): { endDate: string; endTime: string } | null => {
    if (!sched.plannedStartDate || !sched.printStartTime || !sched.printDurationHours) return null;
    const start = new Date(`${sched.plannedStartDate}T${sched.printStartTime}`);
    const end = new Date(start.getTime() + Number(sched.printDurationHours) * 3600000);
    return { endDate: end.toISOString().split('T')[0], endTime: end.toTimeString().slice(0, 5) };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || blockedBySubmit) return;
    const end = calcEnd();
    await onSubmit({
      ...form,
      category,
      stage: initial?.stage || 'new',
      price: Number(form.price),
      paidAmount: Number(form.paidAmount),
      remainingAmount: Number(form.price) - Number(form.paidAmount),
      quantity: Number(form.quantity),
      estimatedGrams: Number(form.estimatedGrams) || undefined,
      actualGrams: form.actualGrams != null ? Number(form.actualGrams) : undefined,
      filamentId: selectedFilament?.id,
      filamentName: selectedFilament?.filamentName,
      filamentColorName: selectedFilament?.colorName,
      materialType: selectedFilament?.materialType,
      stockOverride: insufficientStock ? stockOverride : undefined,
      plannedStartDate: sched.plannedStartDate || undefined,
      printStartTime: sched.printStartTime || undefined,
      printDurationHours: sched.printDurationHours ? Number(sched.printDurationHours) : undefined,
      printEndDate: end?.endDate || undefined,
      printEndTime: end?.endTime || undefined,
    });
  };

  const endCalc = calcEnd();

  useEffect(() => {
    if (initial?.filamentId && !selectedFilament) {
      const found = filaments.find(f => f.id === initial.filamentId);
      if (found) setSelectedFilament(found);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.filamentId, filaments]);

  useEffect(() => {
    if (!form.machineId || !sched.plannedStartDate || !sched.printStartTime || !sched.printDurationHours) {
      setConflictOrder(null);
      return;
    }
    const endResult = calcEnd();
    if (!endResult) { setConflictOrder(null); return; }
    const startTs = new Date(`${sched.plannedStartDate}T${sched.printStartTime}`).getTime();
    const endTs = new Date(`${endResult.endDate}T${endResult.endTime}`).getTime();
    getOrders().then(orders => {
      const found = orders.find(o => {
        if (o.id === initial?.id) return false;
        if (!o.machineId || o.machineId !== form.machineId) return false;
        if (!o.plannedStartDate || !o.printStartTime) return false;
        if (o.stage === 'delivered' || o.stage === 'cancelled') return false;
        const oStart = new Date(`${o.plannedStartDate}T${o.printStartTime}`).getTime();
        const oEnd = o.printEndDate && o.printEndTime
          ? new Date(`${o.printEndDate}T${o.printEndTime}`).getTime()
          : oStart + (o.printDurationHours || 1) * 3600000;
        return startTs < oEnd && endTs > oStart;
      });
      setConflictOrder(found || null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.machineId, sched.plannedStartDate, sched.printStartTime, sched.printDurationHours]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Client info ── */}
      <div>
        <SectionHeading>{t('form.sectionClient')}</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={`${t('form.clientName')} *`} value={form.clientName} onChange={e => set('clientName', e.target.value)} error={errors.clientName} />
          <Input label={t('form.clientPhone')} value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} type="tel" />
        </div>
      </div>

      {/* ── Order info ── */}
      <div className="border-t border-slate-800 pt-5">
        <SectionHeading>{t('form.sectionOrder')}</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={`${t('form.orderName')} *`} value={form.orderName} onChange={e => set('orderName', e.target.value)} error={errors.orderName} />
          <Input label={t('form.productType')} value={form.productType} onChange={e => set('productType', e.target.value)} />
          <Input label={t('form.receivedDate')} type="date" value={form.receivedDate} onChange={e => set('receivedDate', e.target.value)} />
          <Input label={`${t('form.deliveryDate')} *`} type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} error={errors.deliveryDate} />
          <Select label={t('form.priority')} value={form.priority} onChange={e => set('priority', e.target.value as Order['priority'])}>
            <option value="low">{t('priority.low')}</option>
            <option value="normal">{t('priority.normal')}</option>
            <option value="high">{t('priority.high')}</option>
            <option value="urgent">{t('priority.urgent')}</option>
          </Select>
          <Input label={t('order.quantity')} type="number" min="1" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
        </div>
      </div>

      {/* ── Production info ── */}
      <div className="border-t border-slate-800 pt-5">
        <SectionHeading>{t('form.sectionProduction')}</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">{t('order.machine')}</label>
            <select
              value={form.machineId}
              onChange={e => handleMachineChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            >
              <option value="">—</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type})</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs">
          <Clock className="w-3.5 h-3.5" />
          {t('sched.title')} <span className="text-slate-600">({t('common.optional')})</span>
        </div>
        {conflictOrder && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{t('sched.conflictDesc')}: &ldquo;{conflictOrder.orderName}&rdquo;</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={t('sched.startDate')} type="date" value={sched.plannedStartDate} onChange={e => setSched(s => ({ ...s, plannedStartDate: e.target.value }))} />
          <Input label={t('sched.startTime')} type="time" value={sched.printStartTime} onChange={e => setSched(s => ({ ...s, printStartTime: e.target.value }))} />
          <Input label={t('sched.duration')} type="number" min="0" step="0.5" value={sched.printDurationHours} onChange={e => setSched(s => ({ ...s, printDurationHours: Number(e.target.value) }))} />
        </div>
        {endCalc && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{t('sched.endDate')}: <span className="text-blue-400 font-medium">{endCalc.endDate} {endCalc.endTime}</span></span>
          </div>
        )}
      </div>

      {/* ── Filament usage ── */}
      <div className="border-t border-slate-800 pt-5">
        <SectionHeading>{t('form.sectionFilament')}</SectionHeading>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">{t('order.filament')}</label>
            <FilamentSelect value={selectedFilament?.id} onChange={handleFilamentChange} />
          </div>
          {selectedFilament && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{t('order.materialType')}:</span>
              <span className="text-slate-300 font-medium">{MATERIAL_TYPE_LABELS[selectedFilament.materialType]}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('order.estimatedGrams')} type="number" min="0" step="0.01" value={form.estimatedGrams} onChange={e => set('estimatedGrams', Number(e.target.value))} />
            <Input label={t('order.actualGrams')} type="number" min="0" step="0.01" value={form.actualGrams ?? ''} onChange={e => set('actualGrams', e.target.value === '' ? undefined : Number(e.target.value))} hint={t('common.optional')} />
          </div>

          {insufficientStock && (
            <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm font-medium">{t('alert.insufficientStock')}</p>
              </div>
              {canOverride ? (
                <label className="flex items-center gap-2 text-xs text-red-300 cursor-pointer select-none ps-6">
                  <input type="checkbox" checked={stockOverride} onChange={e => setStockOverride(e.target.checked)} className="accent-red-500" />
                  {t('alert.stockOverride')}
                </label>
              ) : (
                <p className="text-red-500/70 text-xs ps-6">{t('alert.stockOverride')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment info ── */}
      <div className="border-t border-slate-800 pt-5">
        <SectionHeading>{t('form.sectionPayment')}</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={`${t('form.price')} (${t('common.sar')})`} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', Number(e.target.value))} />
          <Input label={`${t('form.paidAmount')} (${t('common.sar')})`} type="number" min="0" step="0.01" value={form.paidAmount} onChange={e => set('paidAmount', Number(e.target.value))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">{t('form.remainingAmount')} ({t('common.sar')})</label>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-blue-400 font-mono text-sm">
              {Math.max(0, Number(form.price) - Number(form.paidAmount)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes & attachments ── */}
      <div className="border-t border-slate-800 pt-5">
        <SectionHeading>{t('form.sectionNotes')}</SectionHeading>
        <Textarea label={t('form.notes')} value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-300 block mb-2">{t('form.attachments')}</label>
          {form.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.attachments.map(url => (
                <div key={url} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                  <button type="button" onClick={() => removeAttachment(url)} className="absolute -top-1.5 -end-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 cursor-pointer transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {t('common.upload')}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} disabled={blockedBySubmit} className="flex-1 justify-center">
          {initial?.orderName ? t('common.saveChanges') : t('common.createOrder')}
        </Button>
      </div>
    </form>
  );
}
