import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export default function Card({ children, className = '', glow }: CardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl ${glow ? 'shadow-md' : 'shadow-sm'} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function StatsCard({ title, value, icon, color = 'blue', subtitle }: {
  title: string; value: string | number; icon: ReactNode; color?: string; subtitle?: string;
}) {
  const colors: Record<string, string> = {
    cyan: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[color] || colors.blue}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}
