import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { saveUploadedFile } from '@/lib/upload';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getSessionPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where = {};
    if (search) {
      where.title = { contains: search };
    }
    if (status) {
      where.status = status;
    }

    const comics = await prisma.comic.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chapters: true }
        },
        chapters: {
          orderBy: { chapterNumber: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json(comics);
  } catch (error) {
    console.error('Error fetching comics:', error);
    return NextResponse.json({ error: 'Failed to fetch comics' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const status = formData.get('status') || 'ONGOING';
    const thumbnailFile = formData.get('thumbnail');

    if (!title || !description || !thumbnailFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const comicId = crypto.randomUUID();

    // Save thumbnail under public/uploads/comics/<comic-id>/thumbnail.<ext>
    const ext = thumbnailFile.name.split('.').pop() || 'png';
    const thumbnailPath = await saveUploadedFile(
      thumbnailFile,
      `comics/${comicId}`,
      `thumbnail.${ext}`
    );

    const comic = await prisma.comic.create({
      data: {
        id: comicId,
        title,
        description,
        status,
        thumbnail: thumbnailPath,
      }
    });

    return NextResponse.json(comic);
  } catch (error) {
    console.error('Error creating comic:', error);
    return NextResponse.json({ error: 'Failed to create comic' }, { status: 500 });
  }
}
