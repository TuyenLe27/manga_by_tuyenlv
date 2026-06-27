'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Upload, X, ArrowLeft, Loader2 } from 'lucide-react';

export default function ComicForm({ initialData = null, onSubmit, isSubmitting = false }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'ONGOING');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnail || null);
  const [validationError, setValidationError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setValidationError('Vui lòng chọn file ảnh (png, jpg, jpeg...)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('Dung lượng ảnh tối đa là 5MB');
        return;
      }
      setValidationError('');
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setValidationError('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }
    if (!initialData && !thumbnailFile) {
      setValidationError('Vui lòng upload ảnh bìa (thumbnail).');
      return;
    }

    setValidationError('');
    onSubmit({
      title,
      description,
      status,
      thumbnailFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-slate-950 border border-slate-700/80 p-6 rounded-xl backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-slate-400 hover:text-slate-50 p-1 rounded hover:bg-slate-900/50 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-xl font-bold text-slate-50">
            {initialData ? 'Chỉnh Sửa Truyện Tranh' : 'Đăng Bộ Truyện Mới'}
          </h2>
        </div>
        <span className="text-[10px] text-slate-450 uppercase tracking-widest font-semibold">TuyenLV</span>
      </div>

      {validationError && (
        <div className="text-xs text-red-405 border border-red-500/20 bg-red-500/10 px-3 py-2.5 rounded-lg flex items-center gap-1.5">
          <span>⚠️ {validationError}</span>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-350 block">Tên truyện <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tên bộ truyện tranh..."
          className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-350 block">Mô tả nội dung <span className="text-red-500">*</span></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tóm tắt ngắn gọn nội dung cốt truyện..."
          rows={5}
          className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all resize-y"
          required
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-350 block">Trạng thái phát hành</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer group text-slate-350 text-sm">
            <input
              type="radio"
              name="status"
              value="ONGOING"
              checked={status === 'ONGOING'}
              onChange={() => setStatus('ONGOING')}
              className="h-4 w-4 border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500"
            />
            <span className="group-hover:text-slate-50 transition-colors">Đang tiến hành</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group text-slate-350 text-sm">
            <input
              type="radio"
              name="status"
              value="COMPLETED"
              checked={status === 'COMPLETED'}
              onChange={() => setStatus('COMPLETED')}
              className="h-4 w-4 border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500"
            />
            <span className="group-hover:text-slate-50 transition-colors">Đã hoàn thành</span>
          </label>
        </div>
      </div>

      {/* Thumbnail Upload */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-350 block">Ảnh đại diện (Thumbnail) <span className="text-red-500">{initialData ? '' : '*'}</span></label>
        
        {thumbnailPreview ? (
          <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 max-w-[200px] aspect-[3/4] bg-slate-950 shadow-md">
            <img
              src={thumbnailPreview}
              alt="Preview Thumbnail"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-full bg-red-650 hover:bg-red-500 p-2 text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
                title="Gỡ ảnh"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full max-w-[200px] aspect-[3/4] rounded-lg border border-dashed border-slate-700 bg-slate-950 hover:border-slate-500 hover:bg-slate-900/20 cursor-pointer transition-all duration-200 shadow-sm">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
              <Upload className="h-8 w-8 text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Chọn ảnh bìa</p>
              <p className="text-[10px] text-slate-450 mt-1">Hỗ trợ JPG, PNG dưới 5MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Submit Button */}
      <div className="border-t border-slate-700/80 pt-5 flex items-center justify-end gap-3">
        <Link
          href="/admin"
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors"
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
              <span>Đang lưu...</span>
            </>
          ) : (
            <span>{initialData ? 'Cập Nhật Truyện' : 'Lưu & Đăng'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
