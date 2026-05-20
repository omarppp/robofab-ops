'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User, ChevronDown, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const { appUser, signOut } = useAuth();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-slate-900 font-semibold text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <button
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 transition-all group"
        >
          <Globe className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
          <span className="text-slate-600 text-xs font-medium group-hover:text-slate-900">
            {language === 'ar' ? 'EN' : 'ع'}
          </span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className={`hidden sm:block ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="text-slate-800 text-xs font-medium leading-tight">{appUser?.displayName || '—'}</div>
              <div className="text-slate-400 text-xs leading-tight capitalize">{appUser?.role || 'staff'}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden`}>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
