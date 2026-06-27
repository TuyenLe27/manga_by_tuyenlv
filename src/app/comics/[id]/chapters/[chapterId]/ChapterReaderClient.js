'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, RefreshCw, Settings, MessageSquare, Send, Trash2, User, AlertCircle } from 'lucide-react';

import { getCache, setCache } from '@/lib/clientCache';

export default function ChapterReaderClient({ initialComic, initialChapter }) {
  const [comic, setComic] = useState(() => getCache(`comic_${initialComic?.id}`) || initialComic);
  const [chapter, setChapter] = useState(() => getCache(`chapter_${initialChapter?.id}`) || initialChapter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState({});

  const [readerWidth, setReaderWidth] = useState('max-w-4xl'); // 'max-w-2xl', 'max-w-4xl', 'max-w-6xl', 'max-w-none'
  const [imageScale, setImageScale] = useState('original'); // 'original', 'fit'
  const [renderingQuality, setRenderingQuality] = useState('crisp'); // 'auto', 'crisp'
  const [readingMode, setReadingMode] = useState('scroll'); // 'scroll', 'swipe'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  // Auth & Comments state
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSubmitLoading, setCommentSubmitLoading] = useState(false);

  const router = useRouter();
  const comicId = initialComic?.id;
  const chapterId = initialChapter?.id;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('reader-width');
      const savedScale = localStorage.getItem('reader-scale');
      const savedQuality = localStorage.getItem('reader-quality');
      const savedMode = localStorage.getItem('reader-mode');
      if (savedWidth) setReaderWidth(savedWidth);
      if (savedScale) setImageScale(savedScale);
      if (savedQuality) setRenderingQuality(savedQuality);
      if (savedMode) setReadingMode(savedMode);
    }
  }, []);

  const handleWidthChange = (width) => {
    setReaderWidth(width);
    localStorage.setItem('reader-width', width);
  };

  const handleScaleChange = (scale) => {
    setImageScale(scale);
    localStorage.setItem('reader-scale', scale);
  };

  const handleQualityChange = (quality) => {
    setRenderingQuality(quality);
    localStorage.setItem('reader-quality', quality);
  };

  const handleModeChange = (mode) => {
    setReadingMode(mode);
    localStorage.setItem('reader-mode', mode);
    setCurrentImageIndex(0);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        if (chapter?.images && currentImageIndex < chapter.images.length - 1) {
          setCurrentImageIndex((prev) => prev + 1);
        }
      } else {
        if (currentImageIndex > 0) {
          setCurrentImageIndex((prev) => prev - 1);
        }
      }
    }
    setTouchStartX(0);
    setTouchStartY(0);
  };

  useEffect(() => {
    if (!initialComic || !initialChapter) return;
    
    // Lưu cache thông tin truyện và chương hiện tại
    setCache(`comic_${comicId}`, initialComic);
    setCache(`chapter_${chapterId}`, initialChapter);

    if (!getCache(`chapter_${chapterId}`)) {
      setComic(initialComic);
      setChapter(initialChapter);
    }
    setLoading(false);

    // Save to LocalStorage for read history
    localStorage.setItem(
      `read-history-${comicId}`,
      JSON.stringify({
        id: initialChapter.id,
        chapterNumber: initialChapter.chapterNumber,
        title: initialChapter.title,
      })
    );
  }, [initialComic, initialChapter, comicId, chapterId]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [chapterId]);

  useEffect(() => {
    if (readingMode !== 'swipe' || !chapter?.images?.length) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Right') {
        if (currentImageIndex < chapter.images.length - 1) {
          setCurrentImageIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        if (currentImageIndex > 0) {
          setCurrentImageIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, currentImageIndex, chapter]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch current user session
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching auth session:', err);
      }
    };
    fetchMe();
  }, []);

  // Fetch comments for chapter
  useEffect(() => {
    if (!chapterId) return;
    const fetchComments = async () => {
      const cacheKey = `comments_${chapterId}`;
      const cached = getCache(cacheKey);
      if (cached) {
        setComments(cached);
        setCommentsLoading(false);
      }
      try {
        const res = await fetch(`/api/chapters/${chapterId}/comments?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
          setCache(cacheKey, data);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [chapterId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    if (commentContent.trim().length > 1000) {
      setCommentError('Nội dung bình luận tối đa 1000 ký tự.');
      return;
    }
    setCommentSubmitLoading(true);
    setCommentError('');
    try {
      const res = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi gửi bình luận.');
      }
      setComments(prev => {
        const updated = [data, ...prev];
        setCache(`comments_${chapterId}`, updated);
        return updated;
      });
      setCommentContent('');
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentSubmitLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi xóa bình luận.');
      }
      setComments(prev => {
        const updated = prev.filter(c => c.id !== commentId);
        setCache(`comments_${chapterId}`, updated);
        return updated;
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImageLoad = (index) => {
    setImagesLoaded((prev) => ({ ...prev, [index]: true }));
  };

  if (error || !chapter) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 border border-red-500/20 bg-red-500/5 rounded-xl">
        <p className="text-red-400 font-semibold">{error || 'Chương không tồn tại'}</p>
        <Link
          href={`/comics/${comicId}`}
          className="mt-6 inline-block text-xs bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Quay lại trang chi tiết
        </Link>
      </div>
    );
  }

  const currentChapterIndex = comic?.chapters?.findIndex((ch) => ch.id === chapterId) ?? -1;
  const prevChapter = currentChapterIndex > 0 ? comic.chapters[currentChapterIndex - 1] : null;
  const nextChapter = comic?.chapters && currentChapterIndex < comic.chapters.length - 1 
    ? comic.chapters[currentChapterIndex + 1] 
    : null;

  const handleDropdownChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      router.push(`/comics/${comicId}/chapters/${selectedId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center select-none">
      {/* Scroll Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-slate-900 z-50">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-75"
          style={{ 
            width: `${
              readingMode === 'swipe' && chapter?.images?.length
                ? ((currentImageIndex + 1) / chapter.images.length) * 100
                : scrollProgress
            }%` 
          }}
        />
      </div>

      {/* Reader Control Header */}
      <div className="sticky top-16 z-30 w-full border-b border-slate-700/80 bg-slate-950/90 backdrop-blur-md py-3 px-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          <Link
            href={`/comics/${comicId}`}
            className="flex items-center gap-1 text-slate-450 hover:text-slate-50 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Chi tiết truyện</span>
          </Link>

          {/* Title & Info */}
          <div className="text-center min-w-0">
            <h2 className="text-sm font-bold text-slate-50 truncate max-w-[150px] sm:max-w-xs">{comic?.title}</h2>
            <p className="text-[10px] text-slate-450 mt-0.5">Chapter {chapter.chapterNumber}</p>
          </div>

          {/* Chapter Selector & settings */}
          <div className="flex items-center gap-2">
            {comic?.chapters && (
              <select
                value={chapterId}
                onChange={handleDropdownChange}
                className="rounded bg-slate-900 border border-slate-700/80 text-xs font-semibold px-2 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer max-w-[140px] sm:max-w-xs"
              >
                {comic.chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch. {ch.chapterNumber} {ch.title ? `- ${ch.title}` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Interface settings dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="rounded bg-slate-900 border border-slate-700/80 p-1.5 text-slate-355 hover:text-slate-50 hover:bg-slate-800 focus:outline-none transition-colors cursor-pointer"
                title="Cài đặt hiển thị"
              >
                <Settings className="h-4 w-4" />
              </button>
              
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cài đặt trình đọc</h4>
                  
                  <div className="space-y-4">
                    {/* Reading Mode */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Chế độ đọc</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: 'Cuộn dọc', value: 'scroll' },
                          { label: 'Vuốt trang', value: 'swipe' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => handleModeChange(item.value)}
                            className={`rounded py-1 text-[10px] font-bold border text-center transition-all cursor-pointer ${
                              readingMode === item.value
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-slate-900 text-slate-450 border-slate-700 hover:text-slate-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reader Width */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Chiều rộng khung đọc</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: 'Nhỏ', value: 'max-w-2xl' },
                          { label: 'Vừa', value: 'max-w-4xl' },
                          { label: 'Rộng', value: 'max-w-6xl' },
                          { label: 'Tràn', value: 'max-w-none' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => handleWidthChange(item.value)}
                            className={`rounded px-1 py-1 text-[10px] font-bold border text-center transition-all cursor-pointer ${
                              readerWidth === item.value
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Scale */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Chế độ co giãn ảnh</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: 'Kích thước gốc', value: 'original' },
                          { label: 'Khớp khung', value: 'fit' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => handleScaleChange(item.value)}
                            className={`rounded py-1 text-[10px] font-bold border text-center transition-all cursor-pointer ${
                              imageScale === item.value
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-slate-900 text-slate-450 border-slate-700 hover:text-slate-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rendering Quality */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Độ nét nét vẽ</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: 'Mượt mà', value: 'auto' },
                          { label: 'Sắc nét (Crisp)', value: 'crisp' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => handleQualityChange(item.value)}
                            className={`rounded py-1 text-[10px] font-bold border text-center transition-all cursor-pointer ${
                              renderingQuality === item.value
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-slate-900 text-slate-450 border-slate-700 hover:text-slate-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Pages vertical container */}
      <main className={`w-full ${readerWidth} bg-slate-950 flex flex-col py-2 transition-all duration-200`}>
        {(!chapter.images || chapter.images.length === 0) ? (
          <div className="text-center py-24 text-slate-500">
            Không tìm thấy ảnh của chapter này.
          </div>
        ) : readingMode === 'scroll' ? (
          chapter.images.map((img, idx) => (
            <div key={img.id} className="relative w-full overflow-hidden flex flex-col items-center bg-slate-950">
              {!imagesLoaded[idx] && (
                <div className="flex items-center justify-center bg-slate-900/10 py-24 min-h-[300px] w-full">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
                </div>
              )}
              <img
                src={img.url}
                alt={`Trang ${idx + 1}`}
                onLoad={() => handleImageLoad(idx)}
                style={
                  renderingQuality === 'crisp'
                    ? { imageRendering: 'pixelated' }
                    : {}
                }
                className={`mx-auto block select-none pointer-events-none transition-opacity duration-300 ${
                  imageScale === 'original' ? 'max-w-full' : 'w-full'
                } h-auto ${
                  imagesLoaded[idx] ? 'opacity-100' : 'opacity-0 h-0'
                }`}
              />
            </div>
          ))
        ) : (
          /* Swipe mode rendering */
          <div className="relative w-full flex flex-col items-center bg-slate-950">
            <div 
              className="relative w-full overflow-hidden flex flex-col items-center justify-center min-h-[50vh] touch-pan-y md:touch-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left/Prev click zone */}
              {currentImageIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                  className="absolute left-0 top-0 bottom-0 w-1/2 flex items-center justify-start pl-4 text-slate-400 hover:text-white bg-gradient-to-r from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity z-10 cursor-pointer"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}

              {/* Right/Next click zone */}
              {currentImageIndex < chapter.images.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                  className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end pr-4 text-slate-400 hover:text-white bg-gradient-to-l from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity z-10 cursor-pointer"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}

              {/* Loader during image loading */}
              {!imagesLoaded[currentImageIndex] && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 py-24 min-h-[300px] w-full">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
                </div>
              )}

              {/* Active Image */}
              {chapter.images[currentImageIndex] && (
                <img
                  src={chapter.images[currentImageIndex].url}
                  alt={`Trang ${currentImageIndex + 1}`}
                  onLoad={() => handleImageLoad(currentImageIndex)}
                  style={
                    renderingQuality === 'crisp'
                      ? { imageRendering: 'pixelated' }
                      : {}
                  }
                  className={`mx-auto block select-none pointer-events-none transition-opacity duration-300 ${
                    imageScale === 'original' ? 'max-w-full' : 'w-full'
                  } h-auto ${
                    imagesLoaded[currentImageIndex] ? 'opacity-100' : 'opacity-0 h-0'
                  }`}
                />
              )}
            </div>

            {/* Page navigation controls under the image */}
            <div className="w-full flex items-center justify-center gap-6 mt-6 py-3 border-t border-b border-slate-900 bg-slate-950">
              <button
                disabled={currentImageIndex === 0}
                onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                className="flex items-center justify-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Trang trước
              </button>
              
              <span className="text-sm font-bold text-slate-300 bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800/80">
                {currentImageIndex + 1} / {chapter.images.length}
              </span>

              <button
                disabled={currentImageIndex === chapter.images.length - 1}
                onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                className="flex items-center justify-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Trang sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav Controls */}
      <div className="w-full border-t border-slate-700 bg-slate-950 py-8 px-4 flex justify-center">
        <div className="w-full max-w-lg flex items-center justify-between gap-4">
          {prevChapter ? (
            <Link
              href={`/comics/${comicId}/chapters/${prevChapter.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/40 py-3 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-slate-50 transition-colors active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Chương trước</span>
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Đầu truyện</span>
            </button>
          )}

          {nextChapter ? (
            <Link
              href={`/comics/${comicId}/chapters/${nextChapter.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 text-xs font-bold text-white hover:brightness-110 active:scale-95 shadow-md shadow-violet-500/20 transition-all"
            >
              <span>Chương sau</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
            >
              <span>Hết chương</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="w-full max-w-3xl px-4 py-12 border-t border-slate-700/80 bg-slate-950 mt-2 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-700/80 pb-4">
          <MessageSquare className="h-5 w-5 text-violet-500" />
          <h3 className="text-lg font-bold text-slate-50">Bình luận ({comments.length})</h3>
        </div>

        {/* Comment input form */}
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            {commentError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-405 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{commentError}</span>
              </div>
            )}
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-semibold shrink-0 text-sm">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  rows="3"
                  required
                  placeholder="Hãy chia sẻ cảm nghĩ của bạn về chương truyện này..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all resize-none"
                  disabled={commentSubmitLoading}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    disabled={commentSubmitLoading || !commentContent.trim()}
                  >
                    {commentSubmitLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Gửi bình luận</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-900/20 p-5 text-center backdrop-blur-sm shadow-sm">
            <p className="text-sm text-slate-400">
              Bạn cần{' '}
              <Link href="/login" className="text-violet-400 font-semibold hover:underline">
                đăng nhập
              </Link>{' '}
              để viết bình luận và tương tác với mọi người.
            </p>
          </div>
        )}

        {/* Comments List */}
        {commentsLoading ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-700" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((cmt) => {
              const isOwner = currentUser && currentUser.id === cmt.userId;
              const isAdminUser = currentUser && currentUser.role === 'ADMIN';
              const canDelete = isOwner || isAdminUser;
              const isCommenterAdmin = cmt.user?.role === 'ADMIN';

              return (
                <div key={cmt.id} className="flex gap-3 group animate-fadeIn">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-750/60 flex items-center justify-center text-slate-400 font-semibold shrink-0 text-sm">
                    {cmt.user?.username ? cmt.user.username.substring(0, 2).toUpperCase() : '??'}
                  </div>

                  {/* Comment box */}
                  <div className="flex-1 bg-slate-900/30 border border-slate-700 rounded-xl px-4 py-3 space-y-1 relative shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{cmt.user?.username || 'Thành viên'}</span>
                        {isCommenterAdmin && (
                          <span className="rounded-md bg-fuchsia-500/10 border border-fuchsia-500/25 px-1 py-0.5 text-[9px] font-bold text-fuchsia-400 uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(cmt.createdAt).toLocaleString('vi-VN', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-350 leading-relaxed whitespace-pre-wrap">{cmt.content}</p>

                    {/* Delete action button */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(cmt.id)}
                        className="absolute right-2 bottom-2 md:opacity-0 md:group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900/50 rounded transition-all cursor-pointer"
                        title="Xóa bình luận"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
