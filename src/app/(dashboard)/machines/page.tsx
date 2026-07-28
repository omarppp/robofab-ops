'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Cpu, Pencil, Trash2, RefreshCw, Zap, CheckCircle2, AlertCircle, ArrowUpCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { MachineStatusBadge } from '@/components/ui/Badge';
import MachineForm from '@/components/forms/MachineForm';
import { useMachines } from '@/hooks/useMachines';
import { createMachine, updateMachine, deleteMachine } from '@/lib/firestore';
import { seedMachinesIfEmpty, migrateToNewFleet, hasRetiredMachines, ROBOFAB_MACHINES } from '@/lib/seedMachines';
import type { Machine } from '@/types';

type SeedState = 'idle' | 'seeding' | 'done' | 'error';

export default function MachinesPage() {
  const { machines, loading } = useMachines();
  const [showForm, setShowForm] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmMigrate, setConfirmMigrate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seedState, setSeedState] = useState<SeedState>('idle');
  const [seedMessage, setSeedMessage] = useState('');

  useEffect(() => {
    if (loading || machines.length > 0) return;
    setSeedState('seeding');
    seedMachinesIfEmpty()
      .then(({ seeded, count }) => {
        if (seeded) { setSeedMessage(`تم إضافة ${count} ماكينة بنجاح`); setSeedState('done'); }
        else setSeedState('idle');
      })
      .catch(() => { setSeedState('error'); setSeedMessage('فشل التهيئة التلقائية.'); });
  }, [loading, machines.length]);

  const needsMigration = useMemo(() => hasRetiredMachines(machines), [machines]);

  const handleMigrate = async () => {
    setSeedState('seeding'); setConfirmMigrate(false);
    try {
      const { removed, added } = await migrateToNewFleet();
      setSeedMessage(`تم حذف ${removed} ماكينة قديمة وإضافة ${added} ماكينة جديدة`); setSeedState('done');
    } catch { setSeedState('error'); setSeedMessage('فشل تحديث قائمة الماكينات'); }
  };

  const handleCreate = async (data: Partial<Machine>) => {
    setSaving(true);
    try { await createMachine(data as Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>); setShowForm(false); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleUpdate = async (data: Partial<Machine>) => {
    if (!editMachine) return; setSaving(true);
    try { await updateMachine(editMachine.id, data); setEditMachine(null); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    try { await deleteMachine(deleteId); setDeleteId(null); }
    catch (err) { console.error(err); } finally { setDeleting(false); }
  };

  const isSeedingNow = seedState === 'seeding';

  return (
    <DashboardLayout title="الماكينات">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-slate-500 text-sm">{machines.length} ماكينة مسجلة</span>
          <div className="flex gap-2">
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>إضافة ماكينة</Button>
          </div>
        </div>

        {needsMigration && (
          <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-5 py-3 flex-wrap">
            <ArrowUpCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div className="flex-1 min-w-40">
              <p className="text-violet-300 font-medium text-sm">تم رصد ماكينات من الأسطول القديم</p>
              <p className="text-violet-500 text-xs">سيتم حذف الأسماء القديمة فقط وإضافة أي ماكينة جديدة ناقصة — بدون تكرار.</p>
            </div>
            <Button size="sm" variant="outline" icon={<RefreshCw className={`w-3.5 h-3.5 ${isSeedingNow ? 'animate-spin' : ''}`} />} onClick={() => setConfirmMigrate(true)} disabled={isSeedingNow}>
              تحديث لقائمة الماكينات الجديدة
            </Button>
          </div>
        )}

        {seedState === 'seeding' && (
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-3">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            <p className="text-blue-300 font-medium text-sm">جاري التحديث...</p>
          </div>
        )}
        {seedState === 'done' && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-green-400 text-sm">{seedMessage}</p>
            <button onClick={() => setSeedState('idle')} className="ms-auto text-green-600 hover:text-green-400 text-xs">إخفاء</button>
          </div>
        )}
        {seedState === 'error' && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{seedMessage}</p>
          </div>
        )}

        {loading || isSeedingNow ? (
          <LoadingSpinner text={isSeedingNow ? 'جاري التحديث...' : 'جاري التحميل...'} />
        ) : machines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Cpu className="w-10 h-10 text-slate-600" />
            </div>
            <div className="text-center">
              <h3 className="text-slate-300 font-semibold mb-1">لا توجد ماكينات</h3>
              <p className="text-slate-600 text-sm">لم يتم إيجاد أي ماكينة في قاعدة البيانات</p>
            </div>
            <div className="flex gap-3">
              <Button icon={<Zap className="w-4 h-4" />} onClick={() => { setSeedState('seeding'); seedMachinesIfEmpty().then(({ seeded, count }) => { setSeedMessage(`تم إضافة ${count} ماكينة`); setSeedState('done'); }).catch(() => setSeedState('error')); }} loading={isSeedingNow}>
                تهيئة ماكينات RoboFab
              </Button>
              <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>إضافة يدوي</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {machines.map((machine, idx) => (
              <div key={machine.id} className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-200 font-semibold leading-tight">{machine.name}</h3>
                      <p className="text-slate-500 text-xs mt-0.5">{machine.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditMachine(machine)} className="text-slate-600 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(machine.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <MachineStatusBadge status={machine.status} />
                  <span className="text-slate-700 text-xs font-mono">#{idx + 1}</span>
                </div>
                {machine.notes && (
                  <p className="text-slate-600 text-xs mt-3 leading-relaxed border-t border-slate-800 pt-3">{machine.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {machines.length > 0 && !needsMigration && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              أسطول RoboFab الحالي ({ROBOFAB_MACHINES.length} ماكينة)
            </h3>
            <div className="flex flex-wrap gap-2">
              {ROBOFAB_MACHINES.map(m => {
                const exists = machines.some(e => e.name.toLowerCase() === m.name.toLowerCase());
                return (
                  <span key={m.name} className={`text-xs px-2.5 py-1 rounded-full border ${exists ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                    {exists ? '✓ ' : '+ '}{m.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="إضافة ماكينة جديدة">
        <MachineForm onSubmit={handleCreate} loading={saving} />
      </Modal>
      <Modal open={!!editMachine} onClose={() => setEditMachine(null)} title="تعديل الماكينة">
        {editMachine && <MachineForm initial={editMachine} onSubmit={handleUpdate} loading={saving} />}
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} message="هل تريد حذف هذه الماكينة؟ لن تُحذف الطلبات المرتبطة بها." />
      <ConfirmDialog
        open={confirmMigrate}
        onClose={() => setConfirmMigrate(false)}
        onConfirm={handleMigrate}
        title="تحديث قائمة الماكينات"
        message="سيتم حذف الماكينات القديمة المطابقة فقط وإضافة أي ماكينة جديدة ناقصة. الماكينات المخصصة الأخرى لن تتأثر."
      />
    </DashboardLayout>
  );
}
