import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getNextAssemblyDate() {
  const assemblies = [
    new Date(2026, 3, 30),
    new Date(2026, 5, 26),
    new Date(2026, 6, 30),
    new Date(2026, 8, 24),
    new Date(2026, 9, 29),
    new Date(2026, 10, 26),
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
    
    // Create a sample group for each ward
    await prisma.group.create({
      data: {
        name: `${ward.name} Youth Group`,
        wardId: ward.id,
        leaderName: 'Jane Wanjiku',
        meetingDay: 'Wednesday',
        meetingFrequency: 'Weekly',
        members: 'Alice, Bob, Charlie',
        memberCount: 15
      }
    });
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
