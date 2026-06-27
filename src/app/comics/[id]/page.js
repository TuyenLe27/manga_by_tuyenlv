import prisma from '@/lib/db';
import ComicDetailClient from './ComicDetailClient';
import { notFound } from 'next/navigation';
import { mapComic } from '@/lib/media';

export const revalidate = 5; // Cache chi tiết truyện 5 giây ở CDN tăng tốc độ tải trang cực đại

export default async function Page({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const comic = await prisma.comic.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!comic) {
      notFound();
    }

    // Lấy thống kê lượt yêu thích và bình luận trực tiếp trên server
    const favoritesCount = await prisma.favorite.count({
      where: { comicId: id }
    });

    const commentsCount = await prisma.comment.count({
      where: { chapter: { comicId: id } }
    });

    const ratings = await prisma.rating.findMany({
      where: { comicId: id }
    });

    const ratingsCount = ratings.length;
    const averageRating = ratingsCount > 0 
      ? parseFloat((ratings.reduce((sum, r) => sum + r.score, 0) / ratingsCount).toFixed(1))
      : 0;

    const initialComic = mapComic({
      ...JSON.parse(JSON.stringify(comic)),
      favoritesCount,
      commentsCount,
      ratingsCount,
      averageRating,
    });

    return <ComicDetailClient initialComic={initialComic} />;
  } catch (error) {
    console.error('Error fetching comic details on server:', error);
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 border border-red-500/20 bg-red-500/5 rounded-xl">
        <p className="text-red-400 font-semibold">Đã xảy ra lỗi khi tải dữ liệu truyện. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
