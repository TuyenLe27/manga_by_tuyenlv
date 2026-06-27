const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.favorite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.chapterImage.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.comic.deleteMany();

  console.log('Seeding admin...');
  const crypto = require('crypto');
  const hashedAdminPassword = crypto.createHash('sha256').update('Tuyenplm123@').digest('hex');
  await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedAdminPassword,
      role: 'ADMIN'
    }
  });

  console.log('Seeding comics...');

  // Comic 1
  const soloLeveling = await prisma.comic.create({
    data: {
      title: 'Solo Leveling (Tôi Thăng Cấp Một Mình)',
      description: 'Mười năm trước, sau khi "Cánh cổng" kết nối thế giới thực với thế giới quái vật mở ra, một số người bình thường nhận được sức mạnh săn lùng quái vật trong Cổng. Họ được gọi là "Thợ săn". Tuy nhiên, không phải tất cả các Thợ săn đều mạnh mẽ. Tôi là Sung Jin-Woo, một Thợ săn hạng E. Tôi là người phải mạo hiểm mạng sống của mình trong những hầm ngục thấp nhất, "Kẻ yếu nhất thế giới".',
      status: 'ONGOING',
      thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    }
  });

  // Chapters for Comic 1
  const slCh1 = await prisma.chapter.create({
    data: {
      comicId: soloLeveling.id,
      chapterNumber: 1,
      title: 'Thợ săn yếu nhất nhân loại',
    }
  });

  await prisma.chapterImage.createMany({
    data: [
      { chapterId: slCh1.id, url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80', sortOrder: 0 },
      { chapterId: slCh1.id, url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', sortOrder: 1 },
      { chapterId: slCh1.id, url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80', sortOrder: 2 },
    ]
  });

  const slCh2 = await prisma.chapter.create({
    data: {
      comicId: soloLeveling.id,
      chapterNumber: 2,
      title: 'Hầm ngục kép bí ẩn',
    }
  });

  await prisma.chapterImage.createMany({
    data: [
      { chapterId: slCh2.id, url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80', sortOrder: 0 },
      { chapterId: slCh2.id, url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80', sortOrder: 1 },
    ]
  });

  // Comic 2
  const onePiece = await prisma.comic.create({
    data: {
      title: 'One Piece (Vua Hải Tặc)',
      description: 'One Piece là câu chuyện kể về Gol D. Roger, người được mệnh danh` là Vua Hải Tặc. Trước khi bị hành hình, Roger tiết lộ rằng mình đã giấu toàn bộ kho báu của mình tại một nơi bí mật - kho báu vĩ đại nhất mang tên One Piece. Monkey D. Luffy, một cậu bé ăn phải Trái Ác Quỷ cao su, quyết định ra khơi để tìm kiếm kho báu và trở thành Vua Hải Tặc thế hệ tiếp theo.',
      status: 'ONGOING',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    }
  });

  const opCh1 = await prisma.chapter.create({
    data: {
      comicId: onePiece.id,
      chapterNumber: 1,
      title: 'Bình minh cuộc phiêu lưu',
    }
  });

  await prisma.chapterImage.createMany({
    data: [
      { chapterId: opCh1.id, url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop&q=80', sortOrder: 0 },
      { chapterId: opCh1.id, url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80', sortOrder: 1 },
      { chapterId: opCh1.id, url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&auto=format&fit=crop&q=80', sortOrder: 2 },
    ]
  });

  // Comic 3
  const demonSlayer = await prisma.comic.create({
    data: {
      title: 'Demon Slayer (Thanh Gươm Diệt Quỷ)',
      description: 'Kamado Tanjiro là một cậu bé hiền lành, thông minh sống cùng với gia đình trên núi. Mọi chuyện thay đổi hoàn toàn khi gia đình cậu bị quỷ sát hại, chỉ còn lại em gái Nezuko sống sót nhưng đã biến thành quỷ. Tanjiro quyết định gia nhập Sát Quỷ Đoàn để tìm cách biến em gái trở lại thành người và trả thù cho gia đình.',
      status: 'COMPLETED',
      thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80',
    }
  });

  const dsCh1 = await prisma.chapter.create({
    data: {
      comicId: demonSlayer.id,
      chapterNumber: 1,
      title: 'Tàn khốc và Hy vọng',
    }
  });

  await prisma.chapterImage.createMany({
    data: [
      { chapterId: dsCh1.id, url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80', sortOrder: 0 },
      { chapterId: dsCh1.id, url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&auto=format&fit=crop&q=80', sortOrder: 1 },
    ]
  });

  console.log('Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
