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

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Sai tên đăng nhập hoặc mật khẩu.' },
        { status: 401 }
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
        console.error('Failed to auto-migrate password hash:', err);
      }
    }


    // Create session cookie
    const token = await createSessionCookie({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi đăng nhập.' },
      { status: 500 }
    );
  }
}
