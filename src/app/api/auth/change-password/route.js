import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/hash';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện chức năng này.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    // Fetch user from DB to get the current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin tài khoản.' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = verifyPassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không chính xác.' },
        { status: 400 }
      );
    }

    // Hash and update the new password
    const hashedNew = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.id },
      data: {
        password: hashedNew,
      },
    });

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi đổi mật khẩu.' },
      { status: 500 }
    );
  }
}
