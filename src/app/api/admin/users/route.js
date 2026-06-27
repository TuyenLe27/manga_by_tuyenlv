import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';
import { hashPassword } from '@/lib/hash';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập.' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách người dùng.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập.' },
        { status: 403 }
      );
    }

    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin.' },
        { status: 400 }
      );
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json(
        { error: 'Tên đăng nhập tối thiểu 3 ký tự, mật khẩu tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    if (role !== 'USER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Vai trò không hợp lệ.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại.' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user by admin:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo người dùng.' },
      { status: 500 }
    );
  }
}
