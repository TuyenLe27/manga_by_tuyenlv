'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, BookOpen, Clock, ArrowLeft } from 'lucide-react';

export default function FavoritesPage() {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/favorites?t=' + Date.now());
        
        if (res.status === 401) {
          // User is not logged in
          setError('UNAUTHORIZED');
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error('Không thể kết nối đến máy chủ');
        const data = await res.json();
        setComics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
        <p className="text-sm text-slate-400">Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  if (error === 'UNAUTHORIZED') {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 border border-slate-800 bg-slate-900/35 backdrop-blur-md rounded-2xl shadow-xl">
        <Heart className="mx-auto h-12 w-12 text-slate-650 mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Đăng Nhập Để Lưu Truyện Yêu Thích</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Bạn cần đăng nhập để lưu trữ tủ truyện yêu thích của riêng mình và đồng bộ trên các thiết bị.
        </p>
        <div className="flex flex-col gap-2.5">
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            Đăng Nhập
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-slate-800 bg-slate-950 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
          >
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn space-y-8">
      {/* Title & Back button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <Heart className="h-7 w-7 text-red-500 fill-current" />
              Tủ Truyện Yêu Thích
            </h1>
            <p className="text-xs text-slate-400 mt-1">Danh sách các bộ truyện bạn đã đánh dấu yêu thích.</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-semibold bg-slate-900/40 border border-slate-850 px-3.5 py-1.5 rounded-full">
          Có {comics.length} bộ truyện
        </div>
      </div>

      {error ? (
        <div className="text-center p-12 border border-red-500/20 bg-red-500/5 rounded-xl text-slate-400 text-sm">
          Không thể tải danh sách yêu thích. Vui lòng thử lại sau.
        </div>
      ) : comics.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-850 rounded-2xl bg-slate-950/20 max-w-xl mx-auto space-y-4">
          <Heart className="mx-auto h-16 w-16 text-slate-800" />
          <p className="text-sm font-medium text-slate-450">Tủ truyện yêu thích của bạn đang trống.</p>
          <p className="text-xs text-slate-550 max-w-xs mx-auto leading-relaxed">
            Hãy khám phá các bộ truyện trên trang chủ và nhấn biểu tượng trái tim để thêm vào tủ truyện.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600/10 border border-violet-500/20 px-5 py-2.5 text-xs font-bold text-violet-400 hover:bg-violet-600/20 transition-all mt-2"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Khám Phá Ngay
          </Link>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {comics.map((comic) => (
            <Link
              key={comic.id}
              href={`/comics/${comic.id}`}
              className="group block space-y-3 focus:outline-none focus:ring-0"
            >
              {/* Card Thumbnail */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-slate-900 bg-slate-950 shadow-md transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-slate-800 group-hover:shadow-lg group-hover:shadow-violet-500/5">
                <img
                  src={comic.thumbnail}
                  alt={comic.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Status Badge overlays */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase shadow-md ${
                    comic.status === 'COMPLETED'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-500/90 text-slate-950'
                  }`}>
                    {comic.status === 'COMPLETED' ? 'END' : 'UP'}
                  </span>
                </div>

                {/* Heart overlay */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-650 text-white shadow-md">
                    <Heart className="h-3 w-3 fill-current" />
                  </span>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Card Info */}
              <div className="space-y-1 px-1">
                <h3 className="font-bold text-sm text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-1 leading-snug">
                  {comic.title}
                </h3>
                
                <div className="flex items-center justify-between text-[11px] text-slate-505">
                  {comic.chapters?.[0] ? (
                    <span className="font-semibold text-violet-400 hover:underline">
                      Ch. {comic.chapters[0].chapterNumber}
                    </span>
                  ) : (
                    <span>Chưa có chương</span>
                  )}
                  
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(comic.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
