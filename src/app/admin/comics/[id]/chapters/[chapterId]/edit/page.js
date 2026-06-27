'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, X, ArrowLeft, Loader2, FileText, CheckCircle2, AlertCircle, Image as ImageIcon, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

import { compressImage } from '@/lib/clientCompress';

export default function EditChapterPage() {
  const [comic, setComic] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  
  // List of all items (both existing and newly added files) in sorted order
  const [items, setItems] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchChapterAndComic = async () => {
      try {
        const { id: comicId, chapterId } = params;
        
        // Fetch chapter details
        const chapterRes = await fetch(`/api/chapters/${chapterId}?t=${Date.now()}`);
        if (!chapterRes.ok) throw new Error('Không tìm thấy thông tin chapter');
        const chapterData = await chapterRes.json();
        
        setChapter(chapterData);
        setChapterNumber(chapterData.chapterNumber.toString());
        setChapterTitle(chapterData.title || '');
        
        const fetchedItems = (chapterData.images || []).map(img => ({
          id: img.id,
          url: img.url,
          type: 'existing'
        }));
        setItems(fetchedItems);

        // Fetch comic details
        const comicRes = await fetch(`/api/comics/${comicId}?t=${Date.now()}`);
        if (!comicRes.ok) throw new Error('Không tìm thấy thông tin truyện');
        const comicData = await comicRes.json();
        setComic(comicData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChapterAndComic();
  }, [params]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate image types
    const invalidFiles = selectedFiles.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Tất cả các file tải lên phải là định dạng ảnh.');
      return;
    }

    setError('');
    setCompressing(true);
    
    try {
      // Sort selected files naturally by name
      const sortedFiles = [...selectedFiles].sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      const compressedFiles = await Promise.all(
        sortedFiles.map(file => compressImage(file))
      );

      const newAddedItems = compressedFiles.map((file, idx) => ({
        tempId: `new-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        file: file,
        url: URL.createObjectURL(file),
        type: 'new',
        name: file.name,
        size: file.size
      }));

      const updatedItems = [...items, ...newAddedItems];
      setItems(updatedItems);
    } catch (err) {
      setError('Lỗi khi nén ảnh: ' + err.message);
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveItem = (index) => {
    const item = items[index];
    if (item.type === 'new') {
      URL.revokeObjectURL(item.url);
    }
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleClearAll = () => {
    items.forEach(item => {
      if (item.type === 'new') {
        URL.revokeObjectURL(item.url);
      }
    });
    setItems([]);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const reorderedItems = [...items];
    const [draggedItem] = reorderedItems.splice(sourceIndex, 1);
    reorderedItems.splice(targetIndex, 0, draggedItem);
    
    setItems(reorderedItems);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Manual movements
  const moveItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reorderedItems = [...items];
    const temp = reorderedItems[index];
    reorderedItems[index] = reorderedItems[targetIndex];
    reorderedItems[targetIndex] = temp;
    setItems(reorderedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!chapterNumber) {
      setError('Vui lòng nhập số chapter.');
      return;
    }

    if (items.length === 0) {
      setError('Chapter phải chứa ít nhất 1 ảnh.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { chapterId } = params;
      const formData = new FormData();
      formData.append('chapterNumber', chapterNumber);
      formData.append('title', chapterTitle);
      
      const imagesStructure = items.map(item => {
        if (item.type === 'existing') {
          return { type: 'existing', id: item.id };
        } else {
          formData.append('images', item.file);
          formData.append('tempIds', item.tempId);
          return { type: 'new', tempId: item.tempId };
        }
      });

      formData.append('imagesStructure', JSON.stringify(imagesStructure));

      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi cập nhật chapter');
      }

      setSuccess(`Đã cập nhật thành công Chapter ${chapterNumber}!`);
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
        <p className="text-sm text-slate-400">Đang tải thông tin chương truyện...</p>
      </div>
    );
  }

  if (error && !chapter) {
    return (
      <div className="max-w-md mx-auto text-center p-8 border border-red-500/20 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm font-semibold">{error}</p>
        <Link
          href="/admin"
          className="mt-4 inline-block text-xs bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back & Comic Summary */}
      <div className="flex items-center gap-3 border-b border-slate-705 pb-4">
        <Link href="/admin" className="text-slate-400 hover:text-slate-50 p-1.5 rounded hover:bg-slate-900/50 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">Cấu hình chi tiết chapter</span>
          <h2 className="text-xl font-extrabold text-slate-50 mt-0.5">
            Bộ truyện: <span className="text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text">{comic?.title}</span>
          </h2>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-450 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 animate-bounce" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-950 border border-slate-700/80 p-6 rounded-xl backdrop-blur-sm shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Chapter Number */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-350 block">Số Chapter <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="any"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
              placeholder="Ví dụ: 1 hoặc 2.5..."
              className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Chapter Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-350 block">Tên Chapter (Không bắt buộc)</label>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="Ví dụ: Khởi Đầu Mới..."
              className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Multi-file Image Upload */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-350 block">Tải thêm ảnh trang truyện</label>
            <p className="text-[11px] text-slate-500 mt-1">
              💡 Bạn có thể kéo thả để thay đổi vị trí, nhấn mũi tên Lên/Xuống hoặc xóa riêng lẻ từng trang ảnh cũ và mới bên dưới.
            </p>
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed border-slate-700 bg-slate-950 hover:border-slate-500 hover:bg-slate-900/20 cursor-pointer transition-all duration-200 shadow-sm">
              <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                {compressing ? (
                  <>
                    <Loader2 className="h-6 w-6 text-violet-500 mb-2 animate-spin" />
                    <p className="text-xs font-semibold text-slate-400">Đang nén và tối ưu hóa ảnh...</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Vui lòng chờ trong giây lát</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">Thêm ảnh mới vào chương</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Sau đó kéo thả để xếp thứ tự theo ý muốn</p>
                  </>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={compressing}
              />
            </label>
          </div>
        </div>

        {/* Images Reordering Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-705 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Danh sách trang truyện ({items.length} trang)</span>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest cursor-pointer"
              >
                Xóa tất cả trang
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-950/20 text-slate-500 text-xs">
              Chưa có trang ảnh nào trong chapter này. Vui lòng tải lên ảnh.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-h-[600px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-4 shadow-inner">
              {items.map((item, idx) => (
                <div
                  key={item.type === 'existing' ? `existing-${item.id}` : item.tempId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`relative group border rounded-xl overflow-hidden shadow-md flex flex-col transition-all cursor-move ${
                    draggedIndex === idx 
                      ? 'border-violet-500 bg-violet-500/5 scale-95 opacity-50' 
                      : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
                    <img
                      src={item.url}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                    
                    {/* Index Badge */}
                    <div className={`absolute top-2 left-2 rounded text-[10px] font-bold px-1.5 py-0.5 shadow-md ${
                      item.type === 'existing' 
                        ? 'bg-slate-800/90 text-slate-300 border border-slate-700/50' 
                        : 'bg-fuchsia-650 text-white shadow-fuchsia-600/20'
                    }`}>
                      Trang {idx + 1} {item.type === 'new' && '(Mới)'}
                    </div>

                    {/* Drag Handle & overlay buttons */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-between p-2.5 transition-opacity duration-200">
                      
                      {/* Top actions: move up/down */}
                      <div className="flex gap-1.5 w-full justify-center">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="rounded bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === items.length - 1}
                          className="rounded bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Bottom action: Delete individual page */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="rounded-full bg-red-600 hover:bg-red-500 p-2 text-white shadow-lg active:scale-90 transition-transform cursor-pointer"
                        title="Xóa trang này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata label */}
                  <div className="p-2 flex-1 flex flex-col justify-center bg-slate-950 text-left border-t border-slate-900">
                    <p className="font-semibold text-slate-350 text-[10px] truncate" title={item.type === 'existing' ? 'Ảnh trên hệ thống' : item.name}>
                      {item.type === 'existing' ? 'Ảnh trên hệ thống' : item.name}
                    </p>
                    {item.type === 'new' && (
                      <p className="text-slate-550 text-[9px]">
                        {(item.size / 1024).toFixed(0)} KB
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="border-t border-slate-705 pt-5 flex items-center justify-end gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-450 hover:bg-slate-800 hover:text-slate-50 transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu thay đổi...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
