import prisma from '@/lib/db';
import ChapterReaderClient from './ChapterReaderClient';
import { notFound } from 'next/navigation';
import { mapChapter, mapComic } from '@/lib/media';

export const revalidate = 5; // Cache chương truyện 5 giây ở CDN tăng tốc độ tải trang cực đại

export default async function Page({ params }) {
  const resolvedParams = await params;
  const { id: comicId, chapterId } = resolvedParams;

  try {
    // 1. Tải thông tin chapter và các ảnh chapter trực tiếp từ DB trên Server (Bỏ cột url để tránh tải Base64 siêu nặng)
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        images: {
          select: {
            id: true,
            chapterId: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' },
        },
        comic: {
          select: {
            title: true,
          }
        }
      },
    });

    if (!chapter || chapter.comicId !== comicId) {
      notFound();
    }

    // 2. Tải danh sách các chapter của bộ truyện để làm thanh chọn chapter chuyển tiếp
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        }
      }
    });

    if (!comic) {
      notFound();
    }

    // Map URL ảnh động trỏ tới API endpoint để tải song song và tận dụng cache
    const mappedChapter = {
      ...chapter,
      images: chapter.images.map(img => ({
        ...img,
        url: `/api/images/${img.id}`
      }))
    };

    return (
      <ChapterReaderClient 
        initialComic={JSON.parse(JSON.stringify(mapComic(comic)))} 
        initialChapter={JSON.parse(JSON.stringify(mappedChapter))} 
      />
    );
  } catch (error) {
    console.error('Error fetching chapter details on server:', error);
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 border border-red-500/20 bg-red-500/5 rounded-xl">
        <p className="text-red-400 font-semibold">Đã xảy ra lỗi khi tải dữ liệu chương. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
