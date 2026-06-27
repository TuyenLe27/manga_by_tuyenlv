import { Suspense } from 'react';
import prisma from '@/lib/db';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    // 1. Fetch comics
    const comics = await prisma.comic.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'desc' },
          take: 1
        }
      }
    });

    // 2. Precompute stats (ratings, comments, favorites) for each comic
    const enrichedComics = await Promise.all(comics.map(async (comic) => {
      const comicId = comic.id;

      // Favorites Count
      const favoritesCount = await prisma.favorite.count({
        where: { comicId }
      });

      // Comments Count (accumulated across all chapters of the comic)
      const commentsCount = await prisma.comment.count({
        where: {
          chapter: { comicId }
        }
      });

      // Ratings Stats
      const ratings = await prisma.rating.findMany({
        where: { comicId }
      });
      const ratingsCount = ratings.length;
      const averageRating = ratingsCount > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratingsCount
        : 0;

      return {
        ...comic,
        favoritesCount,
        commentsCount,
        averageRating,
        ratingsCount,
      };
    }));

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
