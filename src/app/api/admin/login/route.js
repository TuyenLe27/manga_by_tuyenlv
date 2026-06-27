import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { createSessionCookie } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/hash';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.' },
        { status: 400 }
      );
    }

    // Auto-create default admin user if no admin user exists in DB
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount === 0) {
      // Create default admin user
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashPassword('Tuyenplm123@'),
          role: 'ADMIN',
        },
      });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Tài khoản không có quyền truy cập quản trị.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Sai tên đăng nhập hoặc mật khẩu.' },
        { status: 401 }
      );
    }

    // Auto-migrate legacy password to PBKDF2 if needed
    if (!user.password.startsWith('pbkdf2:')) {
      try {
        const secureHash = hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: secureHash },
        });
      } catch (err) {
        console.error('Failed to auto-migrate admin password hash:', err);
      }
    }


    // Create session cookie
    const token = await createSessionCookie({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    
    // Set new unified user_session cookie
    cookieStore.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    // Also set old admin_session for backwards compatibility if needed, or we can rely solely on user_session
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống.' },
      { status: 500 }
    );
  }
}
