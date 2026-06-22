const { prisma } = require('./config/prismaClient');

async function runCleanup() {
    try {
        console.log("Starting manual notification cleanup (DELETE ALL)...");
        
        const result = await prisma.notification.deleteMany({});
        
        console.log(`[Cleanup] Successfully deleted ${result.count} notifications (all of them).`);
    } catch (err) {
        console.error('[Cleanup Error] Failed to delete notifications:', err);
    } finally {
        await prisma.$disconnect();
    }
}

runCleanup();
