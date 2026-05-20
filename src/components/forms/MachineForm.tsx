'use client';
import { useState } from 'react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Machine, MachineStatus } from '@/types';

interface Props { initial?: Partial<Machine>; onSubmit: (data: Partial<Machine>) => Promise<void>; loading?: boolean; }

export default function MachineForm({ initial, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || '',
    status: (initial?.status || 'active') as MachineStatus,
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'اسم الماكينة مطلوب';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الماكينة *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="مثال: MAX, Ender 3" />
      <Input label="نوع الماكينة" value={form.type} onChange={e => set('type', e.target.value)} placeholder="مثال: FDM, SLA, SLS" />
      <Select label="الحالة" value={form.status} onChange={e => set('status', e.target.value)}>
        <option value="active">نشط</option>
        <option value="maintenance">صيانة</option>
        <option value="offline">غير متاح</option>
      </Select>
      <Textarea label="ملاحظات" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
      <Button type="submit" loading={loading} className="w-full justify-center">
        {initial?.name ? 'حفظ التغييرات' : 'إضافة الماكينة'}
      </Button>
    </form>
  );
}
