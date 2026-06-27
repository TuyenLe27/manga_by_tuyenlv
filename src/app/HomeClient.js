'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Flame, BookOpen, Clock, Heart, MessageSquare, Star } from 'lucide-react';

export default function HomeClient({ initialComics = [] }) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams ? searchParams.get('search') || '' : '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(''); // '' (All), 'ONGOING', 'COMPLETED'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Set itemsPerPage dynamically on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(5);
      } else {
        setItemsPerPage(10);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = searchParams ? searchParams.get('search') || '' : '';
    setSearchQuery(q);
  }, [searchParams]);

  // Reset page when filters or queries change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const filteredComics = initialComics.filter((comic) => {
    const matchesSearch = comic.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || comic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const featuredComic = filteredComics[0] || initialComics[0] || null;

  // Pagination calculations
  const totalPages = Math.ceil(filteredComics.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComics = filteredComics.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-10 pb-16 animate-fadeIn">
      {/* Hero / Featured Banner */}
      {featuredComic ? (
        <section className="relative overflow-hidden border-b border-slate-900 bg-slate-950 px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
          <div className="absolute inset-0 z-0">
            <img
              src={featuredComic.thumbnail}
              alt=""
              className="h-full w-full object-cover object-center blur-3xl opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
          </div>

          <div className="relative z-10 mx-auto w-full md:max-w-[70%] flex flex-row gap-4 sm:gap-8 items-start sm:items-center px-4 md:px-0">
            {/* Left Image on Banner */}
            <div className="w-24 sm:w-40 md:w-60 flex-shrink-0">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-violet-500/5 hover:scale-102 transition-transform duration-300">
                <img
                  src={featuredComic.thumbnail}
                  alt={featuredComic.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Right Information on Banner */}
            <div className="flex-1 min-w-0 space-y-2 sm:space-y-4">
              <div className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-bold text-violet-400">
                <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-violet-400/25" />
                <span>NỔI BẬT HÔM NAY</span>
              </div>
              
              <h1 className="text-sm sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-50 leading-snug sm:leading-tight line-clamp-2">
                {featuredComic.title}
              </h1>
              
              <p className="text-[10px] sm:text-sm md:text-base text-slate-350 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {featuredComic.description}
              </p>
              
              {/* Featured Comic Statistics */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] sm:text-xs text-slate-400">
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  ★ {featuredComic.averageRating > 0 ? featuredComic.averageRating.toFixed(1) : '0.0'}
                </span>
                <span className="flex items-center gap-0.5 text-red-500 font-semibold">
                  ♥ {featuredComic.favoritesCount || 0}
                </span>
                <span className="flex items-center gap-0.5 text-sky-400 font-semibold">
                  💬 {featuredComic.commentsCount || 0}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2">
                <Link
                  href={`/comics/${featuredComic.id}`}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1.5 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:brightness-110 active:scale-95 transition-all"
                >
                  Đọc Ngay
                </Link>
                {featuredComic.chapters?.[0] && (
                  <Link
                    href={`/comics/${featuredComic.id}/chapters/${featuredComic.chapters[0].id}`}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-305 hover:bg-slate-800 hover:text-slate-50 transition-colors line-clamp-1 max-w-[120px] sm:max-w-none text-center"
                  >
                    Ch. {featuredComic.chapters[0].chapterNumber}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="border-b border-slate-900 bg-gradient-to-b from-slate-900/20 to-slate-950 px-4 py-16 text-center">
          <div className="mx-auto max-w-xl space-y-4">
            <h1 className="text-3xl font-extrabold text-slate-50 sm:text-4xl">Chào mừng đến Truyện Tranh Online</h1>
            <p className="text-sm text-slate-400">Khám phá thế giới truyện tranh online hấp dẫn và hoàn toàn miễn phí.</p>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-905/10 border border-slate-900 p-4 rounded-xl backdrop-blur-sm">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm truyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex gap-2">
            {[
              { label: 'Tất cả', value: '' },
              { label: 'Đang tiến hành', value: 'ONGOING' },
              { label: 'Hoàn thành', value: 'COMPLETED' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold border transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/10'
                    : 'bg-slate-950 text-slate-450 border-slate-800 hover:text-slate-50 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comics Grid */}
        <div>
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-6">
            <BookOpen className="h-5 w-5 text-violet-500" />
            <h2 className="text-sm sm:text-xl font-bold text-slate-50 tracking-tight">Danh Sách Truyện</h2>
          </div>

          {filteredComics.length === 0 ? (
            <div className="text-center p-16 text-slate-550 border border-dashed border-slate-900 rounded-xl bg-slate-950/20">
              <p className="text-sm">Không tìm thấy bộ truyện nào phù hợp.</p>
            </div>
          ) : (
            /* Responsive layout: flex-col (vertical list) on mobile, grid with exactly 5 columns on desktop */
            <div className="flex flex-col gap-4 sm:grid sm:gap-6 sm:grid-cols-2 md:grid-cols-5">
              {currentComics.map((comic) => (
                <Link
                  key={comic.id}
                  href={`/comics/${comic.id}`}
                  className="group flex flex-row sm:flex-col gap-3 sm:space-y-0 focus:outline-none focus:ring-0"
                >
                  {/* Card Thumbnail */}
                  <div className="relative aspect-[3/4] w-20 sm:w-full flex-shrink-0 overflow-hidden rounded-xl border border-slate-900 bg-slate-950 shadow-md transition-all duration-300 group-hover:-translate-y-1 sm:group-hover:-translate-y-1.5 group-hover:border-slate-800 group-hover:shadow-lg group-hover:shadow-violet-500/5">
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

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Card Info */}
                  <div className="flex-1 sm:flex-initial flex flex-col justify-center sm:justify-start space-y-1 px-1">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-2 sm:line-clamp-1 leading-snug">
                      {comic.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
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

                    {/* Comic Statistics Footer */}
                    <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-450 pt-1 border-t border-slate-900/60 mt-1">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold" title="Đánh giá trung bình">
                        ★ {comic.averageRating > 0 ? comic.averageRating.toFixed(1) : '0.0'}
                      </span>
                      <span className="flex items-center gap-0.5 text-red-500" title="Lượt yêu thích">
                        ♥ {comic.favoritesCount || 0}
                      </span>
                      <span className="flex items-center gap-0.5 text-sky-400/90" title="Bình luận">
                        💬 {comic.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-10">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Trước
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
