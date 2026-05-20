'use client';
import { Database, Shield, User } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { appUser } = useAuth();

  return (
    <DashboardLayout title="الإعدادات">
      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-slate-900 font-semibold">معلومات الحساب</h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">البريد الإلكتروني</span>
              <span className="text-slate-900 font-medium">{appUser?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">الاسم</span>
              <span className="text-slate-900 font-medium">{appUser?.displayName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">الدور</span>
              <span className="text-blue-600 font-medium capitalize">{appUser?.role}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-slate-900 font-semibold">معلومات النظام</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'اسم النظام', value: 'RoboFab Operations System' },
              { label: 'الإصدار', value: '1.0.0' },
              { label: 'قاعدة البيانات', value: 'Firebase Firestore' },
              { label: 'المصادقة', value: 'Firebase Authentication' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className="text-slate-900 text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Reference */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-slate-900 font-semibold">الأدوار والصلاحيات</h3>
          </div>
          <div className="space-y-3">
            {[
              { role: 'owner', label: 'المالك', desc: 'صلاحيات كاملة على جميع البيانات والإعدادات', color: 'text-yellow-600' },
              { role: 'admin', label: 'المدير', desc: 'إدارة الطلبات والعملاء والتقارير', color: 'text-blue-600' },
              { role: 'staff', label: 'الموظف', desc: 'إضافة وتعديل الطلبات', color: 'text-green-600' },
              { role: 'viewer', label: 'المشاهد', desc: 'عرض البيانات فقط', color: 'text-slate-600' },
            ].map(({ role, label, desc, color }) => (
              <div key={role} className={`flex items-start justify-between p-3 rounded-lg ${appUser?.role === role ? 'bg-blue-50 border border-blue-100' : ''}`}>
                <div>
                  <span className={`text-sm font-medium ${color}`}>{label}</span>
                  <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                </div>
                {appUser?.role === role && <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">حالي</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
