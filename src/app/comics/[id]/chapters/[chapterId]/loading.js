import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      <p className="text-sm text-slate-400 font-medium">Đang tải trang đọc truyện...</p>
    </div>
  );
}
