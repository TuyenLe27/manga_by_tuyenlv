import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Check if a comic is favorited by the current user
export async function GET(request, { params }) {
  try {
    const { comicId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json({ isFavorited: false });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_comicId: {
          userId: session.id,
          comicId,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json({ isFavorited: false });
  }
}

// POST: Add a comic to user's favorites
export async function POST(request, { params }) {
  try {
    const { comicId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thêm vào yêu thích.' },
        { status: 401 }
      );
    }

    // Verify comic exists
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
    });

    if (!comic) {
      return NextResponse.json(
        { error: 'Bộ truyện không tồn tại.' },
        { status: 404 }
      );
    }

    // Create favorite record (using upsert to prevent double insertion errors)
    await prisma.favorite.upsert({
      where: {
        userId_comicId: {
          userId: session.id,
          comicId,
        },
      },
      update: {},
      create: {
        userId: session.id,
        comicId,
      },
    });

    return NextResponse.json({ success: true, isFavorited: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi thêm vào mục yêu thích.' },
      { status: 550 }
    );
  }
}

// DELETE: Remove a comic from user's favorites
export async function DELETE(request, { params }) {
  try {
    const { comicId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để xóa khỏi yêu thích.' },
        { status: 401 }
      );
    }

    // Delete record if it exists
    await prisma.favorite.deleteMany({
      where: {
        userId: session.id,
        comicId,
      },
    });

    return NextResponse.json({ success: true, isFavorited: false });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa khỏi mục yêu thích.' },
      { status: 500 }
    );
  }
}
