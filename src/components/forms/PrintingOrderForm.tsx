'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Clock } from 'lucide-react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useMachines } from '@/hooks/useMachines';
import { getOrders } from '@/lib/firestore';
import type { Order, GramAllocation, BusinessLabel } from '@/types';
import { toInputDate } from '@/utils/dateUtils';

interface Props {
  initial?: Partial<Order>;
  onSubmit: (data: Partial<Order>) => Promise<void>;
  loading?: boolean;
}

const emptyAlloc = (): GramAllocation => ({ businessLabel: 'RoboFab', machineId: '', machineName: '', grams: 0 });

export default function PrintingOrderForm({ initial, onSubmit, loading }: Props) {
  const { machines } = useMachines();

  const [form, setForm] = useState({
    orderName: initial?.orderName || '',
    clientName: initial?.clientName || '',
    clientPhone: initial?.clientPhone || '',
    businessLabel: (initial?.businessLabel || 'RoboFab') as BusinessLabel,
    receivedDate: toInputDate(initial?.receivedDate) || new Date().toISOString().split('T')[0],
    deliveryDate: toInputDate(initial?.deliveryDate) || '',
    status: initial?.status || 'new',
    priority: initial?.priority || 'normal',
    machineId: initial?.machineId || '',
    machineName: initial?.machineName || '',
    material: initial?.material || '',
    color: initial?.color || '',
    quantity: initial?.quantity || 1,
    grams: initial?.grams || 0,
    price: initial?.price || 0,
    paidAmount: initial?.paidAmount || 0,
    notes: initial?.notes || '',
    splitGrams: initial?.splitGrams || false,
    gramAllocations: initial?.gramAllocations || [],
  });

  const [sched, setSched] = useState({
    plannedStartDate: initial?.plannedStartDate || '',
    printStartTime: initial?.printStartTime || '',
    printDurationHours: initial?.printDurationHours || 0,
  });
  const [conflictOrder, setConflictOrder] = useState<Order | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleMachineChange = (id: string) => {
    const m = machines.find(m => m.id === id);
    set('machineId', id);
    set('machineName', m?.name || id);
  };

  const addAlloc = () => set('gramAllocations', [...form.gramAllocations, emptyAlloc()]);

  const removeAlloc = (i: number) =>
    set('gramAllocations', form.gramAllocations.filter((_, idx) => idx !== i));

  const updateAlloc = (i: number, field: keyof GramAllocation, value: any) => {
    const allocs = [...form.gramAllocations];
    if (field === 'machineId') {
      const m = machines.find(m => m.id === value);
      allocs[i] = { ...allocs[i], machineId: value, machineName: m?.name || value };
    } else {
      allocs[i] = { ...allocs[i], [field]: value };
    }
    set('gramAllocations', allocs);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.orderName.trim()) e.orderName = 'اسم الطلب مطلوب';
    if (!form.clientName.trim()) e.clientName = 'اسم العميل مطلوب';
    if (!form.deliveryDate) e.deliveryDate = 'تاريخ التسليم مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const end = calcEnd();
    await onSubmit({
      ...form,
      section: 'printing3d',
      price: Number(form.price),
      paidAmount: Number(form.paidAmount),
      remainingAmount: Number(form.price) - Number(form.paidAmount),
      grams: Number(form.grams),
      quantity: Number(form.quantity),
      gramAllocations: form.splitGrams ? form.gramAllocations.map(a => ({ ...a, grams: Number(a.grams) })) : [],
      plannedStartDate: sched.plannedStartDate || undefined,
      printStartTime: sched.printStartTime || undefined,
      printDurationHours: sched.printDurationHours ? Number(sched.printDurationHours) : undefined,
      printEndDate: end?.endDate || undefined,
      printEndTime: end?.endTime || undefined,
    });
  };

  // Calculate end date/time from start + duration
  const calcEnd = (): { endDate: string; endTime: string } | null => {
    if (!sched.plannedStartDate || !sched.printStartTime || !sched.printDurationHours) return null;
    const start = new Date(`${sched.plannedStartDate}T${sched.printStartTime}`);
    const end = new Date(start.getTime() + Number(sched.printDurationHours) * 3600000);
    return {
      endDate: end.toISOString().split('T')[0],
      endTime: end.toTimeString().slice(0, 5),
    };
  };
  const endCalc = calcEnd();

  // Conflict detection
  useEffect(() => {
    if (!form.machineId || !sched.plannedStartDate || !sched.printStartTime || !sched.printDurationHours) {
      setConflictOrder(null);
      return;
    }
    const endResult = calcEnd();
    if (!endResult) { setConflictOrder(null); return; }
    const startTs = new Date(`${sched.plannedStartDate}T${sched.printStartTime}`).getTime();
    const endTs = new Date(`${endResult.endDate}T${endResult.endTime}`).getTime();
    getOrders('printing3d').then(orders => {
      const found = orders.find(o => {
        if (o.id === initial?.id) return false;
        if (!o.machineId || o.machineId !== form.machineId) return false;
        if (!o.plannedStartDate || !o.printStartTime) return false;
        if (o.stage === 'delivered' || o.stage === 'cancelled' || o.status === 'cancelled' || o.status === 'delivered') return false;
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

  const missingGrams = !form.splitGrams && (!form.grams || form.grams === 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {missingGrams && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-amber-700 text-sm">تحذير: لم يتم تحديد الجرامات. يُرجى إدخال الجرامات أو تفعيل تقسيم الجرامات.</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="اسم الطلب *" value={form.orderName} onChange={e => set('orderName', e.target.value)} error={errors.orderName} placeholder="مثال: طباعة هيكل روبوت" />
        <Input label="اسم العميل *" value={form.clientName} onChange={e => set('clientName', e.target.value)} error={errors.clientName} />
        <Input label="رقم هاتف العميل" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} type="tel" />
        <Select label="الجهة" value={form.businessLabel} onChange={e => set('businessLabel', e.target.value)}>
          <option value="RoboFab">RoboFab</option>
          <option value="TechNova">Tech Nova</option>
        </Select>
        <Input label="تاريخ الاستلام" type="date" value={form.receivedDate} onChange={e => set('receivedDate', e.target.value)} />
        <Input label="تاريخ التسليم *" type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} error={errors.deliveryDate} />
        <Select label="الحالة" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="new">جديد</option>
          <option value="inProgress">قيد التنفيذ</option>
          <option value="waiting">في الانتظار</option>
          <option value="completed">مكتمل</option>
          <option value="delivered">تم التسليم</option>
          <option value="cancelled">ملغي</option>
        </Select>
        <Select label="الأولوية" value={form.priority} onChange={e => set('priority', e.target.value)}>
          <option value="low">منخفض</option>
          <option value="normal">عادي</option>
          <option value="high">مرتفع</option>
          <option value="urgent">عاجل</option>
        </Select>
      </div>

      {/* Machine & Material */}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-slate-900 font-medium mb-4">تفاصيل الطباعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">الماكينة</label>
            <select
              value={form.machineId}
              onChange={e => handleMachineChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            >
              <option value="">اختر الماكينة...</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type})</option>)}
            </select>
          </div>
          <Input label="المادة" value={form.material} onChange={e => set('material', e.target.value)} placeholder="مثال: PLA, ABS" />
          <Input label="اللون" value={form.color} onChange={e => set('color', e.target.value)} />
          <Input label="الكمية" type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
        </div>
      </div>

      {/* Scheduling */}
      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-blue-500" />
          <h3 className="text-slate-900 font-medium">جدول الطباعة</h3>
          <span className="text-slate-400 text-xs">(اختياري)</span>
        </div>
        {conflictOrder && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">
              تعارض: الماكينة محجوزة بطلب &ldquo;{conflictOrder.orderName}&rdquo; في هذا الوقت
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="تاريخ بدء الطباعة"
            type="date"
            value={sched.plannedStartDate}
            onChange={e => setSched(s => ({ ...s, plannedStartDate: e.target.value }))}
          />
          <Input
            label="وقت بدء الطباعة"
            type="time"
            value={sched.printStartTime}
            onChange={e => setSched(s => ({ ...s, printStartTime: e.target.value }))}
          />
          <Input
            label="مدة الطباعة (ساعات)"
            type="number"
            min="0"
            step="0.5"
            value={sched.printDurationHours}
            onChange={e => setSched(s => ({ ...s, printDurationHours: Number(e.target.value) }))}
          />
        </div>
        {endCalc && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>وقت الانتهاء المتوقع: <span className="text-blue-600 font-medium">{endCalc.endDate} {endCalc.endTime}</span></span>
          </div>
        )}
      </div>

      {/* Grams */}
      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 font-medium">الجرامات</h3>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => set('splitGrams', !form.splitGrams)}
              className={`w-10 h-5 rounded-full transition-colors ${form.splitGrams ? 'bg-blue-500' : 'bg-slate-200'} relative`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${form.splitGrams ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-slate-600">تقسيم الجرامات</span>
          </label>
        </div>

        {!form.splitGrams ? (
          <Input
            label="الجرامات"
            type="number"
            min="0"
            step="0.01"
            value={form.grams}
            onChange={e => set('grams', e.target.value)}
            hint="أدخل إجمالي الجرامات المستخدمة"
          />
        ) : (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm">أضف توزيع الجرامات لكل جهة وماكينة:</p>
            {form.gramAllocations.map((alloc, i) => (
              <div key={i} className="flex gap-3 items-end bg-slate-50 border border-slate-100 rounded-lg p-3">
                <select
                  value={alloc.businessLabel}
                  onChange={e => updateAlloc(i, 'businessLabel', e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 text-sm flex-1 focus:outline-none focus:border-blue-500"
                >
                  <option value="RoboFab">RoboFab</option>
                  <option value="TechNova">Tech Nova</option>
                </select>
                <select
                  value={alloc.machineId}
                  onChange={e => updateAlloc(i, 'machineId', e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 text-sm flex-1 focus:outline-none focus:border-blue-500"
                >
                  <option value="">الماكينة...</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={alloc.grams}
                  onChange={e => updateAlloc(i, 'grams', Number(e.target.value))}
                  placeholder="جرامات"
                  className="w-28 bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-blue-500"
                />
                <button type="button" onClick={() => removeAlloc(i)} className="text-red-500 hover:text-red-600 transition-colors p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addAlloc}>
              إضافة توزيع
            </Button>
          </div>
        )}
      </div>

      {/* Financial */}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-slate-900 font-medium mb-4">المالية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="السعر (ر.س)" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
          <Input label="المبلغ المدفوع (ر.س)" type="number" min="0" step="0.01" value={form.paidAmount} onChange={e => set('paidAmount', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">المبلغ المتبقي (ر.س)</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-blue-600 font-mono text-sm">
              {Math.max(0, Number(form.price) - Number(form.paidAmount)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-slate-100 pt-5">
        <Textarea label="ملاحظات" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1 justify-center">
          {initial?.orderName ? 'حفظ التغييرات' : 'إنشاء الطلب'}
        </Button>
      </div>
    </form>
  );
}
