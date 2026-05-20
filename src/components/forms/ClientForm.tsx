'use client';
import { useState } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Client, ClientCategory } from '@/types';
import { CLIENT_CATEGORY_LABELS } from '@/utils/formatters';

const ALL_CATEGORIES: ClientCategory[] = ['printing3d', '3dDesign', 'pcbDesign', 'pcbPrinting', 'externalPrinting'];

interface Props { initial?: Partial<Client>; onSubmit: (data: Partial<Client>) => Promise<void>; loading?: boolean; }

export default function ClientForm({ initial, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    address: initial?.address || '',
    category: initial?.category || [] as ClientCategory[],
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleCategory = (cat: ClientCategory) => {
    setForm(f => ({
      ...f,
      category: f.category.includes(cat) ? f.category.filter(c => c !== cat) : [...f.category, cat],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'اسم العميل مطلوب';
    if (!form.phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="الاسم *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
        <Input label="رقم الهاتف *" value={form.phone} onChange={e => set('phone', e.target.value)} error={errors.phone} type="tel" />
        <Input label="البريد الإلكتروني" value={form.email} onChange={e => set('email', e.target.value)} type="email" />
        <Input label="العنوان" value={form.address} onChange={e => set('address', e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-2">فئة العميل</label>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-all border ${
                form.category.includes(cat)
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {CLIENT_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>
      <Textarea label="ملاحظات" value={form.notes} onChange={e => set('notes', e.target.value)} />
      <Button type="submit" loading={loading} className="w-full justify-center">
        {initial?.name ? 'حفظ التغييرات' : 'إضافة العميل'}
      </Button>
    </form>
  );
}
