import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { saveUploadedFile } from '@/lib/upload';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getSessionPayload } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    const session = await getSessionPayload(token);

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id: comicId } = resolvedParams;

    const formData = await request.formData();
    const chapterNumberStr = formData.get('chapterNumber');
    const title = formData.get('title') || '';
    const files = formData.getAll('images');

    if (!chapterNumberStr || files.length === 0) {
      return NextResponse.json({ error: 'Chapter number and at least one image are required' }, { status: 400 });
    }

    const chapterNumber = parseFloat(chapterNumberStr);
    if (isNaN(chapterNumber)) {
      return NextResponse.json({ error: 'Chapter number must be a valid number' }, { status: 400 });
    }

    // Verify comic exists
    const comic = await prisma.comic.findUnique({
      where: { id: comicId }
    });
    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    // Check if chapter number already exists for this comic
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        comicId,
        chapterNumber
      }
    });
    if (existingChapter) {
      return NextResponse.json({ error: `Chapter ${chapterNumber} already exists` }, { status: 400 });
    }

    // Respect the client-provided file ordering (sorted/dragged order)
    const sortedFiles = files;

    const chapterId = crypto.randomUUID();

    // Save images sequentially and build DB create data
    const imageCreateData = [];
    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      const ext = file.name.split('.').pop() || 'png';
      const savedPath = await saveUploadedFile(
        file,
        `comics/${comicId}/chapters/${chapterId}`,
        `${i}.${ext}`
      );
      
      imageCreateData.push({
        url: savedPath,
        sortOrder: i
      });
    }

    // Transactional database update
    const chapter = await prisma.chapter.create({
      data: {
        id: chapterId,
        comicId,
        chapterNumber,
        title,
        images: {
          create: imageCreateData
        }
      },
      include: {
        images: true
      }
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
}
