import { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي عناصر.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        {icon || <PackageOpen className="w-8 h-8 text-slate-500" />}
      </div>
      <div className="text-center">
        <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
        <p className="text-slate-500 text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
