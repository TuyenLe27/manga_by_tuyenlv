export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Truyện Tranh Online. Đọc truyện tranh online chất lượng cao.</p>
        <p className="mt-1 text-[10px] text-slate-600">Ứng dụng được thiết kế tối ưu trên Mobile và Web.</p>
      </div>
    </footer>
  );
}
