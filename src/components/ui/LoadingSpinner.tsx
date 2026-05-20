import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'جاري التحميل...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        </div>
        <p className="text-slate-500 font-medium">RoboFab Operations System</p>
      </div>
    </div>
  );
}
