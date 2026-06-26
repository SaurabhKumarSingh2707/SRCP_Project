const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSlots() {
    try {
        console.log("Fetching all faculty users...");
        const facultyUsers = await prisma.user.findMany({
            where: { role: 'FACULTY' },
            select: { id: true, email: true }
        });
        
        console.log(`Found ${facultyUsers.length} faculty users.`);

        const facultyGuideSlots = facultyUsers.map(f => ({
            facultyId: f.id,
            totalSlots: 7,
            usedSlots: 0
        }));

        if (facultyGuideSlots.length > 0) {
            const result = await prisma.facultyGuideSlot.createMany({
                data: facultyGuideSlots,
                skipDuplicates: true
            });
            console.log(`Successfully inserted/verified ${result.count} slots.`);
        } else {
            console.log("No slots to insert.");
        }
        
    } catch(e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

fixSlots();
