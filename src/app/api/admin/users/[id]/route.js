import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';
import { hashPassword } from '@/lib/hash';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập.' },
        { status: 403 }
      );
    }

    if (session.id === id) {
      return NextResponse.json(
        { error: 'Bạn không thể tự xóa tài khoản của chính mình.' },
        { status: 400 }
      );
    }

    // Delete user from database
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa người dùng.' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập.' },
        { status: 403 }
      );
    }

    const { username, role, password } = await request.json();

    if (!username || !role) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ tên đăng nhập và vai trò.' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Tên đăng nhập tối thiểu 3 ký tự.' },
        { status: 400 }
      );
    }

    if (role !== 'USER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Vai trò không hợp lệ.' },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới tối thiểu phải có 6 ký tự.' },
        { status: 400 }
      );
    }

    // If the admin is editing their own user record
    if (session.id === id) {
      if (role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Bạn không thể tự hạ cấp vai trò Admin của chính mình.' },
          { status: 400 }
        );
      }
    }

    // Check if new username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại.' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      username,
      role,
    };

    if (password) {
      updateData.password = hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng.' },
      { status: 500 }
    );
  }
}
