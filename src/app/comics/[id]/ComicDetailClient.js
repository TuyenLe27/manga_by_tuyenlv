'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Play, ArrowUpRight, RefreshCw, CheckCircle, Heart, Loader2, Star } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';

export default function ComicDetailClient({ initialComic }) {
  const [comic, setComic] = useState(() => getCache(`comic_${initialComic?.id}`) || initialComic);
  const [error, setError] = useState('');
  const [lastReadChapter, setLastReadChapter] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  
  const [userRating, setUserRating] = useState(() => {
    const extra = getCache(`comic_extra_${initialComic?.id}`);
    return extra ? extra.userRating : (initialComic?.userRating || null);
  });
  const [hoverRating, setHoverRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!initialComic) return;
    
    // Sort chapters ascending
    if (initialComic.chapters) {
      initialComic.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    }
    
    // Luôn lưu cache bản xem trước truyện
    setCache(`comic_${initialComic.id}`, initialComic);
    if (!getCache(`comic_${initialComic.id}`)) {
      setComic(initialComic);
    }

    const fetchFavoriteAndUserRating = async () => {
      try {
        const id = initialComic.id;
        const cacheKey = `comic_extra_${id}`;
        
        // 1. Đọc nhanh từ Cache phụ (Yêu thích/Đánh giá) nếu có
        const cachedExtra = getCache(cacheKey);
        if (cachedExtra) {
          setUserRating(cachedExtra.userRating);
          setIsFavorited(cachedExtra.isFavorited);
          setComic(prev => ({
            ...prev,
            ...cachedExtra.comicData
          }));
        }

        // 2. Chạy tải ngầm cập nhật trạng thái mới nhất từ server (SWR)
        const res = await fetch(`/api/comics/${id}?t=${Date.now()}`);
        let freshComicData = {};
        let freshUserRating = null;
        let freshIsFavorited = false;

        if (res.ok) {
          const data = await res.json();
          freshUserRating = data.userRating;
          setUserRating(freshUserRating);
          freshComicData = {
            averageRating: data.averageRating,
            ratingsCount: data.ratingsCount,
            favoritesCount: data.favoritesCount,
            commentsCount: data.commentsCount
          };
          setComic(prev => ({
            ...prev,
            ...freshComicData
          }));
        }

        const favRes = await fetch(`/api/favorites/${id}?t=${Date.now()}`);
        if (favRes.ok) {
          const favData = await favRes.json();
          freshIsFavorited = favData.isFavorited;
          setIsFavorited(freshIsFavorited);
        }

        // Cập nhật lại cache phụ
        setCache(cacheKey, {
          userRating: freshUserRating,
          isFavorited: freshIsFavorited,
          comicData: freshComicData
        });
      } catch (err) {
        console.error('Error fetching asynchronous details:', err);
      }
    };

    fetchFavoriteAndUserRating();

    // Check reading history from localStorage
    const readHistory = localStorage.getItem(`read-history-${initialComic.id}`);
    if (readHistory) {
      try {
        const parsed = JSON.parse(readHistory);
        setLastReadChapter(parsed);
      } catch (e) {
        console.error('Error parsing read history', e);
      }
    }
  }, [initialComic]);

  const handleToggleFavorite = async () => {
    if (!comic) return;
    setFavLoading(true);
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(`/api/favorites/${comic.id}`, { method });
      
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi xử lý yêu thích.');
      }
      
      setIsFavorited(!isFavorited);
      
      setComic(prev => ({
        ...prev,
        favoritesCount: prev.favoritesCount + (isFavorited ? -1 : 1)
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setFavLoading(false);
    }
  };

  const handleRate = async (score) => {
    if (!comic) return;
    setRatingLoading(true);
    try {
      const res = await fetch(`/api/comics/${comic.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi xử lý đánh giá.');
      }

      const resData = await res.json();
      setUserRating(score);
      setComic({
        ...comic,
        averageRating: resData.averageRating,
        ratingsCount: resData.ratingsCount
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setRatingLoading(false);
    }
  };

  if (error || !comic) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 border border-red-500/20 bg-red-500/5 rounded-xl">
        <p className="text-red-400 font-semibold">{error || 'Truyện không tồn tại'}</p>
        <Link
          href="/"
          className="mt-6 inline-block text-xs bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Quay lại Trang chủ
        </Link>
      </div>
    );
  }

  const sortedChaptersChrono = [...(comic.chapters || [])].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const firstChapter = sortedChaptersChrono[0] || null;
  const latestChapter = sortedChaptersChrono[sortedChaptersChrono.length - 1] || null;

  return (
    <div className="pb-16 animate-fadeIn">
      {/* Dynamic Header Banner */}
      <div className="relative h-60 md:h-80 w-full overflow-hidden border-b border-slate-900 bg-slate-950">
        <img
          src={comic.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-25 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
        
        {/* Back Link */}
        <div className="absolute top-4 left-4 z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950/60 hover:bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-slate-50 backdrop-blur-sm border border-slate-800/80 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Trở về</span>
          </Link>
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="relative -mt-36 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Thumbnail */}
          <div className="w-48 sm:w-56 aspect-[3/4] overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-900 shadow-2xl flex-shrink-0 self-center md:self-start">
            <img
              src={comic.thumbnail}
              alt={comic.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  comic.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {comic.status === 'COMPLETED' ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Hoàn thành
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Đang tiến hành
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-500 font-medium bg-slate-900/60 px-2.5 py-0.5 rounded-full border border-slate-800">
                  {comic.chapters?.length || 0} chương
                </span>
              </div>

              <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight sm:text-4xl md:text-5xl leading-tight">
                {comic.title}
              </h1>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-sm text-slate-400 bg-slate-900/10 border border-slate-900/50 rounded-xl px-5 py-3 backdrop-blur-sm max-w-3xl">
              {/* Star Ratings */}
              <div className="flex items-center gap-1.5 border-r border-slate-800/80 pr-4 sm:pr-6">
                <span className="text-amber-500 font-extrabold flex items-center gap-0.5 text-base">
                  ★ {comic.averageRating > 0 ? comic.averageRating.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-slate-500">
                  ({comic.ratingsCount || 0} lượt)
                </span>
              </div>

              {/* Favorites count */}
              <div className="flex items-center gap-1.5 border-r border-slate-800/80 pr-4 sm:pr-6">
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                <span className="font-semibold text-slate-300">{comic.favoritesCount || 0}</span>
                <span className="text-xs text-slate-500">yêu thích</span>
              </div>

              {/* Comments count */}
              <div className="flex items-center gap-1.5">
                <span className="text-sky-400">💬</span>
                <span className="font-semibold text-slate-300">{comic.commentsCount || 0}</span>
                <span className="text-xs text-slate-500">bình luận</span>
              </div>
            </div>

            {/* Interactive Rating Panel */}
            <div className="flex items-center justify-center md:justify-start gap-2.5 py-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đánh giá của bạn:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isHighlighted = hoverRating !== null ? starValue <= hoverRating : starValue <= (userRating || 0);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      disabled={ratingLoading}
                      onClick={() => handleRate(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      className={`p-0.5 rounded transition-all transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                        isHighlighted 
                          ? 'text-amber-500 scale-105 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.3)]' 
                          : 'text-slate-700 hover:text-slate-500'
                      }`}
                    >
                      <Star className={`h-4.5 w-4.5 ${isHighlighted ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
              {userRating && (
                <span className="text-xs text-slate-500 italic">
                  (Bạn đã đánh giá {userRating} sao)
                </span>
              )}
            </div>

            {/* Description */}
            <div className="bg-slate-900/15 border border-slate-900/50 rounded-xl p-4 sm:p-5 text-slate-350 text-sm leading-relaxed max-w-3xl text-left">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Tóm tắt nội dung</h3>
              <p className="whitespace-pre-line">{comic.description}</p>
            </div>

            {/* Reading Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {lastReadChapter ? (
                <Link
                  href={`/comics/${comic.id}/chapters/${lastReadChapter.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Đọc tiếp: Chapter {lastReadChapter.chapterNumber}</span>
                </Link>
              ) : firstChapter ? (
                <Link
                  href={`/comics/${comic.id}/chapters/${firstChapter.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Đọc từ đầu</span>
                </Link>
              ) : null}

              {firstChapter && !lastReadChapter && (
                <Link
                  href={`/comics/${comic.id}/chapters/${latestChapter.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-850 hover:text-slate-50 transition-colors"
                >
                  <span>Chương mới nhất</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}

              {firstChapter && lastReadChapter && (
                <Link
                  href={`/comics/${comic.id}/chapters/${firstChapter.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-350 hover:bg-slate-850 hover:text-slate-50 transition-colors"
                >
                  <span>Đọc lại từ đầu</span>
                </Link>
              )}

              {/* Heart Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
                  isFavorited
                    ? 'bg-red-950/20 text-red-500 border-red-900/50 hover:bg-red-950/30'
                    : 'bg-slate-900/40 text-slate-350 border-slate-800 hover:bg-slate-850 hover:text-slate-50'
                }`}
              >
                {favLoading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Heart className={`h-4.5 w-4.5 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                )}
                <span>{isFavorited ? 'Đã Yêu Thích' : 'Yêu Thích'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="mt-16 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <BookOpen className="h-5 w-5 text-violet-500" />
            <h2 className="text-xl font-bold text-slate-50 tracking-tight">Danh Sách Chương ({comic.chapters?.length || 0})</h2>
          </div>

          {(!comic.chapters || comic.chapters.length === 0) ? (
            <div className="text-center p-12 text-slate-500 border border-slate-900/60 rounded-xl bg-slate-950/20">
              <p className="text-sm">Truyện hiện tại chưa có chương nào được đăng.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {comic.chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/comics/${comic.id}/chapters/${chapter.id}`}
                  className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all duration-150 ${
                    lastReadChapter?.id === chapter.id
                      ? 'border-violet-800 bg-violet-950/10 hover:bg-violet-950/20 shadow-md shadow-violet-950/5'
                      : 'border-slate-900 bg-slate-900/5 hover:border-slate-850 hover:bg-slate-900/15'
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`font-bold block truncate transition-colors ${
                      lastReadChapter?.id === chapter.id ? 'text-violet-400' : 'text-slate-300 group-hover:text-violet-400'
                    }`}>
                      Chapter {chapter.chapterNumber}
                    </span>
                    {chapter.title && (
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">{chapter.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-slate-500 ml-2">
                    <span className="flex items-center gap-0.5 text-[10px]">
                      <Clock className="h-3 w-3" />
                      {new Date(chapter.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
