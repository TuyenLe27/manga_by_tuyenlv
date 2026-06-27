'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, Edit, Trash2, BookOpen, Layers, 
  ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedComicId, setExpandedComicId] = useState(null);
  const [expandedComicDetails, setExpandedComicDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '', // 'comic' or 'chapter'
    id: null,
    title: '',
    extraInfo: ''
  });

  useEffect(() => {
    fetchComics();
  }, []);

  const fetchComics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/comics?t=' + Date.now());
      if (!res.ok) throw new Error('Không thể tải danh sách truyện');
      const data = await res.json();
      setComics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandComic = async (comicId) => {
    if (expandedComicId === comicId) {
      setExpandedComicId(null);
      setExpandedComicDetails(null);
      return;
    }
    setExpandedComicId(comicId);
    setExpandedComicDetails(null);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/comics/${comicId}?t=${Date.now()}`);
      if (!res.ok) throw new Error('Không thể tải chi tiết truyện');
      const data = await res.json();
      setExpandedComicDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const confirmDeleteComic = (comicId, title) => {
    setDeleteModal({
      isOpen: true,
      type: 'comic',
      id: comicId,
      title: 'Xóa Bộ Truyện',
      extraInfo: `Bạn có chắc chắn muốn xoá bộ truyện "${title}" và tất cả chapter liên quan? Hành động này không thể hoàn tác.`
    });
  };

  const confirmDeleteChapter = (chapterId, chapterNumber) => {
    setDeleteModal({
      isOpen: true,
      type: 'chapter',
      id: chapterId,
      title: 'Xóa Chapter',
      extraInfo: `Bạn có chắc chắn muốn xoá Chapter ${chapterNumber}? Hành động này không thể hoàn tác.`
    });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setActionLoading(true);
    try {
      if (deleteModal.type === 'comic') {
        const res = await fetch(`/api/comics/${deleteModal.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Lỗi khi xoá truyện');
        }
        setComics((prev) => prev.filter((c) => c.id !== deleteModal.id));
        if (expandedComicId === deleteModal.id) {
          setExpandedComicId(null);
          setExpandedComicDetails(null);
        }
      } else if (deleteModal.type === 'chapter') {
        const res = await fetch(`/api/chapters/${deleteModal.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Lỗi khi xoá chapter');
        }
        
        // Update local state for expanded comic
        if (expandedComicDetails) {
          setExpandedComicDetails({
            ...expandedComicDetails,
            chapters: expandedComicDetails.chapters.filter((ch) => ch.id !== deleteModal.id)
          });
        }
        
        // Update general chapter count in the list
        setComics((prev) => prev.map(c => {
          if (c.id === expandedComicId) {
            return {
              ...c,
              _count: {
                ...c._count,
                chapters: c._count.chapters - 1
              }
            };
          }
          return c;
        }));
      }
      setDeleteModal({ isOpen: false, type: '', id: null, title: '', extraInfo: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalComics = comics.length;
  const totalChapters = comics.reduce((acc, c) => acc + (c._count?.chapters || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
        <p className="text-sm text-slate-400">Đang tải bảng quản trị...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Add Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Bảng Điều Khiển Admin
          </h1>
          <p className="text-sm text-slate-400 mt-1">Quản lý truyện tranh, chương truyện và danh sách thành viên hệ thống.</p>
        </div>
        <Link
          href="/admin/comics/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          Đăng Truyện Mới
        </Link>
      </div>

      {/* Admin sub-navigation tabs */}
      <div className="flex border-b border-slate-700/80 gap-6">
        <Link 
          href="/admin" 
          className="border-b-2 border-violet-500 pb-3 text-sm font-bold text-slate-50"
        >
          Quản Lý Truyện
        </Link>
        <Link 
          href="/admin/users" 
          className="pb-3 text-sm font-semibold text-slate-400 hover:text-slate-50 transition-colors"
        >
          Quản Lý Người Dùng
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-violet-500/10 p-3 text-violet-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số truyện</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-50">{totalComics}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-fuchsia-500/10 p-3 text-fuchsia-500">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số chapter</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-50">{totalChapters}</h3>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Comics Table/List */}
      <div className="rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-sm">
        {comics.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen className="mx-auto h-12 w-12 text-slate-700 mb-3" />
            <p className="text-sm">Chưa có bộ truyện nào được đăng.</p>
            <Link href="/admin/comics/new" className="text-violet-400 hover:text-violet-300 text-xs font-semibold mt-2 inline-block underline">
              Tạo ngay bộ truyện đầu tiên
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-750/60">
            {comics.map((comic) => (
              <div key={comic.id} className="transition-colors hover:bg-slate-900/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950 shadow-md">
                      <img
                        src={comic.thumbnail}
                        alt={comic.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-50 hover:text-violet-400 transition-colors">
                        <Link href={`/comics/${comic.id}`}>{comic.title}</Link>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-xl">{comic.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          comic.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {comic.status === 'COMPLETED' ? (
                            <>
                              <CheckCircle className="h-2.5 w-2.5" />
                              Hoàn thành
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-2.5 w-2.5" />
                              Đang tiến hành
                            </>
                          )}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{comic._count?.chapters || 0} chương</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleExpandComic(comic.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-350 hover:bg-slate-800 hover:text-slate-50 transition-all duration-150"
                      disabled={actionLoading}
                    >
                      {expandedComicId === comic.id ? (
                        <>
                          <span>Ẩn Chapter</span>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Xem Chapter</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                    <Link
                      href={`/admin/comics/${comic.id}/chapters/new`}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/25 active:scale-95 transition-all duration-150"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Đăng Chapter
                    </Link>
                    <Link
                      href={`/admin/comics/${comic.id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/20 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-all duration-150"
                      title="Sửa thông tin truyện"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => confirmDeleteComic(comic.id, comic.title)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500/20 hover:text-red-600 transition-all duration-150 cursor-pointer"
                      disabled={actionLoading}
                      title="Xóa truyện"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Chapter list expansion */}
                {expandedComicId === comic.id && (
                  <div className="bg-slate-900/20 px-6 pb-6 border-t border-slate-700/50">
                    <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 mt-4">Danh sách Chapter ({expandedComicDetails?.chapters.length || 0})</h5>
                    {loadingDetails ? (
                      <div className="flex items-center gap-2 py-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500"></div>
                        <p className="text-xs text-slate-450">Đang tải danh sách chapter...</p>
                      </div>
                    ) : !expandedComicDetails || expandedComicDetails.chapters.length === 0 ? (
                      <p className="text-xs text-slate-450 py-2">Truyện này chưa được đăng chương nào.</p>
                    ) : (
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {expandedComicDetails.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm transition-colors hover:border-slate-600 hover:bg-slate-950"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-200 truncate">
                                Chapter {chapter.chapterNumber}
                              </p>
                              {chapter.title && (
                                <p className="text-[10px] text-slate-450 truncate mt-0.5">{chapter.title}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Link
                                href={`/admin/comics/${comic.id}/chapters/${chapter.id}/edit`}
                                className="text-slate-400 hover:text-slate-50 p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Sửa chương này"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => confirmDeleteChapter(chapter.id, chapter.chapterNumber)}
                                className="text-red-500 hover:text-red-650 p-1.5 rounded hover:bg-red-500/15 transition-colors cursor-pointer"
                                disabled={actionLoading}
                                title="Xóa chương này"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !actionLoading && setDeleteModal({ ...deleteModal, isOpen: false })}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-50">
                  {deleteModal.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {deleteModal.extraInfo}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-700/80 pt-4">
              <button
                type="button"
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Đang xoá...</span>
                  </>
                ) : (
                  <span>Xác nhận xoá</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
