import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { commentId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện chức năng này.' },
        { status: 401 }
      );
    }

    // Find comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Bình luận không tồn tại hoặc đã bị xóa trước đó.' },
        { status: 404 }
      );
    }

    // Authorize: user must be admin or the author of the comment
    const isAuthor = comment.userId === session.id;
    const isAdmin = session.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa bình luận này.' },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi xóa bình luận.' },
      { status: 500 }
    );
  }
}
