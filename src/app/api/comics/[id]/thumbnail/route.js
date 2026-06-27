import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const comic = await prisma.comic.findUnique({
      where: { id },
      select: { thumbnail: true }
    });

    if (!comic || !comic.thumbnail) {
      return NextResponse.json({ error: 'Comic or thumbnail not found' }, { status: 404 });
    }

    if (comic.thumbnail.startsWith('data:')) {
      const match = comic.thumbnail.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 });
      }

      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        }
      });
    }

    // Redirect to the actual URL if it is not base64
    return NextResponse.redirect(new URL(comic.thumbnail, request.url));
  } catch (error) {
    console.error('Error serving comic thumbnail:', error);
    return NextResponse.json({ error: 'Failed to load thumbnail' }, { status: 500 });
  }
}
