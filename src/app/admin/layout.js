export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-violet-900/30 bg-violet-950/10 px-4 py-2 text-center text-xs font-medium text-violet-400 tracking-wider">
        🛡️ KHU VỰC QUẢN TRỊ VIÊN (ADMIN DASHBOARD)
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
