const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const faculty = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
  if (!faculty) {
      console.log("No faculty user found in the database.");
      return;
  }
  const facultyId = faculty.id;
  const allocatedTeams = await prisma.team.findMany({
      where: {
          guideId: facultyId,
          status: { in: ['REQUESTED_GUIDE', 'APPROVED'] }
      },
      include: {
          leader: { select: { fullName: true, email: true } },
          members: {
              where: { inviteStatus: 'ACCEPTED' },
              include: {
                  user: { select: { fullName: true, email: true } }
              }
          }
      }
  });
  console.log(JSON.stringify(allocatedTeams, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
