'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { useAuth, type ProfileErrorCode } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';

// Bilingual messages shown when profile validation fails
const ERROR_COPY: Record<ProfileErrorCode, { ar: string; en: string }> = {
  not_found:        { ar: 'هذا المستخدم غير مفعّل داخل النظام',        en: 'This user is not activated in the system' },
  inactive:         { ar: 'هذا المستخدم غير مفعّل داخل النظام',        en: 'This user is not activated in the system' },
  permission_denied:{ ar: 'لا تملك صلاحية الوصول لهذا النظام',         en: 'You do not have permission to access this system' },
  invalid_role:     { ar: 'دور المستخدم غير معرّف في النظام',           en: 'User role is not configured in the system' },
  error:            { ar: 'حدث خطأ أثناء التحقق من صلاحياتك',           en: 'An error occurred while verifying your permissions' },
};

function AccessDeniedScreen({ code, onSignOut }: { code: ProfileErrorCode; onSignOut: () => void }) {
  const msgs = ERROR_COPY[code] ?? ERROR_COPY.error;
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl shadow-slate-200/60">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-slate-900 font-bold text-lg mb-1">{msgs.ar}</h2>
        <p className="text-slate-500 text-sm mb-6">{msgs.en}</p>
        <button
          onClick={onSignOut}
          className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl px-4 py-2.5 text-sm transition-colors"
        >
          تسجيل الخروج &nbsp;/&nbsp; Sign Out
        </button>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading, profileError, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Still resolving auth state
  if (loading) return <PageLoader />;

  // Auth resolved but no Firebase user → redirect handled by useEffect above
  if (!user) return null;

  // Firebase user exists but profile check failed
  if (profileError) return <AccessDeniedScreen code={profileError} onSignOut={signOut} />;

  // Firebase user exists but appUser not yet set (shouldn't happen — safety guard)
  if (!appUser) return <PageLoader />;

  return <>{children}</>;
}
