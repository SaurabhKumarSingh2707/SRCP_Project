const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const faculties = await prisma.facultyProfile.findMany();
    let count = 0;
    for (const fac of faculties) {
        const existing = await prisma.facultyGuideSlot.findUnique({
            where: { facultyId: fac.userId }
        });
        if (!existing) {
            await prisma.facultyGuideSlot.create({
                data: { facultyId: fac.userId, totalSlots: 7, usedSlots: 0 }
            });
            count++;
        }
    }
    console.log(`Created slots for ${count} faculty`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
