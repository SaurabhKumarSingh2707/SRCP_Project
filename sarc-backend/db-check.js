const { prisma } = require('./config/prismaClient');

async function check() {
    try {
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        console.log('GUIDE SELECTION CONFIG:', config);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
