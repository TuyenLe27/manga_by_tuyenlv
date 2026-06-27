import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để xem danh sách yêu thích.' },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.id },
      include: {
        comic: {
          include: {
            chapters: {
              orderBy: { chapterNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract comics from favorite records
    const comics = favorites.map(f => f.comic);

    return NextResponse.json(comics);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi tải danh sách yêu thích.' },
      { status: 500 }
    );
  }
}
