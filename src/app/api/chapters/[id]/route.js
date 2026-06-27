import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { deleteUploadedPath, saveUploadedFile } from '@/lib/upload';
import { cookies } from 'next/headers';
import { getSessionPayload } from '@/lib/auth';
import { mapChapter } from '@/lib/media';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        images: {
          select: {
            id: true,
            chapterId: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' },
        },
        comic: {
          select: {
            title: true,
          }
        }
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter không tồn tại' }, { status: 404 });
    }

    const mappedImages = chapter.images.map(img => ({
      ...img,
      url: `/api/images/${img.id}`
    }));

    return NextResponse.json({
      ...chapter,
      images: mappedImages
    });
  } catch (error) {
    console.error('Error fetching chapter details:', error);
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
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

    const chapter = await prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Delete chapter (Prisma schema Cascade deletes ChapterImage records in SQLite)
    await prisma.chapter.delete({
      where: { id },
    });

    // Delete folder from disk
    await deleteUploadedPath(`comics/${chapter.comicId}/chapters/${id}`);

    return NextResponse.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
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

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        images: true
      }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter không tồn tại' }, { status: 404 });
    }

    const formData = await request.formData();
    const chapterNumberStr = formData.get('chapterNumber');
    const title = formData.get('title') || '';
    const files = formData.getAll('images');
    const tempIds = formData.getAll('tempIds');
    const imagesStructureStr = formData.get('imagesStructure');

    if (!chapterNumberStr) {
      return NextResponse.json({ error: 'Vui lòng nhập số chapter.' }, { status: 400 });
    }

    const chapterNumber = parseFloat(chapterNumberStr);
    if (isNaN(chapterNumber)) {
      return NextResponse.json({ error: 'Số chapter không hợp lệ.' }, { status: 400 });
    }

    // Check if another chapter with the same number exists for this comic
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        comicId: chapter.comicId,
        chapterNumber,
        NOT: { id }
      }
    });

    if (existingChapter) {
      return NextResponse.json({ error: `Chapter ${chapterNumber} đã tồn tại trong bộ truyện này.` }, { status: 400 });
    }

    // Process granular images updates (reordering, adding, deleting) if imagesStructure is provided
    if (imagesStructureStr) {
      const imagesStructure = JSON.parse(imagesStructureStr); // Array: [{ type: 'existing', id: '...' }, { type: 'new', tempId: '...' }]
      
      // Match new files to their tempIds
      const filesMap = {};
      for (let i = 0; i < tempIds.length; i++) {
        filesMap[tempIds[i]] = files[i];
      }

      // Find deleted images (exist in database but not in kept IDs)
      const keptIds = imagesStructure.filter(x => x.type === 'existing').map(x => x.id);
      const deletedImages = chapter.images.filter(img => !keptIds.includes(img.id));

      // 1. Delete files of deleted images from disk
      for (const img of deletedImages) {
        const relativePath = img.url.replace(/^\/uploads\//, '');
        await deleteUploadedPath(relativePath);
      }

      // 2. Delete database records of deleted images
      if (deletedImages.length > 0) {
        await prisma.chapterImage.deleteMany({
          where: {
            id: { in: deletedImages.map(x => x.id) }
          }
        });
      }

      // 3. Process structure sequentially to save new files and update sortOrders
      for (let idx = 0; idx < imagesStructure.length; idx++) {
        const item = imagesStructure[idx];
        if (item.type === 'existing') {
          // Update sortOrder of existing image
          await prisma.chapterImage.update({
            where: { id: item.id },
            data: { sortOrder: idx }
          });
        } else if (item.type === 'new') {
          // Save new file to disk
          const file = filesMap[item.tempId];
          if (file) {
            const ext = file.name.split('.').pop() || 'png';
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFileName = `${Date.now()}-${idx}-${cleanName}`;
            const savedPath = await saveUploadedFile(
              file,
              `comics/${chapter.comicId}/chapters/${id}`,
              uniqueFileName
            );

            // Create new ChapterImage DB record
            await prisma.chapterImage.create({
              data: {
                chapterId: id,
                url: savedPath,
                sortOrder: idx
              }
            });
          }
        }
      }
    } else {
      // Fallback: old behavior if imagesStructure is not provided (replaces all if new files are selected)
      if (files.length > 0) {
        // Sort files naturally by filename
        const sortedFiles = [...files].sort((a, b) => {
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Delete old files from disk
        await deleteUploadedPath(`comics/${chapter.comicId}/chapters/${id}`);
        
        // Delete old database records
        await prisma.chapterImage.deleteMany({
          where: { chapterId: id }
        });

        // Save new images
        for (let i = 0; i < sortedFiles.length; i++) {
          const file = sortedFiles[i];
          const ext = file.name.split('.').pop() || 'png';
          const savedPath = await saveUploadedFile(
            file,
            `comics/${chapter.comicId}/chapters/${id}`,
            `${i}.${ext}`
          );
          
          await prisma.chapterImage.create({
            data: {
              chapterId: id,
              url: savedPath,
              sortOrder: i
            }
          });
        }
      }
    }

    // Update main chapter metadata and return updated structure
    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: {
        chapterNumber,
        title
      },
      include: {
        images: {
          select: {
            id: true,
            chapterId: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    const mappedImages = updatedChapter.images.map(img => ({
      ...img,
      url: `/api/images/${img.id}`
    }));

    return NextResponse.json({
      ...updatedChapter,
      images: mappedImages
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi cập nhật chapter.' }, { status: 500 });
  }
}
