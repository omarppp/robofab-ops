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
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
        {icon || <PackageOpen className="w-8 h-8 text-slate-400" />}
      </div>
      <div className="text-center">
        <h3 className="text-slate-700 font-medium mb-1">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
