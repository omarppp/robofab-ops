'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Lightbulb, CircleDot, Package, ListOrdered, Layers, Users, Cpu,
  BarChart3, Settings, X, CalendarDays, Clock, Zap,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const NAV_ITEMS = [
  { href: '/dashboard',           key: 'nav.dashboard' as const,     icon: LayoutDashboard, group: 'main' },
  { href: '/orders/chandelier',   key: 'nav.chandelier' as const,    icon: Lightbulb,        group: 'orders' },
  { href: '/orders/holder',       key: 'nav.holder' as const,        icon: CircleDot,        group: 'orders' },
  { href: '/orders/general',      key: 'nav.general' as const,       icon: Package,          group: 'orders' },
  { href: '/orders',              key: 'nav.allOrders' as const,     icon: ListOrdered,      group: 'orders' },
  { href: '/filament-stock',      key: 'nav.filamentStock' as const, icon: Layers,           group: 'manage' },
  { href: '/machines',            key: 'nav.machines' as const,      icon: Cpu,              group: 'manage' },
  { href: '/machines/schedule',   key: 'nav.schedule' as const,      icon: Clock,            group: 'manage' },
  { href: '/calendar',            key: 'nav.calendar' as const,      icon: CalendarDays,     group: 'manage' },
  { href: '/clients',             key: 'nav.clients' as const,       icon: Users,            group: 'manage' },
  { href: '/reports',             key: 'nav.reports' as const,       icon: BarChart3,        group: 'system' },
  { href: '/settings',            key: 'nav.settings' as const,      icon: Settings,         group: 'system' },
];

const GROUP_LABELS: Record<string, { ar: string; en: string }> = {
  orders: { ar: 'الطلبات', en: 'Orders' },
  manage: { ar: 'الإدارة', en: 'Management' },
  system: { ar: 'النظام', en: 'System' },
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL, language } = useTranslation();

  const lang = language as 'ar' | 'en';

  let lastGroup = '';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 h-full w-60 bg-[#060E1A] z-50
        flex flex-col transition-transform duration-300 ease-out
        border-slate-800
        ${isRTL
          ? `right-0 border-l ${open ? 'translate-x-0' : 'translate-x-full'}`
          : `left-0 border-r ${open ? 'translate-x-0' : '-translate-x-full'}`
        }
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#060E1A] animate-pulse-soft" />
            </div>
            <div>
              <div className="text-slate-100 font-bold text-sm leading-tight tracking-wide">RoboFab</div>
              <div className="text-cyan-500 text-[10px] leading-tight font-medium tracking-wider uppercase">Operations</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-600 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map(({ href, key, icon: Icon, group }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
            const showGroupLabel = group !== 'main' && group !== lastGroup;
            if (showGroupLabel) lastGroup = group;

            return (
              <div key={href}>
                {showGroupLabel && (
                  <div className="px-3 pt-4 pb-1.5">
                    <span className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest">
                      {GROUP_LABELS[group][lang]}
                    </span>
                  </div>
                )}
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    active
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`flex-shrink-0 transition-colors ${active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  <span className="flex-1 leading-none">{t(key)}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="px-4 py-4 border-t border-slate-800/80">
          <div className="text-[10px] text-slate-700 text-center tracking-wider uppercase">
            RoboFab © {new Date().getFullYear()}
          </div>
        </div>
      </aside>
    </>
  );
}
