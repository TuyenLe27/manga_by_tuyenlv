import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-slate-950">
      <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      <p className="text-sm text-slate-400 font-medium">Đang tải thông tin truyện...</p>
    </div>
  );
}
