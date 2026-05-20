import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export default function Card({ children, className = '', glow }: CardProps) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl ${glow ? 'shadow-lg shadow-blue-500/5' : 'shadow-sm'} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-slate-800 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function StatsCard({ title, value, icon, color = 'blue', subtitle }: {
  title: string; value: string | number; icon: ReactNode; color?: string; subtitle?: string;
}) {
  const colors: Record<string, string> = {
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    red:    'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[color] || colors.blue}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}
