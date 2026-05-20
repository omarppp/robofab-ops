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
    <header className="h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-slate-200 font-semibold text-sm leading-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-all group"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
          <span className="text-slate-400 text-xs font-medium group-hover:text-slate-200">
            {language === 'ar' ? 'EN' : 'ع'}
          </span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-all"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className={`hidden sm:block ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="text-slate-200 text-xs font-medium leading-tight">{appUser?.displayName || '—'}</div>
              <div className="text-slate-500 text-[10px] leading-tight capitalize">{appUser?.role || 'staff'}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-20 overflow-hidden animate-scale-in`}>
                <div className="px-4 py-3 border-b border-slate-800">
                  <div className="text-slate-200 text-sm font-medium">{appUser?.displayName}</div>
                  <div className="text-slate-500 text-xs truncate">{appUser?.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
