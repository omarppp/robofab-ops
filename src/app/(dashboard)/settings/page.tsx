'use client';
import Link from 'next/link';
import { Database, Shield, User, Zap, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsPage() {
  const { appUser } = useAuth();
  const { t, isRTL } = useTranslation();
  const NavIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <DashboardLayout title="الإعدادات">
      <div className="max-w-2xl space-y-4 animate-fade-in">
        {/* Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-slate-200 font-semibold text-sm">معلومات الحساب</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'البريد الإلكتروني', value: appUser?.email },
              { label: 'الاسم', value: appUser?.displayName },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs text-slate-600">{label}</span>
                <span className="text-slate-200 font-medium">{value || '—'}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-600">الدور</span>
              <span className="text-blue-400 font-medium capitalize">{appUser?.role}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-slate-200 font-semibold text-sm">معلومات النظام</h3>
          </div>
          <div className="space-y-1">
            {[
              { label: 'اسم النظام',   value: 'RoboFab Operations System' },
              { label: 'الإصدار',       value: '2.0.0 — Forge Dark' },
              { label: 'قاعدة البيانات', value: 'Firebase Firestore' },
              { label: 'المصادقة',      value: 'Firebase Authentication' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className="text-slate-300 text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="text-slate-200 font-semibold text-sm">الأدوار والصلاحيات</h3>
          </div>
          <div className="space-y-2">
            {[
              { role: 'owner',  label: 'المالك',   desc: 'صلاحيات كاملة على جميع البيانات والإعدادات', color: 'text-amber-400' },
              { role: 'admin',  label: 'المدير',   desc: 'إدارة الطلبات والعملاء والتقارير',           color: 'text-blue-400' },
              { role: 'staff',  label: 'الموظف',   desc: 'إضافة وتعديل الطلبات',                      color: 'text-green-400' },
              { role: 'viewer', label: 'المشاهد',  desc: 'عرض البيانات فقط',                          color: 'text-slate-400' },
            ].map(({ role, label, desc, color }) => (
              <div key={role} className={`flex items-start justify-between p-3 rounded-xl ${appUser?.role === role ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-slate-800/50'}`}>
                <div>
                  <span className={`text-sm font-medium ${color}`}>{label}</span>
                  <p className="text-slate-600 text-xs mt-0.5">{desc}</p>
                </div>
                {appUser?.role === role && (
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">حالي</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Owner tools */}
        {appUser?.role === 'owner' && (
          <Link
            href="/settings/reset"
            className="flex items-center gap-4 bg-slate-900 border border-red-500/20 hover:border-red-500/40 rounded-xl p-5 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-red-300 font-semibold text-sm">{t('reset.navLink')}</p>
              <p className="text-slate-600 text-xs mt-0.5">{t('reset.warning')}</p>
            </div>
            <NavIcon className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
          </Link>
        )}

        {/* Branding */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-slate-200 font-semibold text-sm">RoboFab Operations System</p>
            <p className="text-slate-600 text-xs">Forge Dark — Premium Operations Platform</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
