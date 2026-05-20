import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'جاري التحميل...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-cyan-500/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.4s' }} />
      </div>
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 px-4 py-3 items-center">
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 w-20 rounded" />
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#060E1A] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <div className="text-center">
          <p className="text-slate-200 font-semibold text-sm">RoboFab Operations</p>
          <p className="text-slate-500 text-xs mt-1">Loading system...</p>
        </div>
      </div>
    </div>
  );
}
