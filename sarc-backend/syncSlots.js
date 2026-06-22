const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncSlots() {
    try {
        console.log("Synchronizing faculty guide slots...");
        
        // Find all faculty slots
        const slots = await prisma.facultyGuideSlot.findMany();
        
        for (const slot of slots) {
            // Count teams assigned to this faculty
            const teamCount = await prisma.team.count({
                where: {
                    guideId: slot.facultyId,
                    status: 'APPROVED'
                }
            });
            
            const requestedCount = await prisma.team.count({
                 where: {
                     guideId: slot.facultyId,
                     status: 'REQUESTED_GUIDE'
                 }
            });

            const totalUsed = teamCount + requestedCount;
            
            if (slot.usedSlots !== totalUsed) {
                console.log(`Updating faculty ${slot.facultyId}: ${slot.usedSlots} -> ${totalUsed}`);
                await prisma.facultyGuideSlot.update({
                    where: { facultyId: slot.facultyId },
                    data: { usedSlots: totalUsed }
                });
            }
        }
        
        console.log("Synchronization complete.");
    } catch (error) {
        console.error("Error syncing slots:", error);
    } finally {
        await prisma.$disconnect();
    }
}

syncSlots();
