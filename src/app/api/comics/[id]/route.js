import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { saveUploadedFile, deleteUploadedPath } from '@/lib/upload';
import { cookies } from 'next/headers';
import { getSessionPayload } from '@/lib/auth';
import { mapComic } from '@/lib/media';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const comic = await prisma.comic.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    const favoritesCount = await prisma.favorite.count({
      where: { comicId: id }
    });

    const commentsCount = await prisma.comment.count({
      where: { chapter: { comicId: id } }
    });

    const ratings = await prisma.rating.findMany({
      where: { comicId: id }
    });

    const ratingsCount = ratings.length;
    const averageRating = ratingsCount > 0 
      ? parseFloat((ratings.reduce((sum, r) => sum + r.score, 0) / ratingsCount).toFixed(1))
      : 0;

    let userRating = null;
    if (session) {
      const activeRating = await prisma.rating.findUnique({
        where: {
          userId_comicId: {
            userId: session.id,
            comicId: id
          }
        }
      });
      userRating = activeRating ? activeRating.score : null;
    }

    return NextResponse.json(mapComic({
      ...comic,
      favoritesCount,
      commentsCount,
      ratingsCount,
      averageRating,
      userRating
    }));
  } catch (error) {
    console.error('Error fetching comic details:', error);
    return NextResponse.json({ error: 'Failed to fetch comic' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const status = formData.get('status');
    const thumbnailFile = formData.get('thumbnail');

    const comic = await prisma.comic.findUnique({
      where: { id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    const data = {};
    if (title) data.title = title;
    if (description !== null) data.description = description;
    if (status) data.status = status;

    if (thumbnailFile && thumbnailFile instanceof File && thumbnailFile.size > 0) {
      // Re-upload thumbnail
      const ext = thumbnailFile.name.split('.').pop() || 'png';
      
      // Delete old thumbnail file if exists
      if (comic.thumbnail) {
        const relativeOldPath = comic.thumbnail.replace(/^\/uploads\//, '');
        await deleteUploadedPath(relativeOldPath);
      }

      const thumbnailPath = await saveUploadedFile(
        thumbnailFile,
        `comics/${id}`,
        `thumbnail.${ext}`
      );
      data.thumbnail = thumbnailPath;
    }

    const updatedComic = await prisma.comic.update({
      where: { id },
      data,
    });

    return NextResponse.json(mapComic(updatedComic));
  } catch (error) {
    console.error('Error updating comic:', error);
    return NextResponse.json({ error: 'Failed to update comic' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const comic = await prisma.comic.findUnique({
      where: { id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    // Delete comic from DB (cascade deletes chapters and chapterimages)
    await prisma.comic.delete({
      where: { id },
    });

    // Delete comic folder from disk
    await deleteUploadedPath(`comics/${id}`);

    return NextResponse.json({ message: 'Comic deleted successfully' });
  } catch (error) {
    console.error('Error deleting comic:', error);
    return NextResponse.json({ error: 'Failed to delete comic' }, { status: 500 });
  }
}
