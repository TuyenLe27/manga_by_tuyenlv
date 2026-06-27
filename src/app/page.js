import { Suspense } from 'react';
import prisma from '@/lib/db';
import HomeClient from './HomeClient';
import { mapComic } from '@/lib/media';

export const revalidate = 10; // Cache trang chủ 10 giây ở CDN để tăng tốc độ tải cực đại

export default async function Home() {
  try {
    // 1. Fetch comics với các thống kê đi kèm trong 1 truy vấn đơn lẻ (Favorites, Ratings)
    const comics = await prisma.comic.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'desc' },
          take: 1
        },
        _count: {
          select: {
            favorites: true
          }
        },
        ratings: {
          select: {
            score: true
          }
        }
      }
    });

    // 2. Fetch toàn bộ comments để gom đếm in-memory (Tránh N+1 query comments)
    const comments = await prisma.comment.findMany({
      select: {
        chapter: {
          select: {
            comicId: true
          }
        }
      }
    });

    const commentCounts = {};
    comments.forEach(c => {
      const cid = c.chapter?.comicId;
      if (cid) {
        commentCounts[cid] = (commentCounts[cid] || 0) + 1;
      }
    });

    // 3. Chuẩn bị mảng truyện phong phú thông tin
    const enrichedComics = comics.map(comic => {
      const ratings = comic.ratings || [];
      const ratingsCount = ratings.length;
      const averageRating = ratingsCount > 0
        ? parseFloat((ratings.reduce((sum, r) => sum + r.score, 0) / ratingsCount).toFixed(1))
        : 0;

      return mapComic({
        id: comic.id,
        title: comic.title,
        description: comic.description,
        thumbnail: comic.thumbnail,
        status: comic.status,
        createdAt: comic.createdAt,
        updatedAt: comic.updatedAt,
        chapters: comic.chapters,
        favoritesCount: comic._count?.favorites || 0,
        commentsCount: commentCounts[comic.id] || 0,
        averageRating,
        ratingsCount,
      });
    });

    return (
      <Suspense fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
        </div>
      }>
        <HomeClient initialComics={JSON.parse(JSON.stringify(enrichedComics))} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching homepage comics on server:', error);
    
    // Fallback UI if DB query fails
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-red-400 font-semibold">Đã xảy ra lỗi khi tải danh sách truyện. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
