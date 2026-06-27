import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id: chapterId } = await params;

    const comments = await prisma.comment.findMany({
      where: { chapterId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải bình luận.' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id: chapterId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để gửi bình luận.' },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Nội dung bình luận không được để trống.' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Nội dung bình luận không được vượt quá 1000 ký tự.' },
        { status: 400 }
      );
    }

    // Verify user still exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'Tài khoản không tồn tại hoặc đã bị xóa.' },
        { status: 401 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        chapterId,
        userId: session.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng bình luận.' },
      { status: 500 }
    );
  }
}
