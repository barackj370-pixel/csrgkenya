import { PrismaClient } from '@prisma/client';

let prisma: any;
try {
  prisma = new PrismaClient();
} catch {
  console.warn('[AI Studio] Database not connected — using mock');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
    count: async () => 0,
  };
  prisma = new Proxy({}, { get: () => noOp });
}

function getNextAssemblyDate() {
  const assemblies = [
    new Date(2026, 3, 30),
    new Date(2026, 5, 26),
    new Date(2026, 6, 30),
    new Date(2026, 8, 24),
    new Date(2026, 11, 10),
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return assemblies.find(d => {
    const dCopy = new Date(d);
    dCopy.setHours(0, 0, 0, 0);
    return dCopy >= today;
  }) || assemblies[0];
}

async function main() {
  const count = await prisma.ward.count();
  if (count > 0) {
    console.log('Database already seeded');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@csrg.ke',
      role: 'ADMIN',
    }
  });

  const wardsData = [
    { name: 'Kangemi', slug: 'kangemi', description: 'Nairobi County - Kangemi Ward' },
    { name: 'Kitusuru', slug: 'kitusuru', description: 'Nairobi County - Kitusuru Ward' },
    { name: 'Karura', slug: 'karura', description: 'Nairobi County - Karura Ward' },
    { name: 'Mountain View', slug: 'mountain-view', description: 'Nairobi County - Mountain View Ward' },
    { name: 'Parklands', slug: 'parklands', description: 'Nairobi County - Parklands Ward' },
    { name: 'South Sakwa', slug: 'south-sakwa', description: 'Migori County - South Sakwa Ward' },
    { name: 'Sikhendu', slug: 'sikhendu', description: 'Trans Nzoia County - Sikhendu Ward' },
  ];

  for (const ward of wardsData) {
    await prisma.ward.create({ data: ward });
  }

  const allWards = await prisma.ward.findMany();
  const nextAssemblyDate = getNextAssemblyDate();
  
  // Create Discussions for all wards on the same day
  for (const ward of allWards) {
    await prisma.discussion.create({
      data: {
        title: `Citizen Assembly - ${ward.name}`,
        description: 'Discussing pressing issues in the ward for the next assembly.',
        wardId: ward.id,
        date: nextAssemblyDate,
        status: 'UPCOMING',
        createdById: admin.id,
      }
    });
    
    // Only Sikhendu has Sibembe Food Coop registered for now. Other wards only have groups added by clerks or admin!
    const isSikhendu = ward.name.toLowerCase() === 'shikendu' || ward.slug === 'shikendu' || ward.name.toLowerCase() === 'sikhendu' || ward.slug === 'sikhendu';
    if (isSikhendu) {
      await prisma.group.create({
        data: {
          name: 'Sibembe Food Coop',
          wardId: ward.id,
          category: 'Agroecology & Food Sovereignty Cooperative',
          leaderName: 'Irene Nyongesa',
          meetingDay: 'Tuesday Oct 20, 2026 (10:00 AM – 12:00 PM • 2-Hour Deliberation)',
          meetingFrequency: 'Weekly Food Coop Caucus',
          members: 'Irene Nyongesa (Coop Leader)',
          memberCount: 1
        }
      });
    }
  }

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
