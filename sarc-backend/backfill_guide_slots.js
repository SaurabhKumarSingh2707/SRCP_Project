const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillFacultyGuideSlots() {
    try {
        // Find all faculty users who don't have a FacultyGuideSlot
        const facultyUsers = await prisma.user.findMany({
            where: {
                role: 'FACULTY',
                facultyGuideSlot: null
            },
            select: { id: true }
        });

        console.log(`Found ${facultyUsers.length} faculty members missing guide slots.`);

        if (facultyUsers.length === 0) {
            console.log("Nothing to backfill.");
            return;
        }

        const data = facultyUsers.map(f => ({
            facultyId: f.id,
            totalSlots: 7,
            usedSlots: 0
        }));

        const result = await prisma.facultyGuideSlot.createMany({
            data: data,
            skipDuplicates: true
        });

        console.log(`Successfully backfilled ${result.count} guide slots.`);
    } catch (error) {
        console.error("Error backfilling:", error);
    } finally {
        await prisma.$disconnect();
    }
}

backfillFacultyGuideSlots();
