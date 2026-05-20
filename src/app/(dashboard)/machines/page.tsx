'use client';
import { useState, useEffect } from 'react';
import { Plus, Cpu, Pencil, Trash2, RefreshCw, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { MachineStatusBadge } from '@/components/ui/Badge';
import MachineForm from '@/components/forms/MachineForm';
import { useMachines } from '@/hooks/useMachines';
import { createMachine, updateMachine, deleteMachine } from '@/lib/firestore';
import { seedMachinesIfEmpty, forceReseedMachines, ROBOFAB_MACHINES } from '@/lib/seedMachines';
import { formatDate } from '@/utils/dateUtils';
import type { Machine } from '@/types';

type SeedState = 'idle' | 'seeding' | 'done' | 'error';

export default function MachinesPage() {
  const { machines, loading } = useMachines();

  const [showForm, setShowForm] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmReseed, setConfirmReseed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seedState, setSeedState] = useState<SeedState>('idle');
  const [seedMessage, setSeedMessage] = useState('');

  useEffect(() => {
    if (loading) return;
    if (machines.length > 0) return;

    setSeedState('seeding');
    seedMachinesIfEmpty()
      .then(({ seeded, count }) => {
        if (seeded) {
          setSeedMessage(`تم إضافة ${count} ماكينة بنجاح`);
          setSeedState('done');
        } else {
          setSeedState('idle');
        }
      })
      .catch(err => {
        console.error('Auto-seed failed:', err);
        setSeedState('error');
        setSeedMessage('فشل التهيئة التلقائية. تحقق من صلاحيات Firestore.');
      });
  }, [loading, machines.length]);

  const handleForceReseed = async () => {
    setSeedState('seeding');
    setConfirmReseed(false);
    try {
      const { count } = await forceReseedMachines();
      setSeedMessage(`تم إعادة تهيئة ${count} ماكينة بنجاح`);
      setSeedState('done');
    } catch (err) {
      console.error('Reseed failed:', err);
      setSeedState('error');
      setSeedMessage('فشلت إعادة التهيئة');
    }
  };

  const handleCreate = async (data: Partial<Machine>) => {
    setSaving(true);
    try { await createMachine(data as any); setShowForm(false); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (data: Partial<Machine>) => {
    if (!editMachine) return;
    setSaving(true);
    try { await updateMachine(editMachine.id, data); setEditMachine(null); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteMachine(deleteId); setDeleteId(null); }
    catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  const isSeedingNow = seedState === 'seeding';

  return (
    <DashboardLayout title="الماكينات">
      <div className="space-y-5">
        {/* Header actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">{machines.length} ماكينة مسجلة</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw className={`w-4 h-4 ${isSeedingNow ? 'animate-spin' : ''}`} />}
              onClick={() => setConfirmReseed(true)}
              disabled={isSeedingNow}
            >
              إعادة تهيئة القائمة
            </Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              إضافة ماكينة
            </Button>
          </div>
        </div>

        {/* Seed status banner */}
        {seedState === 'seeding' && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
            <div>
              <p className="text-blue-700 font-medium text-sm">جاري تهيئة ماكينات RoboFab...</p>
              <p className="text-blue-500 text-xs">يتم إضافة {ROBOFAB_MACHINES.length} ماكينة إلى Firestore</p>
            </div>
          </div>
        )}

        {seedState === 'done' && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm">{seedMessage}</p>
            <button
              onClick={() => setSeedState('idle')}
              className="mr-auto text-green-500 hover:text-green-700 text-xs"
            >
              إخفاء
            </button>
          </div>
        )}

        {seedState === 'error' && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{seedMessage}</p>
          </div>
        )}

        {/* Machines grid */}
        {loading || isSeedingNow ? (
          <LoadingSpinner text={isSeedingNow ? 'جاري التهيئة...' : 'جاري التحميل...'} />
        ) : machines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Cpu className="w-10 h-10 text-slate-400" />
            </div>
            <div className="text-center">
              <h3 className="text-slate-800 font-semibold mb-1">لا توجد ماكينات</h3>
              <p className="text-slate-400 text-sm">لم يتم إيجاد أي ماكينة في قاعدة البيانات</p>
            </div>
            <div className="flex gap-3">
              <Button
                icon={<Zap className="w-4 h-4" />}
                onClick={() => { setSeedState('seeding'); seedMachinesIfEmpty().then(({ seeded, count }) => { setSeedMessage(`تم إضافة ${count} ماكينة`); setSeedState('done'); }).catch(() => setSeedState('error')); }}
                loading={isSeedingNow}
              >
                تهيئة ماكينات RoboFab
              </Button>
              <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                إضافة يدوي
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {machines.map((machine, idx) => (
              <div
                key={machine.id}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 shadow-sm"
              >
                {/* Machine icon + name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-semibold leading-tight">{machine.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{machine.type}</p>
                    </div>
                  </div>
                  {/* Actions — visible on hover */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditMachine(machine)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(machine.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <MachineStatusBadge status={machine.status} />
                  <span className="text-slate-400 text-xs font-mono">#{idx + 1}</span>
                </div>

                {/* Notes */}
                {machine.notes && (
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed border-t border-slate-100 pt-3">
                    {machine.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reference list */}
        {machines.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-slate-600 text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              أسطول RoboFab الافتراضي ({ROBOFAB_MACHINES.length} ماكينة)
            </h3>
            <div className="flex flex-wrap gap-2">
              {ROBOFAB_MACHINES.map(m => {
                const exists = machines.some(existing =>
                  existing.name.toLowerCase() === m.name.toLowerCase()
                );
                return (
                  <span
                    key={m.name}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      exists
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {exists ? '✓ ' : '+ '}{m.name}
                  </span>
                );
              })}
            </div>
            <p className="text-slate-400 text-xs mt-3">
              الماكينات الخضراء موجودة في قاعدة البيانات. الرمادية غير موجودة بعد.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="إضافة ماكينة جديدة">
        <MachineForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      <Modal open={!!editMachine} onClose={() => setEditMachine(null)} title="تعديل الماكينة">
        {editMachine && <MachineForm initial={editMachine} onSubmit={handleUpdate} loading={saving} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="هل تريد حذف هذه الماكينة؟ لن تُحذف الطلبات المرتبطة بها."
      />

      <ConfirmDialog
        open={confirmReseed}
        onClose={() => setConfirmReseed(false)}
        onConfirm={handleForceReseed}
        title="إعادة تهيئة الماكينات"
        message={`سيتم حذف جميع الماكينات الحالية (${machines.length}) وإعادة إضافة القائمة الافتراضية لـ RoboFab (${ROBOFAB_MACHINES.length} ماكينة). الطلبات المرتبطة لن تُحذف.`}
      />
    </DashboardLayout>
  );
}
