'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ComicForm from '@/components/ComicForm';

export default function EditComicPage() {
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchComic = async () => {
      try {
        const { id } = params;
        const res = await fetch(`/api/comics/${id}`);
        if (!res.ok) throw new Error('Không thể tải thông tin truyện');
        const data = await res.json();
        setComic(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchComic();
  }, [params]);

  const handleSubmit = async (formDataFields) => {
    setIsSubmitting(true);
    setError('');

    try {
      const { id } = params;
      const formData = new FormData();
      formData.append('title', formDataFields.title);
      formData.append('description', formDataFields.description);
      formData.append('status', formDataFields.status);
      if (formDataFields.thumbnailFile) {
        formData.append('thumbnail', formDataFields.thumbnailFile);
      }

      const res = await fetch(`/api/comics/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi cập nhật truyện tranh');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
        <p className="text-sm text-slate-400">Đang tải thông tin truyện...</p>
      </div>
    );
  }

  if (error && !comic) {
    return (
      <div className="max-w-md mx-auto text-center p-8 border border-red-500/20 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm font-semibold">{error}</p>
        <button
          onClick={() => router.push('/admin')}
          className="mt-4 text-xs bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}
      {comic && (
        <ComicForm
          initialData={comic}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
