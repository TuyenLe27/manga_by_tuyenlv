import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionPayload } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    
    const session = await getSessionPayload(token);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Refresh user details from DB to make sure role, username are up to date
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      // User deleted in database but still has session
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Check auth error:', error);
    return NextResponse.json({ user: null });
  }
}
