'use client';
import { useState } from 'react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Order, BusinessLabel, DesignType } from '@/types';
import { toInputDate } from '@/utils/dateUtils';

interface Props { initial?: Partial<Order>; onSubmit: (data: Partial<Order>) => Promise<void>; loading?: boolean; }

export default function DesignOrderForm({ initial, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    orderName: initial?.orderName || '',
    clientName: initial?.clientName || '',
    clientPhone: initial?.clientPhone || '',
    businessLabel: (initial?.businessLabel || 'RoboFab') as BusinessLabel,
    designType: (initial?.designType || '3dDesign') as DesignType,
    receivedDate: toInputDate(initial?.receivedDate) || new Date().toISOString().split('T')[0],
    deliveryDate: toInputDate(initial?.deliveryDate) || '',
    status: initial?.status || 'new',
    priority: initial?.priority || 'normal',
    price: initial?.price || 0,
    paidAmount: initial?.paidAmount || 0,
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

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
    await onSubmit({
      ...form, section: 'design',
      price: Number(form.price), paidAmount: Number(form.paidAmount),
      remainingAmount: Number(form.price) - Number(form.paidAmount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="اسم الطلب *" value={form.orderName} onChange={e => set('orderName', e.target.value)} error={errors.orderName} />
        <Input label="اسم العميل *" value={form.clientName} onChange={e => set('clientName', e.target.value)} error={errors.clientName} />
        <Input label="رقم الهاتف" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} type="tel" />
        <Select label="الجهة" value={form.businessLabel} onChange={e => set('businessLabel', e.target.value)}>
          <option value="RoboFab">RoboFab</option>
          <option value="TechNova">Tech Nova</option>
        </Select>
        <Select label="نوع التصميم" value={form.designType} onChange={e => set('designType', e.target.value)}>
          <option value="3dDesign">تصميم ثلاثي الأبعاد</option>
          <option value="pcbDesign">تصميم PCB</option>
        </Select>
        <Select label="الحالة" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="new">جديد</option><option value="inProgress">قيد التنفيذ</option>
          <option value="waiting">في الانتظار</option><option value="completed">مكتمل</option>
          <option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option>
        </Select>
        <Select label="الأولوية" value={form.priority} onChange={e => set('priority', e.target.value)}>
          <option value="low">منخفض</option><option value="normal">عادي</option>
          <option value="high">مرتفع</option><option value="urgent">عاجل</option>
        </Select>
        <Input label="تاريخ الاستلام" type="date" value={form.receivedDate} onChange={e => set('receivedDate', e.target.value)} />
        <Input label="تاريخ التسليم *" type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} error={errors.deliveryDate} />
      </div>
      <div className="border-t border-slate-800 pt-5">
        <h3 className="text-slate-300 font-medium mb-4">المالية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="السعر (ر.س)" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
          <Input label="المبلغ المدفوع (ر.س)" type="number" min="0" step="0.01" value={form.paidAmount} onChange={e => set('paidAmount', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">المتبقي (ر.س)</label>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-blue-400 font-mono text-sm">
              {Math.max(0, Number(form.price) - Number(form.paidAmount)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      <Textarea label="ملاحظات" value={form.notes} onChange={e => set('notes', e.target.value)} />
      <Button type="submit" loading={loading} className="w-full justify-center">
        {initial?.orderName ? 'حفظ التغييرات' : 'إنشاء الطلب'}
      </Button>
    </form>
  );
}
