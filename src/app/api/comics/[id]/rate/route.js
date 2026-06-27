import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id: comicId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện đánh giá.' },
        { status: 401 }
      );
    }

    const { score } = await request.json();
    const ratingScore = parseInt(score);

    if (isNaN(ratingScore) || ratingScore < 1 || ratingScore > 5) {
      return NextResponse.json(
        { error: 'Điểm đánh giá phải từ 1 đến 5 sao.' },
        { status: 400 }
      );
    }

    // Check if comic exists
    const comic = await prisma.comic.findUnique({
      where: { id: comicId }
    });

    if (!comic) {
      return NextResponse.json({ error: 'Truyện không tồn tại.' }, { status: 404 });
    }

    // Create or update rating (upsert)
    const rating = await prisma.rating.upsert({
      where: {
        userId_comicId: {
          userId: session.id,
          comicId,
        }
      },
      update: {
        score: ratingScore
      },
      create: {
        userId: session.id,
        comicId,
        score: ratingScore
      }
    });

    // Compute new overall average and count
    const ratings = await prisma.rating.findMany({
      where: { comicId }
    });
    
    const ratingsCount = ratings.length;
    const averageRating = ratingsCount > 0 
      ? parseFloat((ratings.reduce((sum, r) => sum + r.score, 0) / ratingsCount).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      rating,
      averageRating,
      ratingsCount
    });
  } catch (error) {
    console.error('Error rating comic:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi gửi đánh giá.' },
      { status: 500 }
    );
  }
}
