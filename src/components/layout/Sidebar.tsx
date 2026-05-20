'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Printer, Pen, CircuitBoard, Truck, Users, Cpu, BarChart3, Settings, X, ChevronLeft, ChevronRight, Zap, CalendarDays, Clock
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const NAV_ITEMS = [
  { href: '/dashboard', key: 'nav.dashboard' as const, icon: LayoutDashboard },
  { href: '/printing', key: 'nav.printing' as const, icon: Printer },
  { href: '/design', key: 'nav.design' as const, icon: Pen },
  { href: '/pcb', key: 'nav.pcb' as const, icon: CircuitBoard },
  { href: '/outsourced', key: 'nav.outsourced' as const, icon: Truck },
  { href: '/clients', key: 'nav.clients' as const, icon: Users },
  { href: '/machines', key: 'nav.machines' as const, icon: Cpu },
  { href: '/machines/schedule', key: 'nav.schedule' as const, icon: Clock },
  { href: '/calendar', key: 'nav.calendar' as const, icon: CalendarDays },
  { href: '/reports', key: 'nav.reports' as const, icon: BarChart3 },
  { href: '/settings', key: 'nav.settings' as const, icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useTranslation();

  const ActiveArrow = isRTL ? ChevronLeft : ChevronRight;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 h-full w-64 bg-white z-50
        flex flex-col transition-transform duration-300
        ${isRTL
          ? `right-0 border-l border-slate-200 ${open ? 'translate-x-0' : 'translate-x-full'}`
          : `left-0 border-r border-slate-200 ${open ? 'translate-x-0' : '-translate-x-full'}`
        }
        lg:translate-x-0 lg:static lg:z-auto shadow-sm
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-slate-900 font-bold text-sm leading-tight">RoboFab</div>
              <div className="text-blue-600 text-xs leading-tight">Operations System</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  style={{ width: '1.125rem', height: '1.125rem' }}
                />
                <span className="flex-1">{t(key)}</span>
                {active && <ActiveArrow className="w-4 h-4 text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center">RoboFab © {new Date().getFullYear()}</div>
        </div>
      </aside>
    </>
  );
}
