'use client';
import { useState } from 'react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Order, BusinessLabel } from '@/types';
import { toInputDate } from '@/utils/dateUtils';

interface Props { initial?: Partial<Order>; onSubmit: (data: Partial<Order>) => Promise<void>; loading?: boolean; }

export default function OutsourcedOrderForm({ initial, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    orderName: initial?.orderName || '',
    companyName: initial?.companyName || '',
    contactPerson: initial?.contactPerson || '',
    clientPhone: initial?.clientPhone || '',
    businessLabel: (initial?.businessLabel || 'RoboFab') as BusinessLabel,
    notes: initial?.notes || '',
    dateSent: toInputDate(initial?.dateSent) || new Date().toISOString().split('T')[0],
    expectedDeliveryDate: toInputDate(initial?.expectedDeliveryDate) || '',
    actualDeliveryDate: toInputDate(initial?.actualDeliveryDate) || '',
    status: (initial?.status || 'sent') as any,
    cost: initial?.cost || 0,
    sellingPrice: initial?.sellingPrice || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.orderName.trim()) e.orderName = 'اسم الطلب مطلوب';
    if (!form.companyName.trim()) e.companyName = 'اسم الشركة مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...form, section: 'outsourcedPrinting',
      cost: Number(form.cost), sellingPrice: Number(form.sellingPrice),
      price: Number(form.sellingPrice), paidAmount: 0,
      remainingAmount: Number(form.sellingPrice),
      clientName: form.contactPerson || form.companyName,
      deliveryDate: form.expectedDeliveryDate,
      priority: 'normal',
    });
  };

  const profit = Number(form.sellingPrice) - Number(form.cost);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="اسم الطلب *" value={form.orderName} onChange={e => set('orderName', e.target.value)} error={errors.orderName} />
        <Input label="اسم الشركة *" value={form.companyName} onChange={e => set('companyName', e.target.value)} error={errors.companyName} />
        <Input label="اسم المسؤول" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
        <Input label="رقم الهاتف" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} type="tel" />
        <Select label="الجهة" value={form.businessLabel} onChange={e => set('businessLabel', e.target.value)}>
          <option value="RoboFab">RoboFab</option>
          <option value="TechNova">Tech Nova</option>
        </Select>
        <Select label="الحالة" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="sent">تم الإرسال</option>
          <option value="inProgress">قيد التنفيذ</option>
          <option value="received">تم الاستلام</option>
          <option value="delivered">تم التسليم</option>
          <option value="cancelled">ملغي</option>
        </Select>
        <Input label="تاريخ الإرسال" type="date" value={form.dateSent} onChange={e => set('dateSent', e.target.value)} />
        <Input label="تاريخ التسليم المتوقع" type="date" value={form.expectedDeliveryDate} onChange={e => set('expectedDeliveryDate', e.target.value)} />
        <Input label="تاريخ التسليم الفعلي" type="date" value={form.actualDeliveryDate} onChange={e => set('actualDeliveryDate', e.target.value)} />
      </div>
      <div className="border-t border-slate-800 pt-5">
        <h3 className="text-slate-300 font-medium mb-4">المالية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="التكلفة (ر.س)" type="number" min="0" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} />
          <Input label="سعر البيع (ر.س)" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">الربح (ر.س)</label>
            <div className={`border rounded-xl px-3 py-2 font-mono text-sm ${profit >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {profit.toFixed(2)}
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
