'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ComicForm from '@/components/ComicForm';

export default function NewComicPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (formDataFields) => {
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', formDataFields.title);
      formData.append('description', formDataFields.description);
      formData.append('status', formDataFields.status);
      if (formDataFields.thumbnailFile) {
        formData.append('thumbnail', formDataFields.thumbnailFile);
      }

      const res = await fetch('/api/comics', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi tạo truyện tranh');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}
      <ComicForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
