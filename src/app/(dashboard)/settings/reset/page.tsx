'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ShieldOff, Trash2, CheckCircle2, XCircle, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { resetOperationalData, type ResetStep, type ResetResult } from '@/lib/resetOperationalData';
import type { TranslationKey } from '@/i18n/translations';

const CONFIRM_PHRASE = 'RESET ROBOFAB DATA';

const STEP_KEY: Record<ResetStep, TranslationKey> = {
  activity: 'reset.stepActivity',
  orders: 'reset.stepOrders',
  clients: 'reset.stepClients',
  filamentStock: 'reset.stepFilamentStock',
  machines: 'reset.stepMachines',
  seeding: 'reset.stepSeeding',
};

export default function ResetOperationalDataPage() {
  const { appUser } = useAuth();
  const { t, isRTL } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<ResetStep | null>(null);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const BackArrow = isRTL ? ArrowLeft : ArrowRight;
  const canProceed = confirmText.trim() === CONFIRM_PHRASE;

  const handleReset = async () => {
    setShowConfirm(false);
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await resetOperationalData(s => setStep(s));
      setResult(res);
      setConfirmText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      setStep(null);
    }
  };

  if (appUser && appUser.role !== 'owner') {
    return (
      <DashboardLayout title={t('reset.title')}>
        <div className="max-w-lg mx-auto mt-10 bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-slate-200 font-semibold mb-1">{t('reset.accessDenied')}</p>
          <Link href="/settings" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mt-3">
            <BackArrow className="w-4 h-4" />{t('common.back')}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('reset.title')}>
      <div className="max-w-2xl space-y-4 animate-fade-in">
        <Link href="/settings" className="flex items-center gap-1 text-slate-500 hover:text-slate-200 transition-colors text-sm w-fit">
          <BackArrow className="w-4 h-4" />{t('common.back')}
        </Link>

        <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-slate-100 font-bold text-lg">{t('reset.title')}</h1>
              <p className="text-red-400 text-xs">{t('reset.warning')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <h3 className="text-red-300 font-semibold text-xs">{t('reset.willDelete')}</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-red-300/80">
                <li>• {t('reset.itemOrders')}</li>
                <li>• {t('reset.itemMachines')}</li>
                <li>• {t('reset.itemClients')}</li>
                <li>• {t('reset.itemFilament')}</li>
              </ul>
            </div>
            <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <h3 className="text-green-300 font-semibold text-xs">{t('reset.willKeep')}</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-green-300/80">
                <li>• {t('reset.itemUsers')}</li>
                <li>• {t('reset.itemAuth')}</li>
                <li>• {t('reset.itemLogin')}</li>
              </ul>
            </div>
          </div>

          {!running && !result && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 block">{t('reset.confirmLabel')}</label>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                dir="ltr"
                className="w-full bg-slate-800 border border-red-500/30 rounded-lg px-3 py-2.5 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              />
              <Button
                variant="danger"
                className="w-full justify-center"
                disabled={!canProceed}
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowConfirm(true)}
              >
                {t('reset.confirmButton')}
              </Button>
            </div>
          )}

          {running && (
            <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-4">
              <Loader2 className="w-5 h-5 text-red-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-slate-200 text-sm font-medium">{t('reset.running')}</p>
                {step && <p className="text-slate-500 text-xs mt-0.5">{t(STEP_KEY[step])}</p>}
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-green-300 font-medium text-sm">{t('reset.success')}</p>
              </div>
              <p className="text-slate-400 text-xs font-medium mb-1.5">{t('reset.summary')}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 flex justify-between"><span className="text-slate-500">{t('nav.allOrders')}</span><span className="text-slate-200 font-mono">{result.deleted.orders}</span></div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 flex justify-between"><span className="text-slate-500">{t('nav.clients')}</span><span className="text-slate-200 font-mono">{result.deleted.clients}</span></div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 flex justify-between"><span className="text-slate-500">{t('nav.filamentStock')}</span><span className="text-slate-200 font-mono">{result.deleted.filamentStock}</span></div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 flex justify-between"><span className="text-slate-500">{t('activity.title')}</span><span className="text-slate-200 font-mono">{result.deleted.activity}</span></div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 flex justify-between col-span-2"><span className="text-slate-500">{t('nav.machines')} ({t('common.total')} → {result.seededMachines})</span><span className="text-slate-200 font-mono">-{result.deleted.machines}</span></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-3">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-300 text-sm font-medium">{t('reset.error')}</p>
                <p className="text-red-500 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReset}
        title={t('reset.confirmDialogTitle')}
        message={t('reset.confirmDialogMessage')}
      />
    </DashboardLayout>
  );
}
